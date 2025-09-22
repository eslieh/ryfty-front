import logging
from celery_app import celery
from flask import current_app
from models import db, Reservation, Slot, User, Experience, PaymentMethod
from sqlalchemy.orm import selectinload
from services.email_service import send_email
import time
from utils.tarrifs import get_b2b_business_charge, get_b2c_business_charge
from utils.email_templates import (
    verification_email_template,
    password_recovery_email_template,
    reservation_receipt_email_template,  # <-- this is your custom reservation template
    payment_acknowledgment_email_template,
    payout_confirmation_template
)

logger = logging.getLogger(__name__)

@celery.task(bind=True, name="workers.send_verification_email", max_retries=3, default_retry_delay=30)
def send_verification_email(self, name, email, token):
    try:
        with current_app.app_context():
            html = verification_email_template(name, token)
            send_email(email, "Verify your Ryfty account", html, f"Your code is {token}")
            logger.info(f"Verification email sent to {email}")
    except Exception as e:
        logger.exception(f"Failed to send verification email to user {name}")
        raise self.retry(exc=e)


@celery.task(bind=True, name="workers.send_reset_email", max_retries=3, default_retry_delay=30)
def send_reset_email(self, name, email, token):
    try:
        with current_app.app_context():
            html = password_recovery_email_template(name, token)
            send_email(email, "Password Recovery for Ryfty account", html, f"Your OTP is {token}")
            logger.info(f"Password recovery email sent to {email}")
    except Exception as e:
        logger.exception(f"Failed to send password recovery email to user {name}")
        raise self.retry(exc=e)


def _format_reservation_data(reservation):
    """Format reservation for email/template use"""
    return {
        "id": str(reservation.id),
        "user": {
            "id": str(reservation.user.id),
            "name": reservation.user.name,
            "email": reservation.user.email,
            "phone": reservation.user.phone,
            "avatar_url": reservation.user.avatar_url,
        },
        "experience": {
            "id": str(reservation.experience.id),
            "title": reservation.experience.title,
        },
        "slot": {
            "id": str(reservation.slot.id),
            "name": reservation.slot.name,
            "start_time": reservation.slot.start_time.isoformat() if reservation.slot.start_time else None,
            "end_time": reservation.slot.end_time.isoformat() if reservation.slot.end_time else None,
        },
        "num_people": reservation.quantity,
        "total_price": float(reservation.total_price) if reservation.total_price else 0.0,
        "amount_paid": float(reservation.amount_paid) if reservation.amount_paid else 0.0,
        "status": reservation.status,
        "created_at": reservation.created_at.isoformat() if reservation.created_at else None,
    }



# OPTIMIZATION: Async email version
@celery.task(bind=True, name="workers.send_reservation_email_async", max_retries=3, default_retry_delay=30)
def send_reservation_email_async(self, reservation_id):
    """
    Fast version that defers email sending to another queue/process
    """
    start_total = time.time()
    
    try:
        with current_app.app_context():
            start_db = time.time()
            
            reservation = (
                db.session.query(Reservation)
                .options(
                    selectinload(Reservation.user),
                    selectinload(Reservation.experience),
                    selectinload(Reservation.slot),
                )
                .get(reservation_id)
            )
            
            db_time = time.time() - start_db

            if not reservation:
                logger.warning(f"Reservation {reservation_id} not found")
                return

            user = reservation.user
            experience = reservation.experience
            slot = reservation.slot

            start_template = time.time()
            data = _format_reservation_data(reservation)
            html = reservation_receipt_email_template(data)
            template_time = time.time() - start_template

            # ASYNC: Send email to separate queue instead of blocking
            subject = f"Your reservation for {experience.title}"
            text_content = (
                f"You booked {experience.title} on {slot.start_time.strftime('%Y-%m-%d %H:%M')}" 
                if slot.start_time 
                else f"You booked {experience.title}"
            )
            
            # Instead of send_email(), use async task
            send_email_async_task.delay(user.email, subject, html, text_content)
            
            total_time = time.time() - start_total
            logger.info(f"ASYNC VERSION - DB: {db_time:.3f}s, Template: {template_time:.3f}s, Total: {total_time:.3f}s")
            logger.info(f"Reservation email queued for {user.email} for reservation {reservation_id}")

    except Exception as e:
        total_time = time.time() - start_total
        logger.exception(f"Failed to queue reservation email for reservation {reservation_id} after {total_time:.3f}s")
        raise self.retry(exc=e)


