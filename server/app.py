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
from events.event_bp import events_bp 
from config import Config
from models import db
from flask_restful import Resource

# Import your resources
from resources.auth import GoogleAuth, Login, Register, ResetPassword, RequestPasswordReset, Verify
from resources.user_info import UserInfo
from resources.experiences import ExperienceList, ExperienceDetail, SlotList, SlotDetail
from resources.checkin_resource import CheckinResource
from resources.experiences_public import PublicExperienceList, PublicExperienceDetail, TrendingExperiences
from resources.public_reservation_resource import PublicReservationResource, GetReservationsPublic, InstallmentReservationResource
from resources.mpesa_callback import MpesaCallbackResource, MpesaB2bDisbursementCallback, MpesaB2cDisbursementCallback
from resources.provider_reservations import ProviderReservationsOptimized
from resources.refund_resource import RefundRequest, RefundRequestLists, RefundInitiate
from resources.wallet_resource import WalletResource, PaymentMethodResource, DisbursementResource
from resources.test import TestSendPayoutConfirmation,TestSendReservation
from resources.review_resource import ExperienceReviewsResource, PostReviewResource, ExperienceStatsResource

# checkin device auth
from checkin_devices.auth import DeviceAuthorization, CheckIn, DeviceVerification, DeauthorizeDevice, AuthorizedDevices
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
        # Define base connection options
        redis_connection_kwargs = {
            "decode_responses": True,  # store as str, not bytes
        }

        # SSL Support (for rediss://)
        if redis_url.startswith("rediss://"):
            redis_connection_kwargs.update({
                "ssl": True,
                "ssl_cert_reqs": ssl.CERT_NONE  # disable strict cert checks (optional)
            })

        # 🔹 Create a connection pool
        pool = redis.ConnectionPool.from_url(redis_url, **redis_connection_kwargs)

        # 🔹 Assign Redis client using that pool
        app.redis = redis.Redis(connection_pool=pool)
    
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
    app.register_blueprint(events_bp)

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

    # authentication resources
    api.add_resource(GoogleAuth, '/auth/google')
    api.add_resource(Login, '/auth/signin')
    api.add_resource(Register, '/auth/signup')
    api.add_resource(Verify, '/auth/verify')
    api.add_resource(RequestPasswordReset, '/auth/reset/request')
    api.add_resource(ResetPassword, '/auth/reset/verify')
    
    api.add_resource(UserInfo, '/user')
    # Experience and Slot management
    api.add_resource(ExperienceList, "/experiences")
    api.add_resource(ExperienceDetail, "/experiences/<uuid:experience_id>")
    api.add_resource(SlotList, "/experiences/<uuid:experience_id>/slots")
    api.add_resource(SlotDetail, "/slots/<uuid:slot_id>")
    # experience reservations for providers
    api.add_resource(ProviderReservationsOptimized, "/provider/reservations/<uuid:experience_id>/<uuid:slot_id>")

    # Public experience endpoints
    api.add_resource(PublicExperienceList, "/public/experiences")
    api.add_resource(PublicExperienceDetail, "/public/experiences/<uuid:experience_id>")
    api.add_resource(TrendingExperiences, "/public/experiences/trending")
    api.add_resource(GetReservationsPublic, "/public/experiences/my", "/public/experiences/my/<uuid:reservation_id>")
    
    
    # Public reservation endpoint
    api.add_resource(PublicReservationResource, "/public/reservations_request")
    api.add_resource(InstallmentReservationResource, "/public/partial_payment/<uuid:reservation_id>")
    # M-Pesa callback endpoint
    api.add_resource(MpesaCallbackResource, "/payment/mpesa/call_back/<uuid:experience_id>/<uuid:slot_id>/<uuid:api_collection_id>")
    api.add_resource(MpesaB2cDisbursementCallback, "/payment/mpesa/b2c/disburse_call_back/<uuid:user_id>/<uuid:api_disbursement_id>/result")
    api.add_resource(MpesaB2bDisbursementCallback, "/payment/mpesa/b2b/disburse_call_back/<uuid:user_id>/<uuid:api_disbursement_id>/result")
    
    # refund request endpoint
    api.add_resource(RefundRequest, "/refund/request/<uuid:reservation_id>")
    api.add_resource(RefundRequestLists, "/refund/request/list/<uuid:experience_id>", "/refund/request/list/<uuid:experience_id>/<uuid:reservation_id>")
    
    # refund processing endpoint
    api.add_resource(RefundInitiate, "/refund/process/<uuid:reservation_id>/<uuid:refund_id>")
    
    # wallet processing resources
    api.add_resource(WalletResource, "/wallet")
    api.add_resource(PaymentMethodResource, "/wallet/payment-method", "/wallet/payment-method/<uuid:method_id>")
    api.add_resource(DisbursementResource,  "/api/payment/initiate")
    
    # checkin resource 
    api.add_resource(CheckinResource, '/experiences/<uuid:experience_id>/checkin', '/experiences/<uuid:experience_id>/checkin/<uuid:slot_id>')
    
    # reviews endpoints
    api.add_resource(PostReviewResource, '/experiences/<uuid:experience_id>/reviews/post')
    api.add_resource(ExperienceReviewsResource, '/experiences/<uuid:experience_id>/reviews')
    api.add_resource(ExperienceStatsResource, '/experiences/<uuid:experience_id>/stats')

    

    # test resource
    api.add_resource(TestSendReservation, "/api/test/send_reservation_mail")
    api.add_resource(TestSendPayoutConfirmation, "/api/test/send_payout")

    # checkin device auth resources
    api.add_resource(DeviceAuthorization, '/device/auth')
    api.add_resource(DeviceVerification, '/device/verify')
    api.add_resource(CheckIn, '/device/checkin')
    api.add_resource(DeauthorizeDevice, '/device/deauthorize')
    api.add_resource(AuthorizedDevices, '/device/authorized')

    return app


# For gunicorn / production import
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
