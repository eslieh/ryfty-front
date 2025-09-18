from models import User, UserWallet, ApiDisbursement
from flask_restful import Resource  
from flask import request, current_app, jsonify
from utils.tarrifs import get_b2b_business_charge, get_b2c_business_charge
from decimal import Decimal
from workers.initiate_mpesa import initiate_disbursement
import logging
from workers.wallet_logger import logg_wallet, wallet_settlement, refund_settlement  # Celery task
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

class SettlementRequest(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        