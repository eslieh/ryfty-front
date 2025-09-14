from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_caching import Cache
from models import db, User, Experience, Slot
from datetime import datetime, date
from flask import request, current_app
from marshmallow import Schema, fields, ValidationError, validate, validates_schema, post_dump
from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal
from functools import wraps
import json
import uuid
from typing import Optional
from dataclasses import dataclass
import logging

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class CachedUser:
    """Cached user data object"""
    id: str
    email: str
    name: str
    avatar_url: Optional[str]
    bio: Optional[str]
    role: str
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create CachedUser from dictionary"""
        return cls(
            id=data.get('id'),
            email=data.get('email'),
            name=data.get('name'),
            avatar_url=data.get('avatar_url'),
            bio=data.get('bio'),
            role=data.get('role')
        )
    
    @classmethod
    def from_user_model(cls, user):
        """Create CachedUser from User model instance"""
        return cls(
            id=str(user.id),
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            bio=user.bio,
            role=user.role
        )

# --- Serialization Schemas ---
class ExperienceSchema(Schema):
    id = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    description = fields.Str(missing="", validate=validate.Length(max=2000))
    destinations = fields.List(fields.Str(), missing=list)
    activities = fields.List(fields.Str(), missing=list)
    inclusions = fields.List(fields.Str(), missing=list)
    exclusions = fields.List(fields.Str(), missing=list)
    poster_image_url = fields.Url(required=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(allow_none=True)
    status = fields.Str(missing="draft", validate=validate.OneOf(["draft", "published", "archived"]))
    meeting_point = fields.Dict(missing=dict)
    provider_id = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    def validate_dates(self, data, **kwargs):
        """Validate that end_date is after start_date"""
        if data.get("end_date") and data.get("start_date"):
            if data["end_date"] < data["start_date"]:
                raise ValidationError("End date must be after start date")



class ExperienceListSchema(Schema):
    id = fields.Str()
    title = fields.Str()
    status = fields.Str()
    start_date = fields.Date()
    end_date = fields.Date()
    poster_image_url = fields.Url()
    created_at = fields.DateTime()

class SlotSchema(Schema):
    id = fields.Str(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    capacity = fields.Int(required=True, validate=validate.Range(min=1, max=1000))
    booked = fields.Int(missing=0, validate=validate.Range(min=0))
    price = fields.Decimal(required=True, places=2, validate=validate.Range(min=0))
    date = fields.Date(required=True)

    # New time fields
    start_time = fields.Time(required=True)  
    end_time = fields.Time(required=True)  
    timezone = fields.Str(required=True, validate=validate.Length(min=2, max=64))

    experience_id = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates_schema
    def validate_booking(self, data, **kwargs):
        if data.get("booked", 0) > data.get("capacity", 0):
            raise ValidationError("Booked count cannot exceed capacity")
        if "start_time" in data and "end_time" in data:
            if data["end_time"] <= data["start_time"]:
                raise ValidationError("End time must be after start time")

    @post_dump
    def convert_decimal_to_float(self, data, **kwargs):
        """Convert Decimal to float for JSON serialization"""
        if "price" in data and isinstance(data["price"], Decimal):
            data["price"] = float(data["price"])
        return data

    
# Initialize schemas
experience_schema = ExperienceSchema()
experience_list_schema = ExperienceListSchema(many=True)
slot_schema = SlotSchema()

# --- Decorators and Utilities ---
def handle_db_errors(f):
    """Decorator to handle database errors"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in {f.__name__}: {str(e)}")
            return {"error": "Database operation failed"}, 500
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error in {f.__name__}: {str(e)}")
            return {"error": "An unexpected error occurred"}, 500
    return decorated

