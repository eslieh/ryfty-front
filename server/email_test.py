import smtplib, ssl
from email.message import EmailMessage
from utils.email_templates import verification_email_template
from dotenv import load_dotenv
import os

load_dotenv()
SMTP_SERVER = os.environ.get('SMTP_SERVER')
SMTP_PORT = os.environ.get('SMTP_PORT')
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASS = os.environ.get('SMTP_PASS')

def send_email(to_email, subject, html_content, plain_text=""):
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

# Example usage
name = "Eslieh"
token = "123456"

html = verification_email_template(name, token)
send_email("esliehh@gmail.com", "Verify your Ryfty account", html, f"Your code is {token}")
