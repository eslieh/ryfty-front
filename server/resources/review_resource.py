from flask import request, current_app
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Review, Experience, Reservation, User
import json
import hashlib
from datetime import datetime, timedelta


class ExperienceReviewsResource(Resource):
    def get(self, experience_id):
        """Get all reviews for an experience with caching"""
        cache = current_app.cache
        
        # Parse query parameters for pagination and filtering
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)  # Cap at 100
        sort_by = request.args.get('sort_by', 'created_at')  # created_at, rating
        order = request.args.get('order', 'desc')  # desc, asc
        min_rating = request.args.get('min_rating', type=int)
        
        # Create cache key based on all parameters
        cache_params = {
            'experience_id': experience_id,
            'page': page,
            'per_page': per_page,
            'sort_by': sort_by,
            'order': order,
            'min_rating': min_rating
        }
        cache_key_raw = json.dumps(cache_params, sort_keys=True)
        cache_key = f"reviews:{hashlib.md5(cache_key_raw.encode()).hexdigest()}"
        
        # Try to get from cache first
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result, 200
        
        try:
            # Build base query with joins to get user and experience data
            query = (
                db.session.query(Review, User, Experience)
                .join(User, Review.user_id == User.id)
                .join(Experience, Review.experience_id == Experience.id)
                .filter(Review.experience_id == experience_id)
            )
            
            # Apply rating filter if specified
            if min_rating is not None:
                query = query.filter(Review.rating >= min_rating)
            
            # Apply sorting
            if sort_by == 'rating':
                if order == 'asc':
                    query = query.order_by(Review.rating.asc(), Review.created_at.desc())
                else:
                    query = query.order_by(Review.rating.desc(), Review.created_at.desc())
            else:  # default to created_at
                if order == 'asc':
                    query = query.order_by(Review.created_at.asc())
                else:
                    query = query.order_by(Review.created_at.desc())
            
            # Get total count for pagination (separate optimized query)
            total_count = (
                db.session.query(func.count(Review.id))
                .filter(Review.experience_id == experience_id)
                .filter(Review.rating >= min_rating if min_rating is not None else True)
                .scalar()
            )
            
            # Apply pagination
            offset = (page - 1) * per_page
            results = query.offset(offset).limit(per_page).all()
            
            # Optimize serialization with list comprehension including user and experience data
            reviews_list = [
                {
                    "id": str(review.id),
                    "user": {
                        "id": str(user.id),
                        "name": user.name,
                        "avatar_url": user.avatar_url
                    },
                    "experience": {
                        "id": str(experience.id),
                        "title": experience.title
                    },
                    "reservation_id": str(review.reservation_id) if review.reservation_id else None,
                    "rating": review.rating,
                    "comment": review.comment,
                    "images": review.images,
                    "created_at": review.created_at.isoformat(),
                }
                for review, user, experience in results
            ]
            
            # Calculate pagination info
            total_pages = (total_count + per_page - 1) // per_page
            has_next = page < total_pages
            has_prev = page > 1
            
            result = {
                "reviews": reviews_list,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total_count": total_count,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_prev": has_prev
                }
            }
            
            # Cache result for 5 minutes (adjust based on your needs)
            cache.set(cache_key, result, timeout=300)
            
            return result, 200
            
        except Exception as e:
            return {"error": f"Failed to fetch reviews: {str(e)}"}, 500


