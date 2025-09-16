from models import db, Experience, Slot, User, ApiCollection, Reservation
from flask import current_app, request
from flask_restful import Resource
from sqlalchemy import func, desc
from sqlalchemy.orm import joinedload
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import jwt_required
from workers.initiate_mpesa import initiate_payment
import json
from decimal import Decimal 
from datetime import datetime, timedelta

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

        if (slot.capacity - slot.booked) < num_people:
            return {"error": "Not enough available spots"}, 400
        
        api_collection = ApiCollection(
            user_id=user_id,
            slot_id=slot_id,
            experience_id=experience_id,
            quantity=num_people,
            mpesa_number=mpesa_number,
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
        if amount_paid >= reservation.total_price:
            return {"error": "Reservation is already fully paid"}, 400
        
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