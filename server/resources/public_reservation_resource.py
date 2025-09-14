from models import db, Experience, Slot, User
from flask import current_app, request
from flask_restful import Resource
from sqlalchemy import func, desc
from sqlalchemy.orm import joinedload
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import jwt_required
import json
from decimal import Decimal 
from datetime import datetime, timedelta

class PublicReservationResource(Resource):
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        args = request.get_json()
        slot_id = args.get("slot_id")
        num_people = args.get("num_people", 1)
        price = args.get("price", 0.0)
        mpesa_number = args.get("mpesa_number")

        if not num_people  or not slot_id:
            return {"error": "Num off people and slot_id are required"}, 400

        slot = Slot.query.get(slot_id)
        if not slot:
            return {"error": "Slot not found"}, 404

        if slot.available_spots < num_people:
            return {"error": "Not enough available spots"}, 400

        # Here you would create a Reservation model instance and save it to the database
        # For simplicity, we'll just simulate this action

        return {"message": "Reservation request was successfull, initiating mpesa"}, 201