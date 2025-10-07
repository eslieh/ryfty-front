import logging
import json
from datetime import datetime
from celery_app import celery
from flask import current_app
from models import db, Reservation, Slot
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


@celery.task(bind=True, name="workers.load_reservations_to_memory", max_retries=3, default_retry_delay=30)
def load_reservations_to_memory(self, experience_id, slot_id):
    """
    Loads reservations for a given experience/slot into Redis for fast check-in.
    """
    try:
        with current_app.app_context():
            redis = current_app.redis

            reservations = (
                Reservation.query.options(
                    selectinload(Reservation.user),
                    selectinload(Reservation.slot).selectinload(Slot.experience),
                )
                .filter(
                    Reservation.checked_in != True,
                    Reservation.revocked != True,
                    Reservation.experience_id == experience_id,
                    Reservation.slot_id == slot_id,
                )
                .all()
            )

            if not reservations:
                logger.info(f"No reservations found for experience {experience_id}, slot {slot_id}")
                return

            redis_key = f"reservations:experience:{experience_id}:slot:{slot_id}"
            pipe = redis.pipeline(transaction=True)
            for reservation in reservations:
                pipe.hset(
                    redis_key,
                    str(reservation.id),
                    json.dumps({
                        "id": str(reservation.id),
                        "user_id": str(reservation.user.id),
                        "user_name": reservation.user.name,
                        "quantity": reservation.quantity,
                        "status": reservation.status,
                        "checked_in": reservation.checked_in,
                        "checkin_time": None
                    })
                )

            pipe.expire(redis_key, 6 * 3600)  # expire after 6 hours
            pipe.execute()

            logger.info(f"✅ Loaded {len(reservations)} reservations into Redis key {redis_key}")

    except Exception as e:
        logger.exception(f"❌ Failed to load reservations for experience {experience_id}, slot {slot_id}: {e}")
        raise self.retry(exc=e)


@celery.task(bind=True, name="workers.sync_checkins_to_db", max_retries=3, default_retry_delay=30)
def sync_checkins_to_db(self, pending_key, redis_key):
    """
    Syncs all checked-in reservations from Redis → DB in bulk.
    Uses RENAME to atomically move pending items to a processing set,
    preventing lost updates when new check-ins happen during sync.
    """
    try:
        with current_app.app_context():
            redis = current_app.redis
            
            # Create unique processing key using Celery task ID
            processing_key = f"{pending_key}:processing:{self.request.id}"
            
            # Atomically rename pending → processing
            # New check-ins will accumulate in the original pending_key
            try:
                redis.rename(pending_key, processing_key)
            except Exception as e:
                # pending_key doesn't exist (already processed or no items)
                logger.info(f"No pending items to sync for {pending_key}: {e}")
                return
            
            # Now safely process the snapshot
            reservation_ids = redis.smembers(processing_key)
            if not reservation_ids:
                logger.info(f"Processing key {processing_key} is empty")
                redis.delete(processing_key)
                return

            updates = []
            for r_id in reservation_ids:
                # Handle bytes from Redis
                r_id_str = r_id.decode('utf-8') if isinstance(r_id, bytes) else r_id
                
                data = redis.hget(redis_key, r_id_str)
                if not data:
                    logger.warning(f"Reservation {r_id_str} not found in {redis_key}")
                    continue

                # Handle bytes from Redis
                data_str = data.decode('utf-8') if isinstance(data, bytes) else data
                reservation = json.loads(data_str)
                
                if reservation.get("checked_in"):
                    checkin_time = reservation.get("checkin_time")
                    if isinstance(checkin_time, str):
                        checkin_time = datetime.fromisoformat(checkin_time)
                    elif checkin_time is None:
                        checkin_time = datetime.utcnow()
                    
                    updates.append({
                        "id": r_id_str,
                        "checked_in": True,
                        "checkin_time": checkin_time
                    })

            if updates:
                db.session.bulk_update_mappings(Reservation, updates)
                db.session.commit()
                logger.info(f"✅ Synced {len(updates)}/{len(reservation_ids)} check-ins from {redis_key} to DB")
            else:
                logger.warning(f"No valid check-ins to sync from {redis_key}")

            # Clean up processing key after successful sync
            redis.delete(processing_key)
            logger.info(f"🧹 Cleaned up processing key {processing_key}")

    except Exception as e:
        db.session.rollback()
        logger.exception(f"❌ Failed to sync check-ins from {pending_key}: {e}")
        # Don't delete processing_key on error - it can be retried
        raise self.retry(exc=e)