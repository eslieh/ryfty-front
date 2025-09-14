import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from flask import Flask
from flask_restful import Api
from flask_caching import Cache
from flask_jwt_extended import JWTManager
from flask_dance.contrib.google import make_google_blueprint
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_cors import CORS
import redis
import ssl

from config import Config
from models import db
from flask_restful import Resource

# Import your resources
from resources.auth import GoogleAuth, Login, Register
from resources.user_info import UserInfo
from resources.experiences import ExperienceList, ExperienceDetail, SlotList, SlotDetail
from resources.experiences_public import PublicExperienceList, PublicExperienceDetail, TrendingExperiences

import sqlalchemy.pool
from celery_app import celery
import json
from decimal import Decimal

from celery_app import init_celery
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)
    
    app.config.from_object(Config)
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "poolclass": sqlalchemy.pool.NullPool
    }

    # Extensions
    db.init_app(app)
    # ✅ All keys in UPPERCASE
    app.config.update(
        CELERY_BROKER_URL= app.config["CELERY_BROKER_URL"],
        CELERY_RESULT_BACKEND=app.config["CELERY_RESULT_BACKEND"],
        BROKER_USE_SSL={"ssl_cert_reqs": ssl.CERT_NONE},
        CELERY_REDIS_BACKEND_USE_SSL={"ssl_cert_reqs": ssl.CERT_NONE}
    )
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, Decimal):
                return float(obj)
            return super().default(obj)
        
    app.json_encoder = DecimalEncoder

    celery = init_celery(app)
    bcrypt.init_app(app)
    jwt = JWTManager()  
    jwt.init_app(app)
    migrate = Migrate(app, db)
    CORS(app)  # Enable CORS for all routes

    # ---- Caching (Flask-Caching) ----
    cache = Cache(app)              # Uses Config (CACHE_TYPE, etc.)
    app.cache = cache
    
    # ---- (Optional) direct Redis connection if you need it besides caching ----
    redis_url = app.config.get("CACHE_REDIS_URL")
    if redis_url:
        redis_connection_kwargs = {"decode_responses": True}
        if redis_url.startswith("rediss://"):
            redis_connection_kwargs["ssl"] = True
            redis_connection_kwargs["ssl_cert_reqs"] = ssl.CERT_NONE
        app.redis = redis.Redis.from_url(redis_url, **redis_connection_kwargs)
    
    # ---- Google OAuth blueprint ----
    google_bp = make_google_blueprint(
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        scope=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        redirect_url="/auth/google",
    )
    app.register_blueprint(google_bp, url_prefix="/login")

    # ---- API resources ----
    api = Api(app)
    
    # Health check endpoint for Redis
    class HealthCheck(Resource):
        def get(self):
            try:
                app.redis.ping()
                return {"status": "healthy", "redis": "connected"}, 200
            except redis.ConnectionError:
                return {"status": "healthy", "redis": "disconnected"}, 200

    # Register all API resources (routes)
    api.add_resource(HealthCheck, '/health')

    api.add_resource(GoogleAuth, '/auth/google')
    api.add_resource(Login, '/auth/signin')
    api.add_resource(Register, '/auth/signup')
    
    api.add_resource(UserInfo, '/user')
    # Experience and Slot management
    api.add_resource(ExperienceList, "/experiences")
    api.add_resource(ExperienceDetail, "/experiences/<uuid:experience_id>")
    api.add_resource(SlotList, "/experiences/<uuid:experience_id>/slots")
    api.add_resource(SlotDetail, "/slots/<uuid:slot_id>")

    # Public experience endpoints
    api.add_resource(PublicExperienceList, "/public/experiences")
    api.add_resource(PublicExperienceDetail, "/public/experiences/<uuid:experience_id>")
    api.add_resource(TrendingExperiences, "/public/experiences/trending")
    
    return app


# For gunicorn / production import
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
