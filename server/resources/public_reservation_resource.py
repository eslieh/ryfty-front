from models import db, Experience, Slot, User, ApiCollection, Reservation
from flask import current_app, request
from flask_restful import Resource
from sqlalchemy import func, desc
from sqlalchemy.orm import joinedload
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, and_, update
from sqlalchemy.orm import joinedload, selectinload, contains_eager
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.dialects.postgresql import JSONB
from workers.initiate_mpesa import initiate_payment
import json
from decimal import Decimal 
from datetime import datetime, timedelta
import logging

# Configure logging for performance monitoring
logger = logging.getLogger(__name__)

class PublicReservationResource(Resource):
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        args = request.get_json()
        slot_id = args.get("slot_id")
        experience_id = args.get("experience_id")
        num_people = args.get("num_people", 1)
        amount = args.get("amount", 0.0)
        mpesa_number = args.get("mpesa_number")

        if not num_people  or not slot_id:
            return {"error": "Num off people and slot_id are required"}, 400

        slot = Slot.query.get(slot_id)
        if not slot:
            return {"error": "Slot not found"}, 404

        if int(slot.capacity - slot.booked) < int(num_people):
            return {"error": "Not enough available spots"}, 400
        
        api_collection = ApiCollection(
            user_id=user_id,
            slot_id=slot_id,
            experience_id=experience_id,
            quantity=num_people,
            mpesa_number=mpesa_number,
            amount=Decimal(amount) * Decimal(num_people),
            status="PENDING"
        )
        try:
            db.session.add(api_collection)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {"error": "Failed to create payment request: " + str(e)}, 500

        # -----------------------
        # Initiate payment asynchronously
        # -----------------------
        
        initiate_payment.delay(api_collection.id)
        
        

        # Here you would create a Reservation model instance and save it to the database
        # For simplicity, we'll just simulate this action

        return {"message": "Reservation request was successfull, initiating mpesa"}, 201
    
class InstallmentReservationResource(Resource):
    @jwt_required()
    def post(self, reservation_id):
        user_id = get_jwt_identity()
        args = request.get_json()
        amount = args.get("amount", 0.0)
        mpesa_number = args.get("mpesa_number")

        num_people = 1
        
        if not amount  or not reservation_id:
            return {"error": "Amount and reservation_id are required"}, 400
        
        reservation = db.session.query(Reservation).filter_by(id=reservation_id, user_id=user_id).first()
        if not reservation:
            return {"error": "Reservation not found"}, 404
    

        amount_paid = reservation.amount_paid
        
        remaining = reservation.total_price - amount_paid
        
        if amount_paid >= reservation.total_price:
            return {"error": "Reservation is already fully paid"}, 400
        
        if Decimal(amount)  > remaining:
            return {"error": f"The amount entered is more than the required, to finish the installment please pay KES{str(remaining)} "}
        
        
        api_collection = ApiCollection(
            user_id=user_id,
            slot_id=reservation.slot_id,
            experience_id=reservation.experience_id,
            quantity=num_people,
            mpesa_number=mpesa_number,
            reservation_id=reservation_id,
            amount=Decimal(amount) * num_people,
            status="PENDING"
        )
        try:
            db.session.add(api_collection)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {"error": "Failed to create payment request: " + str(e)}, 500

        # -----------------------
        # Initiate payment asynchronously
        # -----------------------
        
        initiate_payment.delay(api_collection.id)
        
        

        # Here you would create a Reservation model instance and save it to the database
        # For simplicity, we'll just simulate this action

        return {"message": "partial reservation request was successfull, initiating mpesa"}, 201
    
    
class GetReservationsPublic(Resource):
    @jwt_required()
    def get(self, reservation_id=None):
        try:
            user_id = get_jwt_identity()
            cache = current_app.cache

            # Build cache key
            if reservation_id:
                cache_key = f"reservation:{user_id}:{reservation_id}"
            else:
                cache_key = f"reservations:{user_id}"

            # Try to get from cache
            cached_data = cache.get(cache_key)
            if cached_data:
                return cached_data, 200

            # Query DB
            query = db.session.query(Reservation).options(
                joinedload(Reservation.experience).load_only(
                    Experience.id,
                    Experience.title,
                    Experience.description,
                    Experience.meeting_point,
                    Experience.poster_image_url
                ),
                joinedload(Reservation.slot).load_only(
                    Slot.id,
                    Slot.name,
                    Slot.date,
                    Slot.start_time,
                    Slot.end_time
                )
            )

            if reservation_id:
                query = query.filter(
                    and_(
                        Reservation.id == reservation_id,
                        Reservation.user_id == user_id,
                        # Reservation.status.in_(['confirmed', 'pending']),
                    )
                )
            else:
                query = query.filter(Reservation.user_id == user_id)

            reservations = query.order_by(Reservation.created_at).all()

            # Format response for fast rendering
            reservation_list = []
            for res in reservations:
                reservation_list.append({
                    'id': str(res.id),
                    'experience': {
                        'id': str(res.experience.id),
                        'title': res.experience.title,
                        'description': res.experience.description,
                        'meeting_point': res.experience.meeting_point,  # JSON column works fine
                        'poster_image_url': res.experience.poster_image_url
                    },
                    'quantity': res.quantity,
                    'status': res.status,
                    'amount_paid': float(res.amount_paid),
                    'checked_in': res.checked_in,
                    'checked_in_at': res.update_at.isoformat() if res.checked_in and res.update_at else None,
                    'total_price': float(res.total_price)
                })

            response = {
                'reservations': reservation_list,
                'total_count': len(reservation_list)
            }

            # Save to cache
            cache.set(cache_key, response, timeout=3600)

            return response, 200

        except Exception as e:
            logger.error(f"Error fetching reservations: {e}")
            return {'error': 'Failed to fetch reservations.'}, 500
