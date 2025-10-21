# workers/initiate_mpesa.py

import logging
from dotenv import load_dotenv
from models import ApiCollection, db, ApiDisbursement, PaymentMethod, User
import requests
import base64
import re
from datetime import datetime
from flask import current_app
from utils.subscribe_manager import push_to_queue
import os
import decimal

from celery_app import celery

# M-Pesa API credentials (loaded from .env file)
MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE")
B2C_URL = "https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest"
B2B_URL = "https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest"
MPESA_PASSKEY = os.getenv("MPESA_PASSKEY")
MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
INITIATOR_NAME = os.getenv("INITIATOR_NAME")
SECURITY_CREDENTIAL = os.getenv("SECURITY_CREDENTIAL")

# URLs
MPESA_URL = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
MPESA_AUTH_URL = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

load_dotenv()
logger = logging.getLogger(__name__)


@celery.task(bind=True, name="workers.initiate_stk", max_retries=3, default_retry_delay=30)
def initiate_payment(self, api_collection_id):
    logger.info(f"Initiating payment for request {api_collection_id}")

    with current_app.app_context():
        api_collection = ApiCollection.query.get(api_collection_id)
        if not api_collection:
            logger.error(f"ApiCollection with ID {api_collection_id} not found.")
            return

        phone_number = api_collection.mpesa_number
        amount = api_collection.amount
        experience_id = api_collection.experience_id
        call_back_url = f"https://rhtr3fc9-5000.uks1.devtunnels.ms/payment/mpesa/call_back/{experience_id}/{api_collection.slot_id}/{api_collection_id}"

        if not phone_number or not amount:
            logger.error(f"Missing phone number or amount for ApiCollection {api_collection_id}.")
            return

        def format_phone_number(number):
            digits = re.sub(r'\D', '', number)
            if re.match(r'^254\d{9}$', digits):
                return digits
            if re.match(r'^0[17]\d{8}$', digits):
                return '254' + digits[1:]
            logger.warning(f"Invalid phone number format: {number}")
            return None

        formatted_number = format_phone_number(phone_number)
        if not formatted_number:
            logger.error(f"Failed to format phone number: {phone_number}")
            return

        auth_token = get_mpesa_auth_token()
        if not auth_token:
            logger.error("Failed to get M-Pesa authorization token.")
            return

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        combined_string = f"{MPESA_SHORTCODE}{MPESA_PASSKEY}{timestamp}"
        password = base64.b64encode(combined_string.encode()).decode()

        payload = {
            "BusinessShortCode": MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": str(int(amount)),
            "PartyA": formatted_number,
            "PartyB": MPESA_SHORTCODE,
            "PhoneNumber": formatted_number,
            "CallBackURL": call_back_url,
            "AccountReference": "RYFTY.NET",
            "TransactionDesc": "Wallet Funding"
        }

        try:
            response = requests.post(MPESA_URL, headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}, json=payload)
            response_data = response.json()
            if response.status_code == 200:
                api_collection.mpesa_checkout_request_id = response_data.get("CheckoutRequestID")
                api_collection.status = "initiated"
                push_to_queue(api_collection.user_id, {"state": "pending_confirmation"})
                db.session.commit()
                logger.info(f"Payment request {api_collection_id} successfully initiated: {response_data}")
            else:
                logger.error(f"Failed to initiate payment for {api_collection_id}: {response_data}")
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error initiating payment for {api_collection_id}: {e}")


def get_mpesa_auth_token():
    auth = base64.b64encode(f"{MPESA_CONSUMER_KEY}:{MPESA_CONSUMER_SECRET}".encode("utf-8")).decode("utf-8")
    headers = {"Authorization": f"Basic {auth}"}
    try:
        response = requests.get(MPESA_AUTH_URL, headers=headers)
        if response.status_code == 200:
            return response.json().get("access_token")
        logger.error(f"Failed to get auth token, status code: {response.status_code}, response: {response.text}")
        return None
    except Exception as e:
        logger.exception(f"Exception while fetching auth token: {e}")
        return None




