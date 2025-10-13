from flask import request, current_app
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload, load_only
from models import db, Review, Experience, Reservation, User
import json
import hashlib
from datetime import datetime, timedelta
from uuid import UUID


class ExperienceReviewsResource(Resource):
    def get(self, experience_id):
        """Get all reviews for an experience with optimized caching and queries"""
        cache = current_app.cache

        # Parse and validate request parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        sort_by = request.args.get('sort_by', 'created_at')
        order = request.args.get('order', 'desc')
        min_rating = request.args.get('min_rating', type=int)

        # Create optimized cache key using md5 hash
        cache_key = f"reviews:{experience_id}:{page}:{per_page}:{sort_by}:{order}:{min_rating or 0}"
        cache_key_hash = f"reviews:{hashlib.md5(cache_key.encode()).hexdigest()}"

        # Try to get from cache first
        cached_result = cache.get(cache_key_hash)
        if cached_result:
            return cached_result, 200

        try:
            # Optimized query with selective column loading
            base_query = (
                db.session.query(
                    Review.id,
                    Review.rating,
                    Review.comment,
                    Review.images,
                    Review.created_at,
                    Review.reservation_id,
                    User.id.label('user_id'),
                    User.name.label('user_name'),
                    User.avatar_url,
                    Experience.id.label('experience_id'),
                    Experience.title.label('experience_title')
                )
                .join(User, Review.user_id == User.id)
                .join(Experience, Review.experience_id == Experience.id)
                .filter(Review.experience_id == experience_id)
            )

            # Apply rating filter if specified
            if min_rating is not None:
                base_query = base_query.filter(Review.rating >= min_rating)

            # Apply sorting
            if sort_by == 'rating':
                base_query = base_query.order_by(
                    Review.rating.asc() if order == 'asc' else Review.rating.desc(),
                    Review.created_at.desc()
                )
            else:
                base_query = base_query.order_by(
                    Review.created_at.asc() if order == 'asc' else Review.created_at.desc()
                )

            # Get total count efficiently (use window function alternative or subquery)
            # For better performance, we can cache the count separately or use a subquery
            count_query = (
                db.session.query(func.count(Review.id))
                .filter(Review.experience_id == experience_id)
            )
            if min_rating is not None:
                count_query = count_query.filter(Review.rating >= min_rating)
            
            total_count = count_query.scalar() or 0

            # Calculate pagination
            offset = (page - 1) * per_page
            total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 0
            has_next = page < total_pages
            has_prev = page > 1

            # Execute paginated query
            results = base_query.offset(offset).limit(per_page).all()

            # Build response with pre-converted strings (most efficient)
            reviews_list = []
            for row in results:
                review_data = {
                    "id": str(row.id),
                    "user": {
                        "id": str(row.user_id),
                        "name": row.user_name,
                        "avatar_url": row.avatar_url
                    },
                    "experience": {
                        "id": str(row.experience_id),
                        "title": row.experience_title
                    },
                    "reservation_id": str(row.reservation_id) if row.reservation_id else None,
                    "rating": row.rating,
                    "comment": row.comment,
                    "images": row.images if isinstance(row.images, list) else [],
                    "created_at": row.created_at.isoformat() if isinstance(row.created_at, datetime) else row.created_at,
                }
                reviews_list.append(review_data)

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

            # Cache for 5 minutes
            cache.set(cache_key_hash, result, timeout=300)
            return result, 200

        except Exception as e:
            current_app.logger.error(f"Error fetching reviews for experience {experience_id}: {str(e)}")
            return {"error": "Failed to fetch reviews"}, 500


class ExperienceReviewStatsResource(Resource):
    """Separate resource for review statistics with longer cache"""
    
    def get(self, experience_id):
        """Get aggregated review statistics for an experience"""
        cache = current_app.cache
        cache_key = f"review_stats:{experience_id}"
        
        cached_stats = cache.get(cache_key)
        if cached_stats:
            return cached_stats, 200
        
        try:
            stats = db.session.query(
                func.count(Review.id).label('total_reviews'),
                func.avg(Review.rating).label('average_rating'),
                func.min(Review.rating).label('min_rating'),
                func.max(Review.rating).label('max_rating')
            ).filter(Review.experience_id == experience_id).first()
            
            # Get rating distribution
            rating_dist = db.session.query(
                Review.rating,
                func.count(Review.id).label('count')
            ).filter(
                Review.experience_id == experience_id
            ).group_by(Review.rating).all()
            
            result = {
                "total_reviews": stats.total_reviews or 0,
                "average_rating": round(float(stats.average_rating), 2) if stats.average_rating else 0.0,
                "min_rating": stats.min_rating or 0,
                "max_rating": stats.max_rating or 0,
                "rating_distribution": {
                    str(rating): count for rating, count in rating_dist
                }
            }
            
            # Cache for 10 minutes (stats change less frequently)
            cache.set(cache_key, result, timeout=600)
            return result, 200
            
        except Exception as e:
            current_app.logger.error(f"Error fetching review stats for experience {experience_id}: {str(e)}")
            return {"error": "Failed to fetch review statistics"}, 500

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
            images = data.get("images", {})
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