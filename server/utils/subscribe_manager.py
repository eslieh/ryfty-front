from flask import current_app
import json
from datetime import datetime


def get_pubsub(user_id: str):
    """
    Subscribe to a Redis channel named after the user_id.
    Each user has their own event stream.
    """
    r = current_app.redis
    pubsub = r.pubsub()
    pubsub.subscribe(f"user:{user_id}")
    return pubsub


def push_to_queue(user_id: str, payload: dict, event_type: str = "generic_event"):
    """
    Publish an event to a user's Redis pub/sub channel.
    
    Args:
        user_id (str): The user receiving the event.
        payload (dict): Any data payload to send.
        event_type (str): Optional tag describing the event type.
    """
    r = current_app.redis

    event_payload = {
        "type": event_type,
        "data": payload,
        "sent_at": datetime.utcnow().isoformat()
    }

    r.publish(f"user:{user_id}", json.dumps(event_payload))
