from models import db, ApiCollection, ApiDisbursement
from flask_restful import Resource
from flask import request, current_app, jsonify
from utils.tarrifs import get_b2b_business_charge, get_b2c_business_charge
from decimal import Decimal
import logging
from workers.wallet_logger import logg_wallet, wallet_settlement, refund_settlement  # Celery task
# from workers.send_webhook import send_webhook
logger = logging.getLogger(__name__)
from utils.subscribe_manager import push_to_queue
from datetime import datetime
from typing import Optional

class MpesaCallbackResource(Resource):
    def post(self, experience_id, slot_id, api_collection_id):
        """
        Handle M-Pesa STK callback.
        
        """
        data = request.get_json()

        try:
            stk = data.get('Body', {}).get('stkCallback', {})
            merchant_request_id = stk.get('MerchantRequestID')
            checkout_request_id = stk.get('CheckoutRequestID')
            result_code = stk.get('ResultCode')
            result_desc = stk.get('ResultDesc')

            if not experience_id or not slot_id or not api_collection_id:
                logger.warning("Experience ID or ApiCollection ID missing in callback")
                return {"ResultCode": 1, "ResultDesc": "Missing data"}, 400

            api_collection = ApiCollection.query.get(api_collection_id)
            if not api_collection:
                logger.warning(f"ApiCollection {api_collection_id} not found")
                return {"ResultCode": 1, "ResultDesc": "Collection not found"}, 404

            if result_code == 0:
                # Successful payment
                metadata = stk.get('CallbackMetadata', {}).get('Item', [])
                parsed_metadata = {item['Name']: item.get('Value') for item in metadata}

                amount = Decimal(str(parsed_metadata.get("Amount")))
                transaction_id = parsed_metadata.get("MpesaReceiptNumber")
                phone_number = parsed_metadata.get("PhoneNumber")
                transaction_date = parsed_metadata.get("TransactionDate")

                # Update status immediately
                api_collection.status = "completed"
                api_collection.mpesa_checkout_request_id = checkout_request_id
                api_collection.mpesa_transaction_id = transaction_id
                db.session.commit()

                
                
                logg_wallet.delay(
                    slot_id=slot_id,
                    user_id=api_collection.user_id,
                    quantity=api_collection.quantity,
                    amount_paid=float(amount),
                    status="completed",
                    transaction_ref=transaction_id,
                    reservation_id=None if api_collection.reservation_id is None else api_collection.reservation_id
                )

                logger.info(f"STK Callback successful for collection {api_collection_id}")
                # Safaricom expects a JSON response immediately
                return {"ResultCode": 0, "ResultDesc": "Accepted"}, 200

            else:
                # Failed payment
                api_collection.status = "failed"
                api_collection.desctription = result_desc
                db.session.commit()
                logger.info(f"STK Callback failed for collection {api_collection_id}: {result_desc}")
                return {"ResultCode": 0, "ResultDesc": "Accepted"}, 200  # still 0 so Safaricom stops retrying

        except Exception as e:
            db.session.rollback()
            current_app.logger.exception(f"M-Pesa callback error: {e}")
            return {"ResultCode": 1, "ResultDesc": "Internal server error"}, 500


class MpesaB2cDisbursementCallback(Resource):
    def post(self, user_id, api_disbursement_id):
        """
        Handle M-Pesa B2C disbursement callback.

        """
        data = request.get_json()

        try:
            result = data.get('Result', {})
            conversation_id = result.get('ConversationID')
            originator_conversation_id = result.get('OriginatorConversationID')
            result_code = result.get('ResultCode')
            result_desc = result.get('ResultDesc')
            transaction_id = result.get('TransactionID')

            if not user_id or not api_disbursement_id:
                logger.warning("Tenant ID or ApiDisbursement ID missing in callback")
                return {"ResultCode": 1, "ResultDesc": "Missing data"}, 400
            api_disbursement = ApiDisbursement.query.get(api_disbursement_id)
            if not api_disbursement:
                logger.warning(f"ApiDisbursement {api_disbursement_id} not found")
                return {"ResultCode": 1, "ResultDesc": "Disbursement not found"}, 404

            if result_code == 0:
                # Successful disbursement
                api_disbursement.status = "completed"
                api_disbursement.transaction_reference = transaction_id
                service_fee = get_b2c_business_charge(float(api_disbursement.amount))
                db.session.commit()
                if api_disbursement.disbursement_type == "settlement":
                    wallet_settlement.delay(
                        user_id=user_id,
                        amount=float(api_disbursement.amount),
                        checkout_id=conversation_id,
                        transaction_ref=transaction_id,
                        service_fee=service_fee
                    )
                elif api_disbursement.disbursement_type == "refund":
                    refund_settlement.delay(
                        user_id=user_id,
                        amount=float(api_disbursement.amount),
                        refund_id=api_disbursement.refund_id,
                        transaction_ref=transaction_id,
                        service_fee=service_fee
                    )
        

                logger.info(f"Disbursement Callback successful for disbursement {api_disbursement_id}")
                return {"ResultCode": 0, "ResultDesc": "Accepted"}, 200

            else:
                # Failed disbursement
                api_disbursement.status = "failed"
                db.session.commit()

                logger.info(f"Disbursement Callback failed for disbursement {api_disbursement_id}: {result_desc}")
                return {"ResultCode": 0, "ResultDesc": "Accepted"}, 200  # still 0 so Safaricom stops retrying
    
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception(f"M-Pesa disbursement callback error: {e}")
            return {"ResultCode": 1, "ResultDesc": "Internal server error"}, 500

class MpesaB2bDisbursementCallback(Resource):
    def post(self, user_id, api_disbursement_id):
        """
        Handle M-Pesa B2C disbursement callback.

        """
        data = request.get_json()

        try:
            result = data.get('Result', {})
            conversation_id = result.get('ConversationID')
            originator_conversation_id = result.get('OriginatorConversationID')
            result_code = result.get('ResultCode')
            result_desc = result.get('ResultDesc')
            transaction_id = result.get('TransactionID')
            print(result)
            if not user_id or not api_disbursement_id:
                logger.warning("Tenant ID or ApiDisbursement ID missing in callback")
                return {"ResultCode": 1, "ResultDesc": "Missing data"}, 400
            api_disbursement = ApiDisbursement.query.get(api_disbursement_id)
            if not api_disbursement:
                logger.warning(f"ApiDisbursement {api_disbursement_id} not found")
                return {"ResultCode": 1, "ResultDesc": "Disbursement not found"}, 404

            if result_code == 0:
                # Successful disbursement
                api_disbursement.status = "completed"
                api_disbursement.transaction_reference = transaction_id
                service_fee = get_b2c_business_charge(float(api_disbursement.amount))
                db.session.commit()
                wallet_settlement.delay(
                    user_id=user_id,
                    amount=float(api_disbursement.amount),
                    checkout_id=api_disbursement.checkout_id,
                    transaction_ref=transaction_id,
                    service_fee=service_fee
                )

                logger.info(f"Disbursement Callback successful for disbursement {api_disbursement_id}")
                return {"ResultCode": 0, "ResultDesc": "Accepted"}, 200

            else:
                # Failed disbursement
                api_disbursement.status = "failed"
                api_disbursement.description = result_desc
                db.session.commit()

                logger.info(f"Disbursement Callback failed for disbursement {api_disbursement_id}: {result_desc}")
                return {"ResultCode": 0, "ResultDesc": "Accepted"}, 200  # still 0 so Safaricom stops retrying
    
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception(f"M-Pesa disbursement callback error: {e}")
            return {"ResultCode": 1, "ResultDesc": "Internal server error"}, 500


