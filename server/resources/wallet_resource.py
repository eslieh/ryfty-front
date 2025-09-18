from models import SettlementTxn, UserWallet, ReservationRefund, UsersLedger, User
from flask import current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from decimal import Decimal
import logging
from datetime import datetime
from flask_restful import Resource

class WalletResource(Resource):
    @jwt_required
    def get(self):
        user_id = get_jwt_identity()
        if not user_id:
            return {"unauthorised user request"}, 403
        user = User.query.get(user_id)
        if not user:
            return {"error": "user not found"}, 400
        
        
        