@celery.task(name="workers.send_email_async_task")
def send_email_async_task(email, subject, html, text):
    """Separate task just for sending emails"""
    start_time = time.time()
    try:
        send_email(email, subject, html, text)
        email_time = time.time() - start_time
        logger.info(f"Async email sent to {email} in {email_time:.3f}s")
    except Exception as e:
        email_time = time.time() - start_time
        logger.exception(f"Failed to send async email to {email} after {email_time:.3f}s")
        raise

    
@celery.task(
    bind=True,
    name="workers.send_payment_confirmation",
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True
)


def send_payment_confirmation(self, user_id, mpesa_number, transaction_id, amount, timestamp, slot_id, experience_id):
    """
    Scalable payment confirmation email worker with improved error handling and data validation.
    """
    try:
        with current_app.app_context():
            # Validate inputs first
            if not all([user_id, transaction_id, amount, slot_id, experience_id]):
                logger.error(f"Missing required data for payment confirmation: user_id={user_id}, transaction_id={transaction_id}")
                return {"status": "failed", "reason": "missing_required_data"}
            
            # Batch database queries for efficiency
            user = User.query.get(user_id)
            slot = Slot.query.get(slot_id)
            experience = Experience.query.get(experience_id)
            
            # Validate database objects
            missing_objects = []
            if not user:
                missing_objects.append(f"user:{user_id}")
            if not slot:
                missing_objects.append(f"slot:{slot_id}")
            if not experience:
                missing_objects.append(f"experience:{experience_id}")
            
            if missing_objects:
                logger.warning(f"Database objects not found: {', '.join(missing_objects)} for transaction {transaction_id}")
                return {"status": "failed", "reason": "missing_db_objects", "missing": missing_objects}
            
            # Prepare email data
            data = {
                "username": user.name or "Valued Customer",
                "user_email": user.email,
                "mpesa_number": mpesa_number or "N/A",
                "transaction_id": transaction_id,
                "amount": float(amount) if amount else 0.0,
                "timestamp": timestamp,
                "slot_name": slot.name or "Experience Slot",
                "slot_id": str(slot.id),
                "slot_start_time": slot.start_time.isoformat() if slot.start_time else None,
                "slot_end_time": slot.end_time.isoformat() if slot.end_time else None,
                "experience_name": experience.name or "Experience",
                "experience_title": experience.title or experience.name or "Your Experience",
                "experience_id": str(experience.id)
            }
            
            # Generate email content
            try:
                html = payment_acknowledgment_email_template(data)
                
                # Create subject line
                subject = f"Payment Received - {data['experience_title']}"
                
                # Create fallback text
                fallback_text = (
                    f"Payment of KES {data['amount']:.2f} received for {data['experience_title']}. "
                    f"Transaction ID: {transaction_id}. "
                    f"Slot: {data['slot_name']}. "
                    f"Thank you for choosing Ryfty!"
                )
                
                # Send email
                send_email(
                    user.email,
                    subject,
                    html,
                    fallback_text
                )
                
                logger.info(f"Payment confirmation email sent successfully - User: {user_id}, Transaction: {transaction_id}, Experience: {experience_id}")
                
                return {
                    "status": "success",
                    "user_id": user_id,
                    "transaction_id": transaction_id,
                    "email": user.email,
                    "experience": data['experience_title']
                }
                
            except Exception as email_error:
                logger.error(f"Email generation/sending failed for transaction {transaction_id}: {str(email_error)}")
                raise email_error
                
    except Exception as e:
        logger.exception(f"Payment confirmation worker failed - User: {user_id}, Transaction: {transaction_id}, Error: {str(e)}")
        
        # Don't retry for certain types of errors
        non_retryable_errors = ["missing_required_data", "missing_db_objects"]
        if hasattr(e, 'args') and any(err in str(e) for err in non_retryable_errors):
            logger.error(f"Non-retryable error for transaction {transaction_id}, not retrying")
            return {"status": "failed", "reason": "non_retryable", "error": str(e)}
        
        # Retry with exponential backoff for other errors
        raise self.retry(exc=e, countdown=2 ** self.request.retries)