class PostReviewResource(Resource):
    @jwt_required()
    def post(self, experience_id):
        """Authenticated user posts a review for an experience"""
        cache = current_app.cache
        
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            rating = data.get("rating")
            comment = data.get("comment", None)
            images = data.get("images", None)
            reservation_id = data.get("reservation_id", None)
            
            # Basic validation
            if not rating or not (1 <= rating <= 5):
                return {"error": "Rating must be between 1 and 5"}, 400
            
            # Ensure experience exists (with caching)
            experience_cache_key = f"experience:{experience_id}"
            experience = cache.get(experience_cache_key)
            
            if experience is None:
                experience = Experience.query.get(experience_id)
                if not experience:
                    return {"error": "Experience not found"}, 404
                # Cache experience for 10 minutes
                cache.set(experience_cache_key, experience, timeout=600)
            
            # Check for duplicate reviews (prevent spam)
            existing_review = Review.query.filter_by(
                user_id=user_id,
                experience_id=experience_id,
                reservation_id=reservation_id
            ).first()
            
            if existing_review:
                return {"error": "You have already reviewed this experience"}, 409
            
            # (Optional) Ensure user booked this experience before reviewing
            if reservation_id:
                reservation = Reservation.query.filter_by(
                    id=reservation_id,
                    user_id=user_id,
                    experience_id=experience_id
                ).first()
                if not reservation:
                    return {"error": "You can only review your own reservation"}, 403
            
            # Create review
            review = Review(
                user_id=user_id,
                experience_id=experience_id,
                reservation_id=reservation_id,
                rating=rating,
                comment=comment,
                images=images
            )
            db.session.add(review)
            
            # Update experience stats
            db.session.flush()  # get review persisted so stats calc sees it
            experience.update_review_stats()
            
            db.session.commit()
            
            # Get user data for response
            user = User.query.get(user_id)
            
            # Invalidate related caches after successful review creation
            self._invalidate_review_caches(experience_id, cache)
            
            return {
                "message": "Review posted successfully",
                "review": {
                    "id": str(review.id),
                    "user": {
                        "id": str(user.id),
                        "name": user.name,
                        "avatar_url": user.avatar_url
                    },
                    "experience": {
                        "id": str(experience.id),
                        "title": experience.title
                    },
                    "rating": review.rating,
                    "comment": review.comment,
                    "images": review.images,
                    "created_at": review.created_at.isoformat()
                },
                "experience_stats": {
                    "avg_rating": experience.avg_rating,
                    "reviews_count": experience.reviews_count
                }
            }, 201
            
        except Exception as e:
            db.session.rollback()
            return {"error": f"Failed to post review: {str(e)}"}, 500
    
    def _invalidate_review_caches(self, experience_id, cache):
        """Invalidate all cached reviews for this experience"""
        try:
            # Since we can't easily enumerate all cache keys, we'll use a timestamp approach
            # Set a cache invalidation timestamp for this experience
            invalidation_key = f"reviews_invalidated:{experience_id}"
            cache.set(invalidation_key, datetime.utcnow().timestamp(), timeout=3600)
            
            # Also invalidate the experience cache
            experience_cache_key = f"experience:{experience_id}"
            cache.delete(experience_cache_key)
            
        except Exception as e:
            # Log error but don't fail the request
            current_app.logger.warning(f"Cache invalidation failed: {str(e)}")


class ExperienceStatsResource(Resource):
    @jwt_required()
    def get(self, experience_id):
        """Get cached experience review statistics"""
        cache = current_app.cache
        
        cache_key = f"experience_stats:{experience_id}"
        cached_stats = cache.get(cache_key)
        
        if cached_stats:
            return cached_stats, 200
        
        try:
            # Get aggregated stats in a single query
            stats_query = (
                db.session.query(
                    func.avg(Review.rating).label('avg_rating'),
                    func.count(Review.id).label('total_reviews'),
                    func.count(func.distinct(Review.user_id)).label('unique_reviewers')
                )
                .filter(Review.experience_id == experience_id)
                .first()
            )
            
            # Get rating distribution
            rating_distribution = (
                db.session.query(
                    Review.rating,
                    func.count(Review.id).label('count')
                )
                .filter(Review.experience_id == experience_id)
                .group_by(Review.rating)
                .all()
            )
            
            stats = {
                "avg_rating": float(stats_query.avg_rating) if stats_query.avg_rating else 0,
                "total_reviews": stats_query.total_reviews,
                "unique_reviewers": stats_query.unique_reviewers,
                "rating_distribution": {
                    str(rating): count for rating, count in rating_distribution
                }
            }
            
            # Cache for 10 minutes
            cache.set(cache_key, stats, timeout=600)
            
            return stats, 200
            
        except Exception as e:
            return {"error": f"Failed to fetch experience stats: {str(e)}"}, 500