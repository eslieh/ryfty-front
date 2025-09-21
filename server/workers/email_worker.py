import logging
from celery_app import celery
from flask import current_app
from services.email_service import send_email
from utils.email_templates import verification_email_template, password_recovery_email_template

logger = logging.getLogger(__name__)

@celery.task(bind=True, name="workers.send_verification_email", max_retries=3, default_retry_delay=30)
def send_verification_email(self, name, email, token):
    """
    Celery task to send a verification email to a user.
    """
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
    """
    Celery task to send a verification email to a user.
    """
    try:
        with current_app.app_context():

            html = password_recovery_email_template(name, token)
            send_email(email, "Password Recovery for Ryfty account", html, f"Your OTP is {token}")

            logger.info(f"Verification email sent to {email}")

    except Exception as e:
        logger.exception(f"Failed to send verification email to user {name}")
        raise self.retry(exc=e)
