import smtplib, ssl
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

def send_email(to_email: str, subject: str, html_content: str, plain_text: str = ""):
    """Reusable email sender"""
    msg = EmailMessage()
    msg["From"] = f"Ryfty <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(plain_text or "Please view this email in HTML.")
    msg.add_alternative(html_content, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
