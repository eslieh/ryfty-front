from flask import Blueprint, Response
from utils.subscribe_manager import get_pubsub
import json

events_bp = Blueprint("events", __name__)

@events_bp.route("/events/<user_id>")
def stream(user_id):
    """
    Stream real-time events to the client via SSE (Server-Sent Events).
    """
    print(f"[SSE] New connection for user_id: {user_id}")

    pubsub = get_pubsub(user_id)  # subscribes to Redis channel user:{user_id}
    print(f"[SSE] Subscribed to Redis channel: user:{user_id}")

    def event_stream(pubsub):
        try:
            for message in pubsub.listen():
                print(f"[SSE] Received message: {message}")

                if message["type"] == "message":
                    data = message["data"]
                    print(f"[SSE] Sending data to client: {data}")

                    yield f"data: {data}\n\n"

                    # Optional: stop listening if event indicates completion
                    try:
                        payload = json.loads(data)
                        if payload.get("status", {}).get("state") == "success":
                            print("[SSE] Transaction completed — closing stream.")
                            break
                    except Exception as e:
                        print(f"[SSE] JSON decode error: {e}")
        except Exception as e:
            print(f"[SSE] Stream error: {e}")
        finally:
            pubsub.close()
            print(f"[SSE] Closed Redis pubsub for user_id: {user_id}")

    return Response(event_stream(pubsub), content_type="text/event-stream")
