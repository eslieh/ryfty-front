from flask import redirect, jsonify, url_for, request
from flask_restful import Resource
from flask_dance.contrib.google import google
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from models import db, User
from flask_bcrypt import Bcrypt
import phonenumbers
from datetime import datetime
from urllib.parse import urlencode

bcrypt = Bcrypt()
class GoogleAuth(Resource):
    def get(self):
        if not google.authorized:
            return redirect(url_for("google.login"))

        resp = google.get("/oauth2/v2/userinfo")
        if not resp.ok:
            return {"error": "Failed to fetch user info from Google"}, 400

        user_info = resp.json()
        email = user_info["email"]
        name = user_info.get("name", "")
        profile = user_info.get("picture", "")

        # Check if user exists, else create
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, name=name, avator_url=profile)
            db.session.add(user)
            db.session.commit()

        # Create JWT token
        access_token = create_access_token(identity=str(user.id))
        # redirect_url = f"https://blubbb.vercel.app/auth?{urlencode({'token': access_token, 'email': user.email, 'id': user.id, 'name': user.name, 'avatar_url': user.avatar_url})}"
        # return redirect(redirect_url)
        return {"access_token": access_token, "user": {"id": str(user.id), "email": user.email, "avatar_url":user.avator_url, "name": user.name}}, 200


class Login(Resource):
    def post(self):
        args = request.get_json()
        identifier = args.get("identifier")  # can be email or phone
        password = args.get("password")
        
        if not identifier or not password:
            return {"error": "Identifier (email/phone) and password required"}, 400

        user = None

        # If identifier looks like an email
        if "@" in identifier:
            user = User.query.filter_by(email=identifier).first()
        else:
            # Try parsing as phone number (normalize to E.164)
            try:
                parsed_phone = phonenumbers.parse(identifier, "KE")  # default KE
                if phonenumbers.is_valid_number(parsed_phone):
                    normalized_phone = phonenumbers.format_number(
                        parsed_phone, phonenumbers.PhoneNumberFormat.E164
                    )
                    user = User.query.filter_by(phone=normalized_phone).first()
            except phonenumbers.NumberParseException:
                return {"error": "Invalid phone number format"}, 400

        if user and user.password and bcrypt.check_password_hash(user.password, password):
            access_token = create_access_token(identity=str(user.id))
            return {
                "access_token": access_token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "phone": user.phone,
                    "name": user.name,
                    "avatar_url": user.avator_url
                }
            }, 200

        return {"error": "Invalid credentials"}, 401



class Register(Resource):
    def post(self):
        args = request.get_json()
        email = args.get('email')
        phone = args.get('phone')
        password = args.get('password')
        name = args.get('name', '')
        role = args.get('role', 'customer')

        if not email and not phone:
            return {"error": "Email or phone is required"}, 400

        # Validate phone if provided
        parsed_phone = None
        if phone:
            try:
                parsed_phone = phonenumbers.parse(phone, "KE")  # default region KE (Kenya) – adjust if needed
                if not phonenumbers.is_valid_number(parsed_phone):
                    return {"error": "Invalid phone number"}, 400
                # Normalize phone to E.164 format (+2547...)
                phone = phonenumbers.format_number(parsed_phone, phonenumbers.PhoneNumberFormat.E164)
            except phonenumbers.NumberParseException:
                return {"error": "Invalid phone number format"}, 400

        if email and User.query.filter_by(email=email).first():
            return {"error": "Email already registered"}, 400
        if phone and User.query.filter_by(phone=phone).first():
            return {"error": "Phone already registered"}, 400

        if not password:
            return {"error": "Password is required"}, 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(
            email=email,
            phone=phone,
            password=hashed_password,
            name=name,
            role=role
        )
        db.session.add(new_user)
        db.session.commit()

        return {"message": "User registered successfully"}, 201