@celery.task(bind=True, name="workers.disbursment_initiate", max_retries=3, default_retry_delay=30)
def initiate_disbursement(self, api_disbursement_id):
    logger.info(f"Initiating disbursement for request {api_disbursement_id}")

    with current_app.app_context():
        api_disbursement = ApiDisbursement.query.get(api_disbursement_id)
        if not api_disbursement:
            logger.error(f"ApiDisbursement with ID {api_disbursement_id} not found.")
            return

        disbursement_type = api_disbursement.disbursement_type
        phone_number = None
        paybill_number = None
        account_number = None
        command_type = None
        
        if disbursement_type == "settlement":
            # get payment method    
            payment_method = PaymentMethod.query.filter_by(user_id=api_disbursement.user_id).first()
            if payment_method:
                if payment_method.default_method == "mpesa":
                    phone_number = payment_method.mpesa_number
                    command_type = "BusinessPayment"
                elif payment_method.default_method == "bank":
                    paybill_number = payment_method.bank_id
                    account_number = payment_method.bank_account_number
                    command_type = "BusinessPayBill"
                elif payment_method.default_method == "paybill":
                    paybill_number = payment_method.paybill
                    account_number = payment_method.account_no
                    command_type = "BusinessPayBill"
            
        elif disbursement_type == "refund":
            if api_disbursement.mpesa_number:
                phone_number = api_disbursement.mpesa_number
                command_type = "BusinessPayment"
        
        amount = api_disbursement.amount
        user_id = api_disbursement.user_id
        b2c_result_url = f"https://rhtr3fc9-5000.uks1.devtunnels.ms/payment/mpesa/b2c/disburse_call_back/{user_id}/{api_disbursement_id}/result"
        b2c_timeout_url = f"https://rhtr3fc9-5000.uks1.devtunnels.ms/payment/mpesa/b2c/disburse_call_back/{user_id}/{api_disbursement_id}/timeout"
        b2b_result_url = f"https://rhtr3fc9-5000.uks1.devtunnels.ms/payment/mpesa/b2b/disburse_call_back/{user_id}/{api_disbursement_id}/result"
        b2b_timeout_url = f"https://rhtr3fc9-5000.uks1.devtunnels.ms/payment/mpesa/b2b/disburse_call_back/{user_id}/{api_disbursement_id}/timeout"

        # Determine API URL based on command type
        if command_type == "BusinessPayBill":
            api_url = B2B_URL
        elif command_type == "BusinessPayment":
            api_url = B2C_URL
        else:
            logger.error(f"Invalid command type for ApiDisbursement {api_disbursement_id}.")
            return

        # Validate required fields based on command type
        if command_type == "BusinessPayment":
            if not phone_number or not amount:
                logger.error(f"Missing phone number or amount for B2C ApiDisbursement {api_disbursement_id}.")
                return
        elif command_type == "BusinessPayBill":
            if not paybill_number or not account_number or not amount:
                logger.error(f"Missing paybill number, account number, or amount for B2B ApiDisbursement {api_disbursement_id}.")
                return

        def format_phone_number(number):
            digits = re.sub(r'\D', '', number)
            if re.match(r'^254\d{9}$', digits):
                return digits
            if re.match(r'^0[17]\d{8}$', digits):
                return '254' + digits[1:]
            logger.warning(f"Invalid phone number format: {number}")
            return None

        # Get auth token
        auth_token = get_mpesa_auth_token()
        if not auth_token:
            logger.error("Failed to get M-Pesa authorization token.")
            return

        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

        # Build payload based on command type
        if command_type == "BusinessPayment":
            # B2C Payment
            formatted_number = format_phone_number(phone_number)
            if not formatted_number:
                logger.error(f"Failed to format phone number: {phone_number}")
                return

            payload = {
                "OriginatorConversationID": str(api_disbursement_id),
                "InitiatorName": INITIATOR_NAME,
                "SecurityCredential": SECURITY_CREDENTIAL,
                "CommandID": "BusinessPayment",
                "Amount": str(int(amount)),
                "PartyA": MPESA_SHORTCODE,
                "PartyB": formatted_number,
                "Remarks": "     withdraw",
                "QueueTimeOutURL": b2c_timeout_url,
                "ResultURL": b2c_result_url,
                "Occasion": "Payment"
            }
        
        elif command_type == "BusinessPayBill":
            # B2B Payment
            payload = {
                "Initiator": INITIATOR_NAME,
                "SecurityCredential": SECURITY_CREDENTIAL,
                "CommandID": "BusinessPayBill",
                "SenderIdentifierType": "4",
                "RecieverIdentifierType": "4",
                "Amount": str(int(amount)),
                "PartyA": MPESA_SHORTCODE,
                "PartyB": paybill_number,
                "AccountReference": account_number,
                "Requester": None,  # Optional field
                "Remarks": "Account withdraw",
                "QueueTimeOutURL": b2b_timeout_url,
                "ResultURL": b2b_result_url,
                "Occasion": "Payment"
            }
    
        # Make the API request
        response = requests.post(api_url, headers=headers, json=payload)
        try:
            response_data = response.json()
            if response.status_code == 200:
                # Fix: Update the actual object, not the ID
                api_disbursement.status = "initiated"
                
                push_to_queue(api_disbursement.user_id, {"state": "pending_confirmation"})
                db.session.commit()
                logger.info(f"Payment request {api_disbursement_id} successfully initiated: {response_data}")
            else:
                logger.error(f"Failed to initiate payment for {api_disbursement_id}: {response_data}")
        except Exception as e:
            logger.error(f"Error processing response for {api_disbursement_id}: {str(e)}")
            return {"error": "Invalid JSON response", "raw": response.text}
        