def validate_json(schema):
    """Decorator to validate JSON input"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                data = request.get_json()
                if not data:
                    return {"error": "No JSON data provided"}, 400
                validated_data = schema.load(data)
                return f(validated_data=validated_data, *args, **kwargs)
            except ValidationError as e:
                return {"error": "Validation failed", "details": e.messages}, 400
        return decorated
    return decorator

def get_current_user():
    """Get current user with caching - returns CachedUser dataclass"""
    user_id = get_jwt_identity()
    cache_key = f"user:{user_id}"
    cache = current_app.cache

    cached_data = cache.get(cache_key)
    if cached_data:
        # Handle JSON string, bytes, or already a dict
        if isinstance(cached_data, (str, bytes, bytearray)):
            user_data = json.loads(cached_data)
            return CachedUser.from_dict(user_data)
        elif isinstance(cached_data, dict):
            return CachedUser.from_dict(cached_data)
        elif isinstance(cached_data, CachedUser):
            return cached_data

    # If not cached, query DB
    user = User.query.get(user_id)
    if not user:
        return None

    # Create user object
    cached_user = CachedUser.from_user_model(user)
    
    # Cache as JSON string for cross-backend compatibility
    user_info = {
        "id": cached_user.id,
        "email": cached_user.email,
        "name": cached_user.name,
        "avatar_url": cached_user.avatar_url,
        "bio": cached_user.bio,
        "role": cached_user.role,
    }
    cache.set(cache_key, json.dumps(user_info), timeout=300)
    
    return cached_user



def provider_required(f):
    """Decorator to ensure user is a provider"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return {"error": "User not found"}, 404
        # Fix: Access attribute instead of dictionary key
        if user.role != "provider":
            return {"error": "Only providers can perform this action"}, 403
        return f(user=user, *args, **kwargs)
    return decorated

def cache_key_experience_list(user_id):
    """Generate cache key for experience list"""
    return f"experiences:provider:{user_id}"

def cache_key_experience(experience_id):
    """Generate cache key for single experience"""
    return f"experience:{experience_id}"

def invalidate_experience_cache(user_id, experience_id=None):
    cache = current_app.cache
    """Invalidate experience-related cache"""
    cache.delete(cache_key_experience_list(user_id))
    if experience_id:
        cache.delete(cache_key_experience(experience_id))

# --- Experience Management ---
class ExperienceList(Resource):
    
    @jwt_required()
    @provider_required
    @validate_json(experience_schema)
    @handle_db_errors
    def post(self, user, validated_data):
        """Create a new experience (provider only)"""
        
        # Additional business logic validation
        if validated_data["start_date"] < date.today():
            return {"error": "Start date cannot be in the past"}, 400
        
        experience = Experience(
            id=uuid.uuid4(),
            provider_id=user.id,
            **validated_data
        )
        
        db.session.add(experience)
        db.session.commit()
        
        # Invalidate cache
        invalidate_experience_cache(user.id)
        
        # Log activity
        logger.info(f"Experience created by provider {user.id}: {experience.id}")
        
        return {
            "message": "Experience created successfully",
            "experience": experience_schema.dump(experience)
        }, 201

    @jwt_required()
    @provider_required
    @handle_db_errors
    def get(self, user):
        cache = current_app.cache
        """List provider's own experiences with caching"""
        
        cache_key = cache_key_experience_list(user.id)
        experiences_data = cache.get(cache_key)
        
        if not experiences_data:
            experiences = (Experience.query
                         .filter_by(provider_id=user.id)
                         .order_by(Experience.created_at.desc())
                         .all())
            experiences_data = experience_list_schema.dump(experiences)
            cache.set(cache_key, experiences_data, timeout=600)  # Cache for 10 minutes
        
        return {
            "experiences": experiences_data,
            "total": len(experiences_data)
        }, 200

