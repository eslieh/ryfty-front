import json
import jwt
import logging
from datetime import datetime, timedelta
from flask import request, current_app
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Reservation
from workers.checkin_workers import load_reservations_to_memory, sync_checkins_to_db
from dotenv import load_dotenv
import os   
load_dotenv()

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv('SECRET_KEY', 'super-secret')  # Replace with ENV var in production


# ------------------------------
#  DEVICE AUTHORIZATION RESOURCE
# ------------------------------
class DeviceAuthorization(Resource):
    @jwt_required()
    def post(self):
        """Event organizer authorizes a check-in device."""
        provider_id = get_jwt_identity()
        args = request.get_json()

        provider = User.query.get(provider_id)
        if not provider or provider.role != "provider":
            return {"error": "Unauthorized"}, 403

        experience_id = args.get("experience_id")
        slot_id = args.get("slot_id")
        device_name = args.get("device_name")

        if not all([experience_id, slot_id, device_name]):
            return {"error": "experience_id, slot_id, and device_name are required"}, 400

        payload = {
            "role": "checkin_device",
            "experience_id": experience_id,
            "slot_id": slot_id,
            "device_name": device_name,
            "authorized_by": provider_id,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=8),
        }
        # Inside DeviceAuthorization.post()
        redis = current_app.redis

        device_data = {
            "device_name": device_name,
            "experience_id": experience_id,
            "slot_id": slot_id,
            "authorized_by": provider_id,
            "authorized_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=8)).isoformat(),
            "active": True,
        }

        # Key: authorized_devices:<provider_id>
        redis.hset(f"authorized_devices:{provider_id}", device_name, json.dumps(device_data))

        device_jwt = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        # Trigger async load of reservations into Redis memory
        load_reservations_to_memory.delay(experience_id, slot_id)

        return {
            "device_token": device_jwt,
            "expires_in": "8h",
        }, 200

class DeauthorizeDevice(Resource):
    @jwt_required()
    def post(self):
        """Deauthorize a previously authorized device."""
        provider_id = get_jwt_identity()
        redis = current_app.redis
        args = request.get_json()

        device_name = args.get("device_name")
        if not device_name:
            return {"error": "Device name is required"}, 400

        key = f"authorized_devices:{provider_id}"
        device_data_raw = redis.hget(key, device_name)

        if not device_data_raw:
            return {"error": "Device not found"}, 404

        # Remove the device completely from the hash
        redis.hdel(key, device_name)

        # Optionally, add to revoked set for faster token invalidation
        redis.sadd("revoked_devices", f"{provider_id}:{device_name}")

        return {"message": f"Device '{device_name}' has been deauthorized and removed"}, 200


class AuthorizedDevices(Resource):
    @jwt_required()
    def get(self):
        """List all devices authorized by the provider."""
        provider_id = get_jwt_identity()
        redis = current_app.redis

        devices = redis.hgetall(f"authorized_devices:{provider_id}")
        if not devices:
            return {"devices": []}, 200

        result = []
        for _, value in devices.items():
            data = json.loads(value)
            result.append(data)

        return {"devices": result}, 200
    
# --------------------------
#  DEVICE VERIFICATION
# --------------------------
def verify_device_token(token):
    """Decode and validate device JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") != "checkin_device":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


class DeviceVerification(Resource):
    def post(self):
        args = request.get_json()
        token = args.get("token")

        if not token:
            return {"error": "Token is required"}, 400

        payload = verify_device_token(token)
        if not payload:
            return {"error": "Invalid or expired token"}, 400

        # load_reservations_to_memory.delay(payload.get("experience_id"), payload.get("slot_id"))
        return {
            "message": "Device verified successfully",
            "experience_id": payload.get("experience_id"),
            "slot_id": payload.get("slot_id"),
            "device_name": payload.get("device_name"),
            "authorized_by": payload.get("authorized_by"),
        }, 200
    

# --------------------------
# CHECK-IN RESOURCE
# --------------------------
# In your checkin resource file, update the CheckIn class:

class CheckIn(Resource):
    def post(self):
        """Perform fast check-in using device JWT + Redis cache."""
        redis = current_app.redis
        args = request.get_json()
        token = request.headers.get("Authorization")

        if not token or not token.startswith("Bearer "):
            return {"error": "Missing or invalid authorization header"}, 401

        token = token.split(" ")[1]
        payload = verify_device_token(token)
        if not payload:
            return {"error": "Invalid or expired token"}, 401

        experience_id = payload.get("experience_id")
        slot_id = payload.get("slot_id")
        reservation_id = args.get("reservation_id")

        if not reservation_id:
            return {"error": "Reservation ID is required"}, 400

        redis_key = f"reservations:experience:{experience_id}:slot:{slot_id}"
        pending_key = f"pending_updates:experience:{experience_id}:slot:{slot_id}"

        # Retrieve reservation from Redis
        data = redis.hget(redis_key, reservation_id)
        if not data:
            return {"error": "Reservation not found in memory"}, 404

        reservation = json.loads(data)
        if reservation.get("checked_in"):
            return {"error": "Already checked in"}, 400

        # Mark as checked in
        reservation["checked_in"] = True
        reservation["checkin_time"] = datetime.utcnow().isoformat()

        # Save back to Redis and track pending syncs
        pipe = redis.pipeline(transaction=True)
        pipe.hset(redis_key, reservation_id, json.dumps(reservation))
        pipe.sadd(pending_key, reservation_id)
        pipe.execute()

        logger.info(f"✅ Device {payload['device_name']} checked in {reservation['user_name']}")

        # Count stats
        total_reservations = redis.hlen(redis_key)
        unchecked_count = sum(
            1 for r in redis.hvals(redis_key)
            if not json.loads(r).get("checked_in")
        )
        pending_count = redis.scard(pending_key)

        # --------------------------
        # 🔁 Adaptive Sync Strategy
        # --------------------------
        if total_reservations < 50:
            batch_threshold = 4
        elif total_reservations < 1000:
            batch_threshold = 20
        elif total_reservations < 10000:
            batch_threshold = 50
        else:
            batch_threshold = 200

        if pending_count >= batch_threshold or unchecked_count == 0:
            logger.info(
                f"🚀 Triggering DB sync for {pending_count} check-ins "
                f"(threshold {batch_threshold}, unchecked={unchecked_count})"
            )
            sync_checkins_to_db.delay(pending_key, redis_key)
            # ❌ REMOVED: redis.delete(pending_key)
            # ✅ Let the worker delete it after successful sync

        return {
            "message": f"{reservation['user_name']} checked in successfully",
            "reservation_id": reservation_id,
            "number_of_guests": reservation.get("quantity"),
            "checked_in": True,
            "pending_count": pending_count,
            "unchecked_remaining": unchecked_count,
            "batch_threshold": batch_threshold,
        }, 200