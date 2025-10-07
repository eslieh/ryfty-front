from models import db, Experience, Slot, User, ApiCollection, Reservation
from flask import current_app, request
from flask_restful import Resource
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import joinedload, selectinload, contains_eager
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from functools import wraps
from datetime import datetime, timedelta


class ProviderReservations(Resource):
    
    @staticmethod
    def _validate_provider_access(user_id):
        """Validate provider access with caching using ORM"""
        cache_key = f"user_role:{user_id}"
        cache = current_app.cache
        
        try:
            cached_role = cache.get(cache_key)
            if cached_role == 'provider':
                return True
            elif cached_role is not None:
                return False
        except Exception:
            pass
        
        # Query database using ORM
        user = db.session.query(User).filter(User.id == user_id).first()
        if not user or user.role != 'provider':
            # Cache negative result to avoid repeated queries
            try:
                cache.set(cache_key, user.role if user else 'not_found', timeout=3600)
            except Exception:
                pass
            return False
        
        # Cache the role
        try:
            cache.set(cache_key, user.role, timeout=3600)  # Cache role for 1 hour
        except Exception:
            pass
        
        return True
    
    @staticmethod
    def _validate_experience_ownership(user_id, experience_id):
        """Validate that provider owns the experience using ORM"""
        cache_key = f"experience_owner:{experience_id}:{user_id}"
        cache = current_app.cache
        
        try:
            cached_ownership = cache.get(cache_key)
            if cached_ownership is not None:
                return cached_ownership
        except Exception:
            pass
        
        # Check ownership using ORM
        experience = db.session.query(Experience).filter(
            and_(
                Experience.id == experience_id,
                Experience.provider_id == user_id
            )
        ).first()
        
        exists = experience is not None
        
        # Cache the result
        try:
            cache.set(cache_key, exists, timeout=1800)  # Cache for 30 minutes
        except Exception:
            pass
        
        return exists
    
    @staticmethod
    def _get_reservation_count(user_id, experience_id, status_filter=None):
        """Get total reservation count using ORM"""
        query = db.session.query(func.count(Reservation.id)).join(
            Experience, Reservation.experience_id == Experience.id
        ).filter(
            and_(
                Experience.provider_id == user_id,
                Reservation.experience_id == experience_id
            )
        )
        
        if status_filter:
            query = query.filter(Reservation.status == status_filter)
        
        return query.scalar()
    
    @staticmethod
    def _get_total_revenue(user_id, experience_id, status_filter=None):
        """Calculate total revenue from reservations using ORM"""
        query = db.session.query(
            func.coalesce(func.sum(Reservation.amount_paid), 0)
        ).join(
            Experience, Reservation.experience_id == Experience.id
        ).filter(
            and_(
                Experience.provider_id == user_id,
                Reservation.experience_id == experience_id
            )
        )
        
        if status_filter:
            query = query.filter(Reservation.status == status_filter)
        
        total = query.scalar()
        return float(total) if total else 0.0
    
    @staticmethod
    def _format_reservation_data(reservations):
        """Format reservation data for JSON response"""
        result = []
        for res in reservations:
            formatted_res = {
                "id": str(res.id),
                "user": {
                    "id": str(res.user.id),
                    "name": res.user.name,
                    "email": res.user.email,
                    "phone": res.user.phone,
                    "avatar_url": res.user.avatar_url
                },
                "experience": {
                    "id": str(res.experience.id),
                    "title": res.experience.title
                },
                "slot": {
                    "id": str(res.slot.id),
                    "name": res.slot.name,
                    "start_time": res.slot.start_time.isoformat() if res.slot.start_time else None,
                    "end_time": res.slot.end_time.isoformat() if res.slot.end_time else None
                },
                "num_people": res.quantity,
                "total_price": float(res.total_price) if res.total_price else 0.0,
                "amount_paid": float(res.amount_paid) if res.amount_paid else 0.0,
                "status": res.status,
                "created_at": res.created_at.isoformat() if res.created_at else None
            }
            result.append(formatted_res)
        return result
    
    @jwt_required()
    def get(self, experience_id):
        user_id = get_jwt_identity()
        
        # Validate provider access
        if not self._validate_provider_access(user_id):
            return {"error": "Unauthorized"}, 403
        
        # Validate experience ownership
        if not self._validate_experience_ownership(user_id, experience_id):
            return {"error": "Experience not found or unauthorized"}, 404
        
        # Parse query parameters for pagination and filtering
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)  # Max 100 per page
        status_filter = request.args.get('status')
        
        # Build optimized ORM query with proper eager loading
        query = db.session.query(Reservation).join(
            Experience, Reservation.experience_id == Experience.id
        ).filter(
            and_(
                Experience.provider_id == user_id,
                Reservation.experience_id == experience_id
            )
        )
        
        # Add status filter if provided
        if status_filter:
            query = query.filter(Reservation.status == status_filter)
        
        # Use selectinload for better performance with related objects
        # This prevents N+1 queries by loading related objects in separate queries
        query = query.options(
            selectinload(Reservation.user),
            selectinload(Reservation.experience),
            selectinload(Reservation.slot)
        ).order_by(desc(Reservation.created_at))
        
        # Get total count and revenue before applying pagination
        total_count = self._get_reservation_count(user_id, experience_id, status_filter)
        total_revenue = self._get_total_revenue(user_id, experience_id, status_filter)
        
        # Apply pagination using ORM
        reservations = query.offset((page - 1) * per_page).limit(per_page).all()
        
        # Format the data
        result = self._format_reservation_data(reservations)
        
        response_data = {
            "reservations": result,
            "total_revenue": total_revenue,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "pages": (total_count + per_page - 1) // per_page
            }
        }
        
        return response_data, 200