class ExperienceDetail(Resource):
    
    @jwt_required()
    @provider_required
    @handle_db_errors
    def get(self, user, experience_id):
        """Get a single experience with caching"""
        
        cache_key = cache_key_experience(experience_id)
        experience_data = current_app.cache.get(cache_key)
        
        if not experience_data:
            experience = Experience.query.filter_by(
                id=experience_id, 
                provider_id=user.id
            ).first()
            
            if not experience:
                return {"error": "Experience not found"}, 404
            
            experience_data = experience_schema.dump(experience)
            current_app.cache.set(cache_key, experience_data, timeout=600)
        
        return {"experience": experience_data}, 200

    @jwt_required()
    @provider_required
    # @validate_json(experience_schema)
    @handle_db_errors
    def patch(self, user, experience_id):
        """Update an experience with flexible validation"""
        
        experience = Experience.query.filter_by(
            id=experience_id, 
            provider_id=user.id
        ).first()
        
        if not experience:
            return {"error": "Experience not found"}, 404
        
        # Get and validate JSON data
        try:
            data = request.get_json()
            if not data:
                return {"error": "No JSON data provided"}, 400
            
            # Use partial=True to allow updating only some fields
            validated_data = experience_schema.load(data, partial=True)
            
        except ValidationError as e:
            return {"error": "Validation failed", "details": e.messages}, 400
        
        # Additional validation for published experiences
        if (experience.status == "published" and 
            validated_data.get("start_date") and 
            validated_data["start_date"] < date.today()):
            return {"error": "Cannot change start date of published experience to past date"}, 400
        
        # Update fields
        for field, value in validated_data.items():
            setattr(experience, field, value)
        
        experience.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Invalidate cache
        invalidate_experience_cache(user.id, experience_id)
        
        logger.info(f"Experience updated by provider {user.id}: {experience_id}")
        
        return {
            "message": "Experience updated successfully",
            "experience": experience_schema.dump(experience)
        }, 200

    @jwt_required()
    @provider_required
    @handle_db_errors
    def delete(self, user, experience_id):
        """Delete an experience"""
        
        experience = Experience.query.filter_by(
            id=experience_id, 
            provider_id=user.id
        ).first()
        
        if not experience:
            return {"error": "Experience not found"}, 404
        
        # Check if experience has bookings
        total_bookings = sum(slot.booked for slot in experience.slots)
        if total_bookings > 0:
            return {"error": "Cannot delete experience with active bookings"}, 400
        
        db.session.delete(experience)
        db.session.commit()
        
        # Invalidate cache
        invalidate_experience_cache(user.id, experience_id)
        
        logger.info(f"Experience deleted by provider {user.id}: {experience_id}")
        
        return {"message": "Experience deleted successfully"}, 200

# --- Slot Management ---
class SlotList(Resource):
    
    @jwt_required()
    @handle_db_errors
    def post(self, experience_id):
        """Add a slot to an experience"""
        
        # Get current user
        user = get_current_user()
        if not user:
            return {"error": "User not found"}, 404
        
        if user.role != "provider":
            return {"error": "Only providers can perform this action"}, 403
        
        # Validate JSON input
        try:
            data = request.get_json()
            if not data:
                return {"error": "No JSON data provided"}, 400
            
            validated_data = slot_schema.load(data)
        except ValidationError as e:
            return {"error": "Validation failed", "details": e.messages}, 400
        
        # Check if experience exists and belongs to user
        experience = Experience.query.filter_by(
            id=experience_id, 
            provider_id=user.id
        ).first()
        
        if not experience:
            return {"error": "Experience not found"}, 404
        
        # Validate slot date is within experience date range
        slot_date = validated_data["date"]
        if slot_date < experience.start_date:
            return {"error": "Slot date cannot be before experience start date"}, 400
        
        if experience.end_date and slot_date > experience.end_date:
            return {"error": "Slot date cannot be after experience end date"}, 400
        
        # Create slot
        slot = Slot(
            id=uuid.uuid4(),
            experience_id=experience.id,
            **validated_data
        )
        
        db.session.add(slot)
        db.session.commit()
        
        # Invalidate experience cache
        invalidate_experience_cache(user.id, experience_id)
        
        logger.info(f"Slot created by provider {user.id} for experience {experience_id}: {slot.id}")
        
        return {
            "message": "Slot created successfully",
            "slot": slot_schema.dump(slot)
        }, 201

    @jwt_required()
    @handle_db_errors
    def get(self, experience_id):
        """Get all slots for an experience"""
        
        # Get current user
        user = get_current_user()
        if not user:
            return {"error": "User not found"}, 404
        
        if user.role != "provider":
            return {"error": "Only providers can perform this action"}, 403
        
        experience = Experience.query.filter_by(
            id=experience_id, 
            provider_id=user.id
        ).first()
        
        if not experience:
            return {"error": "Experience not found"}, 404
        
        slots = Slot.query.filter_by(experience_id=experience_id).order_by(Slot.date).all()
        
        return {
            "slots": slot_schema.dump(slots, many=True),
            "total": len(slots)
        }, 200