@celery.task(bind=True, name="workers.pay_track_disbursment_initiate", max_retries=3, default_retry_delay=30)
def pay_track_disbursment_initiate(self, api_disbursement_id):
    logger.info(f"Initiating disbursement for request {api_disbursement_id}")
    with current_app.app_context():
        try:
            api_disbursement = ApiDisbursement.query.get(api_disbursement_id)
            if not api_disbursement:
                logger.error(f"ApiDisbursement with ID {api_disbursement_id} not found.")
                return
            disbursement_type = api_disbursement.disbursement_type
            phone_number = None
            paybill_number = None
            account_number = None
            command_type = None

            amount = str(api_disbursement.amount)
            
            if disbursement_type == "settlement":
                # get payment method    
                payment_method = PaymentMethod.query.filter_by(user_id=api_disbursement.user_id).first()
                if payment_method:
                    if payment_method.default_method == "mpesa":
                        phone_number = payment_method.mpesa_number
                        command_type = "BusinessPayment"

                        payload = {
                            "amount": amount,
                            "request_ref": str(api_disbursement_id),
                            "mpesa_number": phone_number,
                        }
                    elif payment_method.default_method == "bank":
                        paybill_number = payment_method.bank_id
                        account_number = payment_method.bank_account_number
                        command_type = "BusinessPayBill"
                        payload = {
                            "amount": amount,
                            "request_ref": str(api_disbursement_id),
                            "b2b_account": {
                                "paybill_number": paybill_number,
                                "account_number": account_number
                            }
                        }
                    elif payment_method.default_method == "paybill":
                        paybill_number = payment_method.paybill
                        account_number = payment_method.account_no
                        command_type = "BusinessPayBill"
                        payload = {
                            "amount": amount,
                            "request_ref": str(api_disbursement_id),
                            "b2b_account": {
                                "paybill_number": paybill_number,
                                "account_number": account_number
                            }
                        }
                
            elif disbursement_type == "refund":
                if api_disbursement.mpesa_number:
                    phone_number = api_disbursement.mpesa_number
                    command_type = "BusinessPayment"
                    payload = {
                            "amount": amount,
                            "request_ref": str(api_disbursement_id),
                            "mpesa_number": phone_number,
                        }
                else:
                    logger.error(f"Missing mpesa number for refund ApiDisbursement {api_disbursement_id}.")
                    return
            
            else:
                logger.error(f"Invalid disbursement type for ApiDisbursement {api_disbursement_id}.")
                return
            
            
            api_url = os.getenv("PAYTRACK_API_BASE", "https://pay.geninworld.com")
            api_key = os.getenv("PAYTRACK_API_KEY")

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        
            response = requests.post(f"{api_url}/api/disburse_request", headers=headers, json=payload)
            try:
                response_data = response.json()
                if response.status_code == 202:
                    # Fix: Update the actual object, not the ID
                    api_disbursement.status = "initiated"
                    
                    push_to_queue(api_disbursement.user_id, {"state": "pending_confirmation"})
                    db.session.commit()
                    logger.info(f"Payment request {api_disbursement_id} successfully initiated: {response_data}")
                else:
                    logger.error(f"Failed to initiate payment for {api_disbursement_id}: {response_data}")
            except Exception as e:
                logger.error(f"Error processing response for {api_disbursement_id}: {str(e)}")
                return {"error": "Invalid JSON response", "raw": response.text}
            # (rest of the function remains unchanged)
            # ...
        except Exception as e:
            logger.exception(f"Error initiating disbursement for {api_disbursement_id}: {e}")
            raise self.retry(exc=e)
        
