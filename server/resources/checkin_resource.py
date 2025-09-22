from models import User, Reservation, Experience, db, Slot
from flask import request, current_app, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, and_, update
from sqlalchemy.orm import joinedload, selectinload, contains_eager
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import json
from functools import wraps
from datetime import datetime, timedelta
import redis
import logging

# Configure logging for performance monitoring
logger = logging.getLogger(__name__)

def cache_result(timeout=300, key_prefix=""):
    """Decorator for caching API responses with better error handling"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            cache = current_app.cache
            
            # Generate cache key including query parameters
            query_params = request.args.to_dict() if request else {}
            cache_key = f"{key_prefix}:{':'.join(map(str, args[1:]))}:{':'.join(f'{k}={v}' for k, v in query_params.items())}"
            
            # Try to get from cache
            try:
                cached_data = cache.get(cache_key)
                if cached_data:
                    current_app.logger.debug(f"Cache hit for key: {cache_key}")
                    if isinstance(cached_data, (str, bytes, bytearray)):
                        return {"reservations": json.loads(cached_data)}, 200
                    if isinstance(cached_data, dict):
                        return cached_data, 200
            except Exception as e:
                current_app.logger.warning(f"Cache retrieval error: {e}")
            
            # Execute function and cache result
            result = f(*args, **kwargs)
            
            # Cache successful responses
            if result[1] == 200:
                try:
                    cache.set(cache_key, result[0], timeout=timeout)
                    current_app.logger.debug(f"Cached result for key: {cache_key}")
                except Exception as e:
                    current_app.logger.warning(f"Cache storage error: {e}")
            
            return result
        return decorated_function
    return decorator

class CheckinResource(Resource):
    @staticmethod
    def _validate_provider_access(user_id):
        """Validate provider access with aggressive caching using Redis"""
        cache_key = f"user_role:{user_id}"
        cache = current_app.cache
        
        try:
            # Try Redis first for fastest access
            cached_role = cache.get(cache_key)
            if cached_role == 'provider':
                return True
            elif cached_role is not None:
                return False
        except Exception:
            pass
        
        # Single optimized query with minimal data transfer
        try:
            user_role = db.session.query(User.role).filter(User.id == user_id).scalar()
            
            if not user_role or user_role != 'provider':
                # Cache negative result to avoid repeated queries
                try:
                    cache.set(cache_key, user_role or 'not_found', timeout=7200)  # 2 hours
                except Exception:
                    pass
                return False
            
            # Cache the role for longer since roles rarely change
            try:
                cache.set(cache_key, user_role, timeout=7200)  # 2 hours cache
            except Exception:
                pass
            
            return True
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in provider validation: {e}")
            return False
    
    @staticmethod
    def _validate_experience_ownership(user_id, experience_id):
        """Ultra-fast experience ownership validation with Redis caching"""
        cache_key = f"exp_owner:{experience_id}:{user_id}"
        cache = current_app.cache
        
        try:
            cached_ownership = cache.get(cache_key)
            if cached_ownership is not None:
                return cached_ownership == '1'  # Redis stores as string
        except Exception:
            pass
        
        try:
            # Single scalar query - fastest possible
            exists = db.session.query(
                db.session.query(Experience.id).filter(
                    and_(
                        Experience.id == experience_id,
                        Experience.provider_id == user_id
                    )
                ).exists()
            ).scalar()
            
            # Cache the result with longer TTL since ownership rarely changes
            try:
                cache.set(cache_key, '1' if exists else '0', timeout=3600)  # 1 hour
            except Exception:
                pass
            
            return exists
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in ownership validation: {e}")
            return False
    
    @staticmethod
    def _get_reservation_for_checkin(reservation_id, experience_id):
        """Optimized reservation fetch with selective loading"""
        try:
            # Single query with only necessary joins and fields
            reservation = db.session.query(Reservation).options(
                # Only load what we need - using class-bound attributes
                joinedload(Reservation.user).load_only(User.name, User.email, User.id, User.avatar_url),
                joinedload(Reservation.slot).load_only(Slot.name, Slot.date, Slot.start_time)
            ).filter(
                and_(
                    Reservation.id == reservation_id,
                    Reservation.experience_id == experience_id,
                    Reservation.status.in_(['confirmed', 'pending']),  # Only allow check-in for these statuses
                    Reservation.revocked == False  # Not revoked
                )
            ).first()
            
            return reservation
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in reservation fetch: {e}")
            return None
    
    @jwt_required()
    def post(self, experience_id):
        """Lightning-fast check-in endpoint"""
        start_time = datetime.utcnow()
        data = request.get_json()
        
        try:
            user_id = get_jwt_identity()
            reservation_id = data.get('reservation_id')
            if not reservation_id:
                return {"error": "reservation id is required to complete ths request"}, 400
            # Step 1: Validate provider access (cached)
            if not self._validate_provider_access(user_id):
                return {'error': 'Unauthorized. Provider access required.'}, 403
            
            # Step 2: Validate experience ownership (cached)
            if not self._validate_experience_ownership(user_id, experience_id):
                return {'error': 'Experience not found or access denied.'}, 404
            
            print(reservation_id)
            # Step 3: Get and validate reservation
            reservation = self._get_reservation_for_checkin(reservation_id, experience_id)
            
            if not reservation:
                return {'error': 'Reservation not found or not eligible for check-in.'}, 404
            
            # Step 4: Check if already checked in
            if reservation.checked_in:
                return {
                    'message': 'Already checked in',
                    'reservation': {
                        'id': str(reservation.id),
                        'user_name': reservation.user.name,
                        'avatar_url': reservation.user.avatar_url,
                        'checked_in_at': reservation.update_at.isoformat() if reservation.update_at else None,
                        'status': 'already_checked_in'
                    }
                }, 200
            
            # Step 5: Ultra-fast update using bulk update (fastest method)
            try:
                rows_updated = db.session.execute(
                    update(Reservation)
                    .where(Reservation.id == reservation_id)
                    .values(
                        checked_in=True,
                        update_at=datetime.utcnow(),
                        status='confirmed' if reservation.status == 'pending' else reservation.status
                    )
                )
                
                if rows_updated.rowcount == 0:
                    db.session.rollback()
                    return {'error': 'Check-in failed. Reservation may have been modified.'}, 409
                
                # Commit immediately for fastest response
                db.session.commit()
                
                # Invalidate relevant caches asynchronously
                try:
                    cache = current_app.cache
                    # Clear reservation-related caches
                    cache_patterns = [
                        f"reservations:user:{reservation.user_id}*",
                        f"reservations:experience:{experience_id}*",
                        f"reservations:slot:{reservation.slot_id}*"
                    ]
                    
                    # Use pipeline for batch cache operations
                    if hasattr(cache, 'delete_pattern'):
                        for pattern in cache_patterns:
                            cache.delete_pattern(pattern)
                except Exception as cache_error:
                    # Don't let cache errors affect the main operation
                    logger.warning(f"Cache invalidation error: {cache_error}")
                
                # Calculate response time for monitoring
                response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
                
                return {
                    'message': 'Check-in successful',
                    'reservation': {
                        'id': str(reservation.id),
                        'user_name': reservation.user.name,
                        'avatar_url': reservation.user.avatar_url,
                        'user_email': reservation.user.email,
                        'slot_name': reservation.slot.name,
                        'slot_date': reservation.slot.date.isoformat(),
                        'slot_time': reservation.slot.start_time.strftime('%H:%M'),
                        'quantity': reservation.quantity,
                        'checked_in_at': datetime.utcnow().isoformat(),
                        'status': 'checked_in'
                    },
                    'meta': {
                        'response_time_ms': round(response_time, 2),
                        'timestamp': datetime.utcnow().isoformat()
                    }
                }, 200
                
            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Integrity error during check-in: {e}")
                return {'error': 'Check-in failed due to data conflict.'}, 409
                
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Database error during check-in: {e}")
                return {'error': 'Check-in failed. Please try again.'}, 500
                
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error in check-in: {e}")
            return {'error': 'An unexpected error occurred.'}, 500
            
        finally:
            # Ensure session is clean
            try:
                db.session.close()
            except:
                pass

    @jwt_required()
    def get(self, experience_id, slot_id=None):
        """Get all reservations for an experience with check-in status"""
        try:
            user_id = get_jwt_identity()
            
            # Validate provider access
            if not self._validate_provider_access(user_id):
                return {'error': 'Unauthorized. Provider access required.'}, 403
            
            # Validate experience ownership
            if not self._validate_experience_ownership(user_id, experience_id):
                return {'error': 'Experience not found or access denied.'}, 404
            
            if slot_id:
                
                # Get reservations with optimized query and slot id
                reservations = db.session.query(Reservation).options(
                    joinedload(Reservation.user).load_only(User.id, User.name, User.email, User.phone, User.avatar_url),
                    joinedload(Reservation.slot).load_only(Slot.id, Slot.name, Slot.date, Slot.start_time, Slot.end_time)
                ).filter(
                    and_(
                        Reservation.experience_id == experience_id,
                        Reservation.status.in_(['confirmed', 'pending']),
                        Reservation.checked_in == True,
                        Reservation.slot_id == slot_id,
                        Reservation.revocked == False
                    )
                ).order_by(
                    Reservation.slot_id,
                    Reservation.created_at
                ).all()
            else:
                reservations = db.session.query(Reservation).options(
                    joinedload(Reservation.user).load_only(User.id, User.name, User.email, User.phone, User.avatar_url),
                    joinedload(Reservation.slot).load_only(Slot.id, Slot.name, Slot.date, Slot.start_time, Slot.end_time)
                ).filter(
                    and_(
                        Reservation.experience_id == experience_id,
                        Reservation.status.in_(['confirmed', 'pending']),
                        Reservation.checked_in == True,
                        Reservation.revocked == False
                    )
                ).order_by(
                    Reservation.slot_id,
                    Reservation.created_at
                ).all()
            
            # Format response for fast rendering
            reservation_list = []
            for res in reservations:
                reservation_list.append({
                    'id': str(res.id),
                    'user': {
                        'id': str(res.user.id),
                        'name': res.user.name,
                        'email': res.user.email,
                        'phone': res.user.phone,
                        'avatar_url': res.user.avatar_url
                        
                    },
                    'slot': {
                        'id': str(res.slot.id),
                        'name': res.slot.name,
                        'date': res.slot.date.isoformat(),
                        'start_time': res.slot.start_time.strftime('%H:%M'),
                        'end_time': res.slot.end_time.strftime('%H:%M')
                    },
                    'quantity': res.quantity,
                    'status': res.status,
                    'checked_in': res.checked_in,
                    'checked_in_at': res.update_at.isoformat() if res.checked_in and res.update_at else None,
                    'total_price': float(res.total_price)
                })
            
            return {
                'reservations': reservation_list,
                'total_count': len(reservation_list),
                'checked_in_count': sum(1 for r in reservation_list if r['checked_in']),
                'pending_count': sum(1 for r in reservation_list if not r['checked_in'])
            }, 200
            
        except Exception as e:
            logger.error(f"Error fetching reservations: {e}")
            return {'error': 'Failed to fetch reservations.'}, 500