@celery.task(bind=True, name="workers.send_payout_confirmation", max_retries=3, default_retry_delay=30)
def send_payout_confirmation(self, user_id, amount, transaction_id, timestamp):
    try:
        with current_app.app_context():
            user = User.query.get(user_id)
            payment_method = PaymentMethod.query.filter_by(user_id=user_id).first()
            
            email = user.email
            user_name = user.name
            transaction_fee = 0
            
            # Mask helper for security
            def mask_number(number, visible=2):
                return number[:visible] + "*" * (len(number)-visible-2) + number[-2:]

            if payment_method.default_method == "mpesa":
                phone_number = payment_method.mpesa_number
                transaction_fee = get_b2c_business_charge(float(amount))
            elif payment_method.default_method == "bank":
                paybill_number = payment_method.bank_id
                account_number = payment_method.bank_account_number
                transaction_fee = get_b2b_business_charge(float(amount))
            elif payment_method.default_method == "paybill":
                paybill_number = payment_method.paybill
                account_number = payment_method.account_no
                transaction_fee = get_b2b_business_charge(float(amount))
            
            
             
            payment_data = {
                "user_name": user_name,
                "email": email,
                "amount": float(amount),
                "transaction_id": transaction_id,
                "timestamp": timestamp,
                "transaction_fee": transaction_fee,
                "payment_method": payment_method.default_method
            }

            if payment_method.default_method == "mpesa":
                payment_data.update({
                    "mpesa_number": phone_number
                })

            elif payment_method.default_method == "bank":
                payment_data.update({
                    "bank_id": paybill_number,  # you might want to replace with actual bank name lookup
                    "account_number": account_number
                })

            elif payment_method.default_method == "paybill":
                payment_data.update({
                    "paybill_number": paybill_number,
                    "account_number": account_number
                })
            # Prepare text content for email
            if payment_data["payment_method"] == "mpesa":
                text_content = (
                    f"Hello {payment_data['user_name']},\n\n"
                    f"We have successfully processed your payout.\n\n"
                    f"Amount: KES {payment_data['amount']:,.2f}\n"
                    f"Sent to: M-Pesa number {mask_number(payment_data['mpesa_number'])}\n"
                    f"Transaction ID: {payment_data['transaction_id']}\n"
                    f"Transaction Fee: KES {payment_data['transaction_fee']:,.2f}\n"
                    f"Date: {payment_data['timestamp']}\n\n"
                    f"Thank you for using our service."
                )

            elif payment_data["payment_method"] == "bank":
                text_content = (
                    f"Hello {payment_data['user_name']},\n\n"
                    f"Your payout has been deposited successfully.\n\n"
                    f"Amount: KES {payment_data['amount']:,.2f}\n"
                    f"Bank ID: {payment_data['bank_id']}\n"
                    f"Account: {mask_number(payment_data['account_number'])}\n"
                    f"Transaction ID: {payment_data['transaction_id']}\n"
                    f"Transaction Fee: KES {payment_data['transaction_fee']:,.2f}\n"
                    f"Date: {payment_data['timestamp']}\n\n"
                    f"Thank you for using our service."
                )

            elif payment_data["payment_method"] == "paybill":
                text_content = (
                    f"Hello {payment_data['user_name']},\n\n"
                    f"Your payout has been processed via Paybill.\n\n"
                    f"Amount: KES {payment_data['amount']:,.2f}\n"
                    f"Paybill: {payment_data['paybill_number']}\n"
                    f"Account: {mask_number(payment_data['account_number'])}\n"
                    f"Transaction ID: {payment_data['transaction_id']}\n"
                    f"Transaction Fee: KES {payment_data['transaction_fee']:,.2f}\n"
                    f"Date: {payment_data['timestamp']}\n\n"
                    f"Thank you for using our service."
                )

            else:
                text_content = (
                    f"Hello {payment_data['user_name']},\n\n"
                    f"Your payout of KES {payment_data['amount']:,.2f} "
                    f"has been processed successfully.\n\n"
                    f"Transaction ID: {payment_data['transaction_id']}\n"
                    f"Transaction Fee: KES {payment_data['transaction_fee']:,.2f}\n"
                    f"Date: {payment_data['timestamp']}\n\n"
                    f"Thank you for using our service."
                )


            
            # Prepare subject line based on method
            if payment_data["payment_method"] == "mpesa":
                subject = f"KES {payment_data['amount']:,.2f} sent to your M-Pesa {mask_number(payment_data['mpesa_number'])}"
                header = "M-Pesa Payout Successful"
            elif payment_data["payment_method"] == "bank":
                subject = f"KES {payment_data['amount']:,.2f} deposited to your Bank Account {mask_number(payment_data['account_number'])}"
                header = "Bank Transfer Completed"
            elif payment_data["payment_method"] == "paybill":
                subject = f"KES {payment_data['amount']:,.2f} sent to Paybill {payment_data['paybill_number']}, Acc {mask_number(payment_data['account_number'])}"
                header = "Paybill Transfer Confirmation"
            else:
                subject = f"Payout of KES {payment_data['amount']:,.2f} processed"
                header = "Your Payout Confirmation"

            # Pass header into your template
            html = payout_confirmation_template(payment_data)
            send_email_async_task.delay(user.email, subject, html, text_content)
            logger.info(f"Payout Confirmation email sent to {email}")
    except Exception as e:
        logger.exception(f"Payout Confirmation email to user {user_id}")
        raise self.retry(exc=e)
    