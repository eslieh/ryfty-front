from models import db, SettlementTxn, ApiDisbursement, UserWallet, ReservationRefund, UsersLedger, User, PaymentMethod
from flask import current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource
from workers.initiate_mpesa import pay_track_disbursment_initiate
from decimal import Decimal
from utils.tarrifs import get_b2b_business_charge, get_b2c_business_charge
from utils.email_templates import payout_authorization_mail
from workers.email_worker import send_email_async_task
from decimal import Decimal, InvalidOperation
import random
import string
from datetime import datetime, timedelta
import uuid
from sqlalchemy.exc import SQLAlchemyError

class WalletResource(Resource):
    @jwt_required()
    def get(self):
        """Get wallet details, payment methods, settlement txns and refunds"""
        user_id = get_jwt_identity()
        if not user_id:
            return {"error": "unauthorized user request"}, 403

        user = User.query.get(user_id)
        if not user:
            return {"error": "user not found"}, 404

        # Wallet
        wallet = UserWallet.query.filter_by(user_id=user_id).first()
        wallet_data = {
            "balance": str(wallet.balance) if wallet else "0.00",
            "updated_at": wallet.updated_at.isoformat() if wallet else None
        }

        # Payment methods
        methods = PaymentMethod.query.filter_by(user_id=user_id).all()
        payment_methods = [{
            "id": str(m.id),
            "default_method": m.default_method,
            "paybill": m.paybill,
            "till_number": m.till_number,
            "account_no": m.account_no,
            "mpesa_number": m.mpesa_number,
            "bank_id": m.bank_id,
            "bank_account_number": m.bank_account_number
        } for m in methods]

        # Settlement Transactions
        settlements = SettlementTxn.query.filter_by(user_id=user_id).all()
        settlement_data = [{
            "id": str(s.id),
            "amount": str(s.amount),
            "checkout_id": s.checkout_id,
            "txn_id": s.txn_id,
            "service_fee": str(s.service_fee),
            "platform": s.platform,
            "date_done": s.date_done.isoformat()
        } for s in settlements]

        # Refund Transactions
        refunds = ReservationRefund.query.filter_by(user_id=user_id).all()
        refund_data = [{
            "id": str(r.id),
            "approved_amount": str(r.approved_amount),
            "status": r.status,
            "reason": r.reason,
            "processed_at": r.processed_at.isoformat() if r.processed_at else None
        } for r in refunds]

        return {
            "wallet": wallet_data,
            "payment_methods": payment_methods,
            "settlements": settlement_data,
            "refunds": refund_data
        }, 200

class PaymentMethodResource(Resource):
    @jwt_required()
    def post(self):
        """Add a new payment method"""
        user_id = get_jwt_identity()
        data = request.get_json()

        method = PaymentMethod(
            user_id=user_id,
            default_method=data.get("default_method"),
            paybill=data.get("paybill"),
            till_number=data.get("till_number"),
            account_no=data.get("account_no"),
            mpesa_number=data.get("mpesa_number"),
            bank_id=data.get("bank_id"),
            bank_account_number=data.get("bank_account_number")
        )
        db.session.add(method)
        db.session.commit()
        return {"message": "Payment method added", "id": str(method.id)}, 201

    @jwt_required()
    def put(self, method_id):
        """Edit an existing payment method"""
        user_id = get_jwt_identity()
        method = PaymentMethod.query.filter_by(id=method_id, user_id=user_id).first()
        if not method:
            return {"error": "Payment method not found"}, 404

        data = request.get_json()
        method.default_method = data.get("default_method", method.default_method)
        method.paybill = data.get("paybill", method.paybill)
        method.till_number = data.get("till_number", method.till_number)
        method.account_no = data.get("account_no", method.account_no)
        method.mpesa_number = data.get("mpesa_number", method.mpesa_number)
        method.bank_id = data.get("bank_id", method.bank_id)
        method.bank_account_number = data.get("bank_account_number", method.bank_account_number)

        db.session.commit()
        return {"message": "Payment method updated"}, 200

    @jwt_required()
    def delete(self, method_id):
        """Delete a payment method"""
        user_id = get_jwt_identity()
        method = PaymentMethod.query.filter_by(id=method_id, user_id=user_id).first()
        if not method:
            return {"error": "Payment method not found"}, 404
        db.session.delete(method)
        db.session.commit()
        return {"message": "Payment method deleted"}, 200