class SlotDetail(Resource):
    
    @jwt_required()
    @provider_required
    # @validate_json(slot_schema)
    @handle_db_errors
    def patch(self, user, slot_id):
        """Update a slot"""
        
        slot = (Slot.query
               .join(Experience)
               .filter(Slot.id == slot_id, Experience.provider_id == user.id)
               .first())
        
        if not slot:
            return {"error": "Slot not found"}, 404
        
        validated_data = request.get_json()
        # Prevent reducing capacity below booked amount
        if ("capacity" in validated_data and 
            validated_data["capacity"] < slot.booked):
            return {"error": "Cannot reduce capacity below current bookings"}, 400
        
        # Update fields
        for field, value in validated_data.items():
            setattr(slot, field, value)
        
        slot.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Invalidate experience cache
        invalidate_experience_cache(user.id, slot.experience_id)
        
        logger.info(f"Slot updated by provider {user.id}: {slot_id}")
        
        return {
            "message": "Slot updated successfully",
            "slot": slot_schema.dump(slot)
        }, 200

    @jwt_required()
    @provider_required
    @handle_db_errors
    def delete(self, user, slot_id):
        """Delete a slot"""
        
        slot = (Slot.query
               .join(Experience)
               .filter(Slot.id == slot_id, Experience.provider_id == user.id)
               .first())
        
        if not slot:
            return {"error": "Slot not found"}, 404
        
        # Check if slot has bookings
        if slot.booked > 0:
            return {"error": "Cannot delete slot with active bookings"}, 400
        
        experience_id = slot.experience_id
        db.session.delete(slot)
        db.session.commit()
        
        # Invalidate experience cache
        invalidate_experience_cache(user.id, experience_id)
        
        logger.info(f"Slot deleted by provider {user.id}: {slot_id}")
        
        return {"message": "Slot deleted successfully"}, 200

# --- Bulk Operations ---
class ExperienceBulkOperations(Resource):
    
    @jwt_required()
    @provider_required
    @handle_db_errors
    def patch(self, user):
        """Bulk update experience status"""
        
        data = request.get_json()
        if not data or "experience_ids" not in data or "status" not in data:
            return {"error": "experience_ids and status are required"}, 400
        
        experience_ids = data["experience_ids"]
        new_status = data["status"]
        
        if new_status not in ["draft", "published", "archived"]:
            return {"error": "Invalid status"}, 400
        
        updated_count = (Experience.query
                        .filter(Experience.id.in_(experience_ids))
                        .filter_by(provider_id=user.id)
                        .update({Experience.status: new_status}, 
                               synchronize_session=False))
        
        db.session.commit()
        
        # Invalidate cache
        invalidate_experience_cache(user.id)
        
        logger.info(f"Bulk status update by provider {user.id}: {updated_count} experiences")
        
        return {
            "message": f"{updated_count} experiences updated successfully",
            "updated_count": updated_count
        }, 200