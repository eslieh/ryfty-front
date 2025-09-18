from models import db, User, ApiDisbursement, UserWallet, ReservationRefund, Reservation, Slot, ApiDisbursement
from flask_restful import Resource  
from flask import request, current_app, jsonify
from utils.tarrifs import get_b2b_business_charge, get_b2c_business_charge
from decimal import Decimal
from workers.initiate_mpesa import initiate_disbursement
import logging
from workers.wallet_logger import logg_wallet, wallet_settlement, refund_settlement  # Celery task
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

logger = logging.getLogger(__name__)

class RefundRequest(Resource): 
    @jwt_required()
    def post(self, reservation_id):
        """
        Handle refund request for a reservation.
        """
        user_id = get_jwt_identity()
        args = request.get_json()
        reason = args.get("reason", "")
        mpesa_number = args.get("mpesa_number")
        
        if not reason and not mpesa_number:
            return {"error": "Reason and M-Pesa number are required"}, 400
        
        reservation = Reservation.query.filter_by(id=reservation_id, user_id=user_id).first()
        if not reservation:
            return {"error": "Reservation not found"}, 404
        
        if reservation.status != "confirmed":
            return {"error": "Only confirmed reservations can be refunded"}, 400
        
        # Check if a refund request already exists
        existing_refund = ReservationRefund.query.filter_by(reservation_id=reservation_id).first()
        if existing_refund:
            return {"error": "Refund request already exists for this reservation"}, 400
        
        # Create refund request
        refund_request = ReservationRefund(
            reservation_id=reservation_id,
            experience_id=reservation.experience_id,
            user_id=user_id,
            reason=reason,
            status="pending",
            mpesa_number=mpesa_number,
            requested_amount=reservation.amount_paid
        )
        
        db.session.add(refund_request)
        db.session.commit()
        
        # Optionally, notify admin or relevant parties about the refund request here
        
        return {"message": "Refund request submitted successfully", "refund_request_id": str(refund_request.id)}, 201
    
    
class RefundRequestLists(Resource):
    @jwt_required()
    def get(self, experience_id, reservation_id=None):
        """
        Get refund requests.
        - If reservation_id is provided: return refund request detail for that reservation.
        - Else: return all refund requests for the given experience.
        Accessible by:
        - Refund requester (user who requested it)
        - Admins (role == 'admin')
        """
        cache = current_app.cache
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return {"error": "User not found"}, 404

        # Check if admin
        is_admin = getattr(user, "role", None) == "admin"

        # Generate cache key
        cache_key = (
            f"refund:{experience_id}:{reservation_id}:{'admin' if is_admin else user_id}"
            if reservation_id
            else f"refunds:{experience_id}:{'admin' if is_admin else user_id}"
        )

        def serialize_refund(refund, is_admin=False):
            data = {
                "id": str(refund.id),
                "reservation_id": str(refund.reservation_id),
                "experience_id": str(refund.experience_id),
                "user_id": str(refund.user_id),
                "reason": refund.reason,
                "status": refund.status,
                "mpesa_number": refund.mpesa_number,
                "requested_amount": str(refund.requested_amount),
                "requested_at": refund.requested_at.isoformat() if refund.requested_at else None,
            }

            if is_admin:
                requester = User.query.get(refund.user_id)
                if requester:
                    data["requester"] = {
                        "id": str(requester.id),
                        "name": requester.name,
                        "email": requester.email,
                        "avatar_url": requester.avatar_url,
                        "phone": str(requester.phone) if getattr(requester, "phone", None) else None,
                    }

            return data

        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data, 200

        # If reservation_id provided → fetch one
        if reservation_id:
            query = ReservationRefund.query.filter_by(
                experience_id=experience_id,
                reservation_id=reservation_id
            )
            if not is_admin:
                query = query.filter_by(user_id=user_id)

            refund = query.first()
            if not refund:
                return {"error": "Refund request not found or not accessible"}, 404

            result = serialize_refund(refund, is_admin)
            cache.set(cache_key, result, timeout=60 * 5)
            return result, 200

        # Else → fetch all refunds for the experience
        query = ReservationRefund.query.filter_by(experience_id=experience_id)
        if not is_admin:
            query = query.filter_by(user_id=user_id)

        refunds = query.all()
        result = [serialize_refund(r, is_admin) for r in refunds]

        cache.set(cache_key, result, timeout=60 * 5)
        return result, 200



class RefundInitiate(Resource):
    @jwt_required()
    def post(self, reservation_id, refund_id):
        """
        Initiate refund disbursement for a reservation refund request.
        Only admins should typically call this endpoint.
        """
        data = request.get_json() or {}
        approved = data.get("approved")
        decline_reason = data.get("reason")

        # --- Validation ---
        if approved is None:
            return {"error": "approved status is required"}, 400

        if approved is False and not decline_reason:
            return {"error": "reason for declining refund is required"}, 400

        if not reservation_id or not refund_id:
            return {"error": "reservation_id and refund_id are required"}, 400

        user_id = get_jwt_identity()

        # --- Fetch refund request ---
        refund = ReservationRefund.query.filter_by(
            id=refund_id, reservation_id=reservation_id
        ).first()

        if not refund:
            return {"error": "refund request not found"}, 404

        if refund.status in ["approved", "declined"]:
            return {"error": f"refund already {refund.status}"}, 400

        # --- Handle decline ---
        if approved is False:
            refund.status = "declined"
            refund.admin_reason = decline_reason
            refund.reviewed_at = datetime.utcnow()
            db.session.commit()
            return {"message": "refund request declined"}, 200

        # --- Handle approval & disbursement ---
        wallet = UserWallet.query.filter_by(user_id=user_id).first()
        if not wallet:
            return {"error": "user wallet not found"}, 404

        balance = wallet.balance
        requested_amount = refund.requested_amount

        service_fee = get_b2c_business_charge(float(requested_amount))
        total_withdrawable = requested_amount - Decimal(service_fee)
        print(balance)
        print(total_withdrawable)
        if balance < total_withdrawable:
            return {"error": "insufficient funds to process refund"}, 403

        try:
            # Mark refund as approved
            refund.status = "approved"
            refund.reviewed_by = user_id
            refund.reviewed_at = datetime.utcnow()

            # Create disbursement record
            disbursement = ApiDisbursement(
                user_id=user_id,
                refund_id=refund.id,
                status="posted",
                amount = total_withdrawable,
                mpesa_number=refund.mpesa_number,
                disbursement_type="refund",
                description=f"Refund for reservation {reservation_id}"
            )
            db.session.add(disbursement)
            db.session.flush()

            # Queue async disbursement
            initiate_disbursement.delay(api_disbursement_id=disbursement.id)

            db.session.commit()

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Refund disbursement failed: {e}")
            return {"error": "failed to initiate refund"}, 500

        return {
            "message": "refund initiated successfully",
            "refund_id": str(refund.id),
            "disbursement_id": str(disbursement.id),
            "requested_amount": str(requested_amount),
            "service_fee": str(service_fee),
            "total_withdrawable": str(total_withdrawable),
            "status": refund.status,
        }, 201