# ---------- STEP 1: Initiate disbursement & send auth email ----------
class DisbursementInitResource(Resource):
    @jwt_required()
    def post(self):
        """Create a pending disbursement and send authorization email"""
        user_id = get_jwt_identity()
        data = request.get_json() or {}

        user = User.query.get(user_id)
        if not user:
            return {"error": "user not found"}, 404

        # --- Validate amount ---
        try:
            amount = Decimal(data.get("amount", 0))
        except (InvalidOperation, TypeError):
            return {"error": "invalid amount format"}, 400
        if amount <= 0:
            return {"error": "amount must be greater than zero"}, 400

        # --- Wallet check ---
        wallet = UserWallet.query.filter_by(user_id=user_id).first()
        if not wallet:
            return {"error": "wallet not found"}, 404

        # --- Payment method ---
        payment_method = PaymentMethod.query.filter_by(user_id=user_id).first()
        if not payment_method:
            return {"error": "payment method not found"}, 400

        # --- Calculate available balance ---
        b2c_charge = Decimal(get_b2c_business_charge(float(amount)))
        b2b_charge = Decimal(get_b2b_business_charge(float(amount)))
        required = amount + min(b2c_charge, b2b_charge)

        if wallet.balance < required:
            return {
                "error": "insufficient funds",
                "amount_withdrawable": str(wallet.balance - b2b_charge)
            }, 400

       

        # --- Generate verification token ---
        token = ''.join(random.choices(string.digits, k=6))
        expires_at = datetime.utcnow() + timedelta(minutes=30)

         # --- Create pending disbursement ---
        disbursement = ApiDisbursement(
            user_id=user_id,
            amount=amount,
            status="awaiting_authorization",
            description="User settlement withdrawal",
            disbursement_type="settlement",
            authorization_token=token,
            expires_at=expires_at
        )
        db.session.add(disbursement)
        db.session.commit()

        # --- Send email ---
        try:
            transaction = {
                "user": {"name": user.name},
                "amount": float(amount),
                "b2b_account": {
                    "paybill":payment_method.paybill,
                    "account_no": payment_method.account_no
                } if payment_method.default_method == "paybill" else None,
                "bank_account": {
                    "bank_id": payment_method.bank_id,
                    "account_number": payment_method.bank_account_number
                } if payment_method.default_method == "bank" else None,
                "mpesa_number": payment_method.mpesa_number if payment_method.default_method == "mpesa" else None
            }
            html = payout_authorization_mail(transaction, token)
            text = "Use the code {} to authorize your payout of KES {:.2f}. This code expires in 30 minutes.".format(token, amount)
            send_email_async_task.delay(user.email, "Authorize Your Payout", html, text)
        except Exception as e:
            current_app.logger.error(f"Email send failed: {e}")

        return {
            "success": True,
            "message": "Authorization code sent to your email",
            "disbursement_id": str(disbursement.id)
        }, 200


# ---------- STEP 2: Verify code & trigger worker ----------
class DisbursementVerifyResource(Resource):
    @jwt_required()
    def post(self):
        """Verify payout authorization and start worker"""
        user_id = get_jwt_identity()
        data = request.get_json() or {}

        disbursement_id = data.get("disbursement_id")
        token = data.get("token")

        if not disbursement_id or not token:
            return {"error": "missing disbursement_id or token"}, 400

        # --- Approve disbursement ---
        disbursement = ApiDisbursement.query.filter_by(
            id=disbursement_id, user_id=user_id
        ).first()

        if not disbursement or disbursement.authorization_token != token:
            return {"error": "invalid disbursement or token"}, 401

        if not disbursement:
            return {"error": "disbursement not found"}, 404
        if disbursement.status != "awaiting_authorization":
            return {"error": "disbursement already processed"}, 400

        disbursement.status = "pending"
        disbursement.authorization_token = None
        disbursement.expires_at = None
        disbursement.authorized = True
        db.session.commit()

        # --- Queue payout ---
        pay_track_disbursment_initiate.delay(disbursement.id)

        return {
            "success": True,
            "message": "Payout authorized and queued for processing",
            "disbursement_id": str(disbursement.id),
            "amount": str(disbursement.amount)
        }, 200