# Alternative ORM implementation with even better performance using contains_eager
class ProviderReservationsOptimized(Resource):
    
    @staticmethod
    def _get_reservation_count_for_slot(user_id, experience_id, slot_id, status_filter=None):
        """Get total reservation count for a specific slot using ORM"""
        query = db.session.query(func.count(Reservation.id)).join(
            Experience, Reservation.experience_id == Experience.id
        ).filter(
            and_(
                Experience.provider_id == user_id,
                Reservation.experience_id == experience_id,
                Reservation.slot_id == slot_id
            )
        )
        
        if status_filter:
            query = query.filter(Reservation.status == status_filter)
        
        return query.scalar()
    
    @staticmethod
    def _get_total_revenue_for_slot(user_id, experience_id, slot_id, status_filter=None):
        """Calculate total revenue from reservations for a specific slot"""
        query = db.session.query(
            func.coalesce(func.sum(Reservation.amount_paid), 0)
        ).join(
            Experience, Reservation.experience_id == Experience.id
        ).filter(
            and_(
                Experience.provider_id == user_id,
                Reservation.experience_id == experience_id,
                Reservation.slot_id == slot_id
            )
        )
        
        if status_filter:
            query = query.filter(Reservation.status == status_filter)
        
        total = query.scalar()
        return float(total) if total else 0.0
    
    @jwt_required()
    def get(self, experience_id, slot_id):
        user_id = get_jwt_identity()
        
        # Validate access (reuse methods from above class)
        # if not ProviderReservations._validate_provider_access(user_id):
        #     return {"error": "Unauthorized"}, 403
        
        # if not ProviderReservations._validate_experience_ownership(user_id, experience_id):
        #     return {"error": "Experience not found or unauthorized"}, 404
        
        # Parse query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        status_filter = request.args.get('status')
        
        # Advanced ORM query using contains_eager for optimal joins
        # This approach uses JOIN with contains_eager to load related objects in a single query
        query = db.session.query(Reservation).join(
            User, Reservation.user_id == User.id
        ).join(
            Experience, Reservation.experience_id == Experience.id  
        ).join(
            Slot, Reservation.slot_id == Slot.id
        ).filter(
            and_(
                Experience.provider_id == user_id,
                Reservation.experience_id == experience_id,
                Reservation.slot_id == slot_id
            )
        )
        
        # Add status filter if provided
        if status_filter:
            query = query.filter(Reservation.status == status_filter)
        
        # Use contains_eager to tell SQLAlchemy that the related objects 
        # are already loaded via the JOINs
        query = query.options(
            contains_eager(Reservation.user),
            contains_eager(Reservation.experience),
            contains_eager(Reservation.slot)
        ).order_by(desc(Reservation.created_at))
        
        # Get total count and revenue for this specific slot
        total_count = self._get_reservation_count_for_slot(
            user_id, experience_id, slot_id, status_filter
        )
        total_revenue = self._get_total_revenue_for_slot(
            user_id, experience_id, slot_id, status_filter
        )
        
        # Apply pagination
        reservations = query.offset((page - 1) * per_page).limit(per_page).all()
        
        # Format results using the same formatting method
        result = ProviderReservations._format_reservation_data(reservations)
        
        return {
            "reservations": result,
            "total_revenue": total_revenue,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "pages": (total_count + per_page - 1) // per_page
            }
        }, 200