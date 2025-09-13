from models import db, Experience, Slot, Reservation
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import and_, or_
from flask import current_app, request
from flask_restful import Resource
import json 

class Experiences(Resource):
    CACHE_TIMEOUT = 300  # seconds (5 minutes)

    def _get_experiences_from_cache(self):
        cache = current_app.cache
        cached_data = cache.get("experiences")

        if cached_data:
            return json.loads(cached_data)

        experiences = Experience.query.all()
        experiences_list = []
        for exp in experiences:
            experiences_list.append({
                "id": str(exp.id),
                "title": exp.title,
                "description": exp.description,
                "price": float(exp.price),
                "location": exp.location,
                "created_at": exp.created_at.isoformat()
            })

        cache.set("experiences", json.dumps(experiences_list), timeout=self.CACHE_TIMEOUT)
        return experiences_list

    @jwt_required()
    def get(self):
        experiences = self._get_experiences_from_cache()
        return {"experiences": experiences}, 200