@celery.task(bind=True, name="workers.pay_track_collection_initiate", max_retries=3, default_retry_delay=30)
def pay_track_collection_initiate(self, api_collection_id):
    try:
        with current_app.app_context():
            api_collection = ApiCollection.query.get(api_collection_id)
            if not api_collection:
                logger.error(f"ApiCollection with ID {api_collection_id} not found.")
                return

            phone_number = api_collection.mpesa_number
            amount = api_collection.amount
            if not phone_number or not amount:
                logger.error(f"Missing phone number or amount for ApiCollection {api_collection_id}.")
                return

            def format_phone_number(number):
                digits = re.sub(r'\D', '', number)
                if re.match(r'^254\d{9}$', digits):
                    return digits
                if re.match(r'^0[17]\d{8}$', digits):
                    return '254' + digits[1:]
                logger.warning(f"Invalid phone number format: {number}")
                return None

            formatted_number = format_phone_number(phone_number)
            if not formatted_number:
                logger.error(f"Failed to format phone number: {phone_number}")
                return

            api_url = os.getenv("PAYTRACK_API_BASE", "https://pay.geninworld.com")
            api_key = os.getenv("PAYTRACK_API_KEY")

            payload = {
                "amount": str(amount),
                "request_ref": str(api_collection_id),
                "currency": "KES",
                "mpesa_number": formatted_number
            }

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            response = requests.post(f"{api_url}/api/payment_request", headers=headers, json=payload)
            try:
                response_data = response.json()
                print(response_data)
                if response.status_code == 202:
                    api_collection.mpesa_checkout_request_id = response_data.get("checkout_request_id")
                    api_collection.status = "initiated"
                    push_to_queue(api_collection.user_id, {"state": "pending_confirmation"})
                    db.session.commit()
                    logger.info(f"Payment request {api_collection_id} successfully initiated: {response_data}")
                else:
                    logger.error(f"Failed to initiate payment for {api_collection_id}: {response_data}")
            except Exception as e:
                logger.error(f"Error processing response for {api_collection_id}: {str(e)}")
                return {"error": "Invalid JSON response", "raw": response.text}
            
    except Exception as e:
        logger.exception(f"Error initiating payment for {api_collection_id}: {e}")
        raise self.retry(exc=e)