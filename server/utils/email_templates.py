from utils.helpers import first_name

full_logo = "https://res.cloudinary.com/dfvauxrrg/image/upload/v1758229961/riqwmbhf5n9wtlh53thg.png"
favicon_logo = "https://lh3.googleusercontent.com/rd-d/ALs6j_EVLU4yIZvZQtOHAWobxTp3XFZZEpIAT1IM3JDeFiCxi4Itd-_a115vgSG71oi0Wb4o3vubT76egdyKOtC0qLA8j8lmkkNLzKHfTrXpVeNZMELBvzLJFjKS5Hw9_Z0gecDU4wSQ6MqfY6p_inFd71uQJ3nBtLNZYjfEJHH4vff1qcDjlXtZpOTz3OZF4f-mtsv-PEyN7_X2iKJbwuI4jzTWGwYlv3xD5uEFAWIti2o41BrAaIEh-dc4NWllB_wkvb3_LrpAo4gx9Ocx2PjZz5Dy0e4DQSGpm-9fXYDqgP6utEGMmkF0-gLdNoSxiMLTVGaRYesChW98-YV1cvoQceKWC0SezT1MRyiURcCGXTdUtAvICNHhKKTtT7ckZ3Up07Tnr4Il-YVxZd3yFZ8Xz0dG1OEBfatopgzHiwqdxTjLl_yPwH1gfTeVXKp4nyFKRxENu0Yu5PVMzYMqQVgTfzRURkt3RB-DYeAQx059TWsRkjczVq2_8kA9ICKJx3RQUnMBaPhpAKNy4YE3G7xh0Wx_XAlWtsHm2js7gEstKxawuq2BnozZCzQ40UW3kcNeyh1l3_lqTLHXXoUV8jj-fckfBHHLFdFgi6PkhMbjwxRECUPhDrL7uGMVUrqaMdAKZRw8fuz4URlczyTpKoTfr7BPS3WlUspg8Jq8zuK7kO1LwoXORmPHA8f-abxOE5Z_nhaJz2e7yzSjmAW-ShutO6NJPSMHtN2bNWIoy2M_mLJOYeLa7eQaQdQ9bbyYNCd5d444geAJqI2dOVdB9g0e-qL0Jwu_AuFKLjq88jv9OSyg0wNlEg03zmq5EQRl3WybMKirI7CTjyvH9oNQIah2m_weVwOV35nlAzOM-9x9AmwWmquF_c1hgKmroF2lF6G1yAVNrbaxkpYpx4vF-iE3s3apjEBRBuHnGe5ERjkrgRs4qPkd-bF61lnvuocttt474XPgEtxJFrBfHD-wUHpUHEQlcRnPsR1ysTd6bsyFlZG7uoQBNJexYx_6dZLOs9tpk81202yQLR3P6G7pbDh66kl3CfJaahSI7G3B=w1366-h626?auditContext=prefetch"
full_logo_url = full_logo
logo_url = full_logo
def verification_email_template(name, token):
    name = first_name(name)
    return f"""
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #1a1a1a; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; margin: 0; min-height: 100vh;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: #ffffff; padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                <img src="{full_logo}" alt="Ryfty" style="height: 48px; width: auto; margin-bottom: 8px;">
            </div>
            
            <!-- Main Content -->
            <div style="padding: 48px 40px;">
                <!-- Welcome Section -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">
                        Welcome to Ryfty, {name}
                    </h1>
                    <p style="margin: 0; font-size: 18px; color: #6b7280; line-height: 1.5;">
                        Thank you for joining our community of skilled professionals and opportunity seekers
                    </p>
                </div>
                
                <!-- Verification Code Section -->
                <div style="background: #f8fffe; border: 2px solid #dcfce7; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
                    <p style="margin: 0 0 24px; font-size: 16px; color: #374151; font-weight: 500;">
                        To complete your registration, please use this verification code:
                    </p>
                    <div style="background: #00915a; color: white; padding: 20px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 16px rgba(76, 175, 80, 0.25);">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; font-family: 'Courier New', monospace;">
                            {token}
                        </span>
                    </div>
                    <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500;">
                            This code expires in 30 minutes
                        </p>
                    </div>
                </div>
                
                <!-- Platform Benefits -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="margin: 0 0 16px; font-size: 18px; color: #1f2937; font-weight: 600;">
                        What you can do with Ryfty:
                    </h3>
                    <div style="color: #4b5563; line-height: 1.6;">
                        <p style="margin: 0 0 8px;">• Connect with trusted local professionals</p>
                        <p style="margin: 0 0 8px;">• Post tasks and find skilled help nearby</p>
                        <p style="margin: 0 0 8px;">• Build your reputation in the community</p>
                        <p style="margin: 0;">• Experience fair pricing and secure payments</p>
                    </div>
                </div>
                
                <!-- Security Notice -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                        If you didn't create a Ryfty account, you can safely ignore this email.<br>
                        For your security, never share this verification code with anyone.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 32px 40px; border-top: 1px solid #f0f0f0;">
                <div style="text-align: center;">
                    <img src="{full_logo}" alt="Ryfty" style="height: 50px; width: auto; margin-bottom: 16px; opacity: 0.7;">
                    <p style="margin: 0 0 8px; font-size: 16px; color: #1f2937; font-weight: 600;">
                        Ryfty
                    </p>
                    <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
                        In the end, we only keep the experiences. ✨
                    </p>
                    <div style="margin-bottom: 16px;">
                        <a href="https://ryfty.net" style="color: #00915a; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Visit Website
                        </a>
                        <a href="mailto:support@ryfty.net" style="color: #00915a; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Contact Support
                        </a>
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                            © 2025 Ryfty. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    """


def password_recovery_email_template(name, token):
    name = first_name(name)
    return f"""
    <body>
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: #ffffff; padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                <img src="{full_logo}" alt="Ryfty" style="height: 48px; width: auto; margin-bottom: 8px;">
            </div>
            
            <!-- Main Content -->
            <div style="padding: 48px 40px;">
                <!-- Security Alert Section -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">
                        Password Reset Request
                    </h1>
                    <p style="margin: 0; font-size: 18px; color: #6b7280; line-height: 1.5;">
                        Hi {name}, we received a request to reset your Ryfty password
                    </p>
                </div>
                
                <!-- Verification Code Section -->
                <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
                    <p style="margin: 0 0 24px; font-size: 16px; color: #374151; font-weight: 500;">
                        Use this verification code to reset your password:
                    </p>
                    <div style="background: #E53935; color: white; padding: 20px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 16px rgba(229, 57, 53, 0.25);">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; font-family: 'Courier New', monospace;">
                            {token}
                        </span>
                    </div>
                    <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500;">
                            This code expires in 15 minutes for your security
                        </p>
                    </div>
                </div>
                
                <!-- Security Steps -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="margin: 0 0 16px; font-size: 18px; color: #1f2937; font-weight: 600;">
                        Steps to secure your account:
                    </h3>
                    <div style="color: #4b5563; line-height: 1.6;">
                        <p style="margin: 0 0 8px;">• Enter the verification code above</p>
                        <p style="margin: 0 0 8px;">• Create a strong, unique password</p>
                        <p style="margin: 0 0 8px;">• Confirm your new password</p>
                        <p style="margin: 0;">• Sign in securely with new credentials</p>
                    </div>
                </div>
                
                <!-- Security Tips -->
                <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <h4 style="margin: 0 0 12px; font-size: 16px; color: #065f46; font-weight: 600;">
                        Creating a secure password:
                    </h4>
                    <div style="color: #047857; line-height: 1.6; font-size: 14px;">
                        <p style="margin: 0 0 6px;">• Use at least 8 characters with mixed case and numbers</p>
                        <p style="margin: 0 0 6px;">• Avoid personal information or common phrases</p>
                        <p style="margin: 0;">• Consider using a trusted password manager</p>
                    </div>
                </div>
                
                <!-- Security Notice -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px;">
                        <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5; font-weight: 500;">
                            Didn't request a password reset?<br>
                            Your account remains secure. You can safely ignore this email.<br>
                            Never share this verification code with anyone.
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 32px 40px; border-top: 1px solid #f0f0f0;">
                <div style="text-align: center;">
                    <img src="{full_logo}" alt="Ryfty" style="height: 54px; width: auto; margin-bottom: 16px; opacity: 0.7;">
                    <p style="margin: 0 0 8px; font-size: 16px; color: #1f2937; font-weight: 600;">
                        Ryfty Security Team
                    </p>
                    <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
                        Protecting your account and privacy
                    </p>
                    <div style="margin-bottom: 16px;">
                        <a href="https://ryfty.net" style="color: #E53935; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Visit Website
                        </a>
                        <a href="mailto:support@ryfty.net" style="color: #E53935; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Contact Support
                        </a>
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                            © 2025 Ryfty. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    """

def reservation_receipt_email_template(reservation):
    """
    Generates a professional, mobile-friendly, and size-optimized HTML email receipt.
    
    Optimizations to prevent truncation:
    - Minimized inline CSS
    - Reduced table nesting
    - Compressed whitespace
    - Uses external logo URL
    - Streamlined structure
    """
    # --- Data Extraction ---
    user = reservation.get("user", {})
    experience = reservation.get("experience", {})
    slot = reservation.get("slot", {})

    def first_name(full_name):
        if not full_name or not isinstance(full_name, str):
            return "Valued Customer"
        return full_name.split(" ")[0]

    # --- Variables ---
    name = first_name(user.get("name"))
    reservation_id = reservation.get("id", "N/A")
    title = experience.get("title", "Your Experience")
    slot_name = slot.get("name", "Standard Slot")
    start_time = slot.get("start_time", "TBD")
    end_time = slot.get("end_time", "TBD")
    num_people = reservation.get("num_people", 1)
    total_price = reservation.get("total_price", 0.0)
    amount_paid = reservation.get("amount_paid", 0.0)
    status = reservation.get("status", "Confirmed").capitalize()
    created_at = str(reservation.get("created_at", "today"))[:10]
    
    # Minimal CSS - only essential styles
    css = """body{margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif}
.w{width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.1)}
.p{padding:24px}.c{text-align:center}.g{color:#00915a}.b{font-weight:600}.s{font-size:14px}.m{margin:0}
table{border-spacing:0}td{padding:0}img{border:0}a{color:#00915a;text-decoration:none}
.success{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;color:#166534}
.info{background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:16px}"""
    
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style></head><body>
<div style="display:none;max-height:0;overflow:hidden">Reservation #{reservation_id} confirmed</div>
<div class="w">
<div class="p c" style="border-bottom:1px solid #e5e7eb">
<img src="{logo_url}" alt="Ryfty" style="height:48px">
<p class="m s">Thank you, {name}</p>
</div>

<div class="p">
<div class="success c">
<h2 class="m b">Reservation {status}</h2>
<p class="m s">Your booking is confirmed</p>
</div>

<div style="height:24px"></div>

<div class="info">
<h3 class="m b" style="margin-bottom:16px">Booking Receipt</h3>
<p class="m s"><strong>#{reservation_id}</strong></p>

<div style="height:16px"></div>

<div style="background:#fff;border-radius:6px;padding:16px">
<h4 class="m b">{title}</h4>
<table width="100%" style="margin-top:8px">
<tr><td class="s">Slot:</td><td class="s" style="text-align:right">{slot_name}</td></tr>
<tr><td class="s">Time:</td><td class="s" style="text-align:right">{start_time} - {end_time}</td></tr>
<tr><td class="s">Party:</td><td class="s" style="text-align:right">{num_people} {"person" if num_people == 1 else "people"}</td></tr>
<tr><td class="s">Date:</td><td class="s" style="text-align:right">{created_at}</td></tr>
</table>
</div>

<div style="height:16px"></div>

<div style="background:#fff;border-radius:6px;padding:16px">
<h4 class="m b">Payment</h4>
<table width="100%" style="margin-top:8px">
<tr><td class="s">Experience Fee:</td><td class="s" style="text-align:right">KES {total_price:.2f}</td></tr>
<tr><td class="s">Platform Fee:</td><td class="s" style="text-align:right">KES 0.00</td></tr>
<tr><td class="b">Total Paid:</td><td class="b g" style="text-align:right">KES {amount_paid:.2f}</td></tr>
</table>
<div style="background:#f0fdf4;padding:8px;margin-top:12px;border-radius:4px;text-align:center">
<span style="color:#166534;font-size:12px;font-weight:600">PAYMENT CONFIRMED</span>
</div>
</div>
</div>

<div class="c" style="margin-top:24px">
<a href="https://ryfty.net/reservations/{reservation_id}" style="background:#00915a;color:#fff;padding:14px 28px;border-radius:24px;font-weight:600;display:inline-block">View Details</a>
</div>

<div style="background:#f9fafb;margin-top:24px;padding:16px;border-radius:8px">
<h4 class="m b">Before Your Experience:</h4>
<p class="m s">&bull; Arrive 10 minutes early<br>
&bull; Bring valid ID<br>
&bull; Keep confirmation #{reservation_id} handy</p>
</div>
</div>

<div class="p c" style="background:#f9fafb;border-top:1px solid #e5e7eb">
<img src="{logo_url}" alt="Ryfty" style="height:36px;opacity:.7">
<p class="m s" style="margin-top:8px">Ryfty - Experience More ✨</p>
<p class="m" style="font-size:12px;color:#666;margin-top:8px">
<a href="https://ryfty.net">Website</a> | <a href="mailto:support@ryfty.net">Support</a>
</p>
<p class="m" style="font-size:11px;color:#999;margin-top:12px">© 2025 Ryfty | #{reservation_id}</p>
</div>
</div>
</body></html>"""



def payment_acknowledgment_email_template(payment_data):
    """
    Enhanced payment acknowledgment email template.
    Accommodates all data from the worker payload with improved formatting.
    
    Args:
        payment_data (dict): Contains all payment and experience information
    """
    
    def first_name(full_name):
        if not full_name or not isinstance(full_name, str):
            return "Valued Customer"
        return full_name.split(" ")[0]
    
    def format_datetime(timestamp_str):
        if not timestamp_str:
            return "Recently"
        try:
            from datetime import datetime
            # Handle multiple timestamp formats
            if 'T' in timestamp_str:
                dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            else:
                dt = datetime.fromisoformat(timestamp_str)
            return dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            return str(timestamp_str)[:19] if len(str(timestamp_str)) > 19 else str(timestamp_str)
    
    def format_slot_time(start_time, end_time):
        if not start_time:
            return "Time TBD"
        try:
            from datetime import datetime
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            if end_time:
                end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                return f"{start_dt.strftime('%I:%M %p')} - {end_dt.strftime('%I:%M %p')}"
            else:
                return start_dt.strftime('%I:%M %p')
        except:
            return "Time TBD"
    
    # --- Data Extraction ---
    username = payment_data.get("username", "Valued Customer")
    name = first_name(username)
    mpesa_number = payment_data.get("mpesa_number", "N/A")
    transaction_id = payment_data.get("transaction_id", "N/A")
    amount = payment_data.get("amount", 0.0)
    timestamp = payment_data.get("timestamp", "")
    slot_name = payment_data.get("slot_name", "Experience Slot")
    slot_id = payment_data.get("slot_id", "N/A")
    experience_name = payment_data.get("experience_name", "Experience")
    experience_title = payment_data.get("experience_title", experience_name)
    slot_start_time = payment_data.get("slot_start_time", "")
    slot_end_time = payment_data.get("slot_end_time", "")
    
    formatted_payment_time = format_datetime(timestamp)
    formatted_slot_time = format_slot_time(slot_start_time, slot_end_time)
    
    # Show experience date if available
    experience_date = ""
    if slot_start_time:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(slot_start_time.replace('Z', '+00:00'))
            experience_date = dt.strftime("%A, %B %d, %Y")
        except:
            experience_date = ""
    
    # Minimal CSS matching reservation template
    css = """body{margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif}
.w{width:100%;max-width:680px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.1)}
.p{padding:24px}.c{text-align:center}.g{color:#00915a}.b{font-weight:600}.s{font-size:14px}.m{margin:0}
table{border-spacing:0}td{padding:0}img{border:0}a{color:#00915a;text-decoration:none}
.success{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;color:#166534}
.info{background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:16px}
.exp{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:16px}"""
    
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style></head><body>
<div style="display:none;max-height:0;overflow:hidden">Payment of KES {amount:.2f} received for {experience_title} - Transaction #{transaction_id}</div>
<div class="w">
<div class="p c" style="border-bottom:1px solid #e5e7eb">
<img src="{logo_url}" alt="Ryfty" style="height:48px">
<p class="m s">Payment received, {name}</p>
</div>

<div class="p">
<div class="success c">
<h2 class="m b">Payment Acknowledged</h2>
<p class="m s">We have received your M-Pesa payment successfully</p>
</div>

<div style="height:24px"></div>

<div class="info">
<h3 class="m b" style="margin-bottom:16px">Payment Receipt</h3>
<p class="m s"><strong>Transaction #{transaction_id}</strong></p>

<div style="height:16px"></div>

<div style="background:#fff;border-radius:6px;padding:16px;border:1px solid #e5e7eb">
<h4 class="m b g" style="font-size:20px">KES {amount:.2f}</h4>
<table width="100%" style="margin-top:12px">
<tr><td class="s">From:</td><td class="s" style="text-align:right">{username}</td></tr>
<tr><td class="s">M-Pesa Number:</td><td class="s" style="text-align:right">{mpesa_number}</td></tr>
<tr><td class="s">Payment Time:</td><td class="s" style="text-align:right">{formatted_payment_time}</td></tr>
</table>
</div>

<div class="exp">
<h4 class="m b">{experience_title}</h4>
<table width="100%" style="margin-top:8px">
<tr><td class="s">Slot:</td><td class="s" style="text-align:right">{slot_name}</td></tr>
<tr><td class="s">Slot ID:</td><td class="s" style="text-align:right">#{slot_id}</td></tr>
{f"<tr><td class='s'>Date:</td><td class='s' style='text-align:right'>{experience_date}</td></tr>" if experience_date else ""}
{f"<tr><td class='s'>Time:</td><td class='s' style='text-align:right'>{formatted_slot_time}</td></tr>" if formatted_slot_time != "Time TBD" else ""}
</table>
</div>

<div style="height:16px"></div>

<div style="background:#f0fdf4;padding:12px;border-radius:6px;border:1px solid #bbf7d0;text-align:center">
<span style="color:#166534;font-size:12px;font-weight:600;letter-spacing:.5px">PAYMENT RECEIVED</span>
</div>
</div>

<div class="c" style="margin-top:24px">
<a href="https://ryfty.net/experiences/{payment_data.get('experience_id', '')}" style="background:#00915a;color:#fff;padding:14px 28px;border-radius:24px;font-weight:600;display:inline-block">View Experience Details</a>
<p class="m s" style="margin-top:8px;color:#6b7280">Check your booking and experience information</p>
</div>

<div style="background:#f9fafb;margin-top:24px;padding:16px;border-radius:8px">
<h4 class="m b">What's Next:</h4>
<p class="m s">&bull; Your payment is being processed<br>
&bull; Booking confirmation will follow shortly<br>
&bull; You'll receive experience details and instructions<br>
&bull; Keep this receipt for your records</p>
</div>
</div>

<div class="p c" style="background:#f9fafb;border-top:1px solid #e5e7eb">
<img src="{logo_url}" alt="Ryfty" style="height:36px;opacity:.7">
<p class="m s" style="margin-top:8px">Ryfty - Experience More ✨</p>
<p class="m" style="font-size:12px;color:#666;margin-top:8px">
<a href="https://ryfty.net">Website</a> | <a href="mailto:support@ryfty.net">Support</a>
</p>
<p class="m" style="font-size:11px;color:#999;margin-top:12px">© 2025 Ryfty | Transaction #{transaction_id}</p>
</div>
</div>
</body></html>"""

def payment_failed_email_template(payment_data):
    """
    Generates a payment failure notification email.
    
    Args:
        payment_data (dict): Contains payment attempt information
    """
    user = payment_data.get("user", {})
    name = first_name(user.get("name", "Valued Customer"))
    amount = payment_data.get("amount", 0.0)
    method = payment_data.get("method", "Payment Method")
    reason = payment_data.get("failure_reason", "Payment could not be processed")
    reservation_id = payment_data.get("reservation_id", "")
    retry_url = payment_data.get("retry_url", "https://ryfty.net/payments")

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{{font-family:Arial,sans-serif;color:#333;background:#dc2626;padding:20px;margin:0}}
.c{{max-width:500px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}}
.h{{padding:20px;text-align:center;border-bottom:1px solid #eee}}
.m{{padding:30px 20px}}
.r{{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0}}
.t{{width:100%;margin:10px 0}}
.t td{{padding:5px 0;border-bottom:1px solid #f3f4f6}}
.l{{color:#666;font-size:14px}}
.v{{font-weight:bold;text-align:right}}
.failed{{background:#dc2626;color:white;padding:8px 16px;border-radius:4px;font-weight:bold;display:inline-block;margin:10px auto}}
.retry{{background:#00915a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;margin:15px auto}}
</style>
</head>
<body>
<div class="c">
<div class="h">
<img src="{full_logo_url}" alt="Ryfty" style="height:40px">
</div>
<div class="m">
<h1 style="text-align:center;margin:0 0 10px;font-size:24px;color:#dc2626">Payment Failed</h1>
<p style="text-align:center;margin:0 0 30px;color:#666">Hi {name}, we couldn't process your payment</p>

<div class="r">
<div style="text-align:center;margin-bottom:20px">
<div class="failed">✗ FAILED</div>
</div>

<h3 style="text-align:center;margin:0 0 15px;color:#dc2626">KES {amount:.2f}</h3>
<table class="t">
<tr><td class="l">Payment Method</td><td class="v">{method}</td></tr>
<tr><td class="l">Reason</td><td class="v" style="color:#dc2626">{reason}</td></tr>
{f"<tr><td class='l'>Reservation</td><td class='v'>#{reservation_id}</td></tr>" if reservation_id else ""}
</table>
</div>

<div style="text-align:center;margin:20px 0">
<a href="{retry_url}" class="retry">Try Payment Again</a>
</div>

<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:12px;color:#92400e;font-size:14px;margin:15px 0">
<strong>Common Solutions:</strong><br>
• Check your account balance<br>
• Verify payment details are correct<br>
• Try a different payment method<br>
• Contact your bank if issues persist
</div>

<p style="text-align:center;font-size:14px;color:#666">
Need Help? <a href="mailto:support@ryfty.net" style="color:#dc2626">Contact Support</a><br>
<strong>Ryfty</strong> | <a href="https://ryfty.net" style="color:#00915a">Website</a>
</p>
</div>
</div>
</body>
</html>"""


def refund_acknowledgment_email_template(refund_data):
    """
    Generates a refund acknowledgment email - confirms we've received and approved the refund request.
    
    Args:
        refund_data (dict): Contains refund information
    """
    name = refund_data.get("user_name", "Valued Customer")
    refund_id = refund_data.get("refund_id", "N/A")
    amount = refund_data.get("amount", 0.0)
    transaction_id = refund_data.get("transaction_id", "N/A")
    reason = refund_data.get("reason", "As requested")

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{{font-family:Arial,sans-serif;color:#333;background:#1f2937;padding:20px;margin:0}}
.c{{max-width:500px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}}
.h{{padding:20px;text-align:center;border-bottom:1px solid #eee}}
.m{{padding:30px 20px}}
.t{{width:100%;margin:10px 0}}
.t td{{padding:5px 0;border-bottom:1px solid #f3f4f6}}
.l{{color:#666;font-size:14px}}
.v{{font-weight:bold;text-align:right}}
.refund{{background:#0284c7;color:white;padding:8px 16px;border-radius:4px;font-weight:bold;display:inline-block;margin:10px auto}}
</style>
</head>
<body>
<div class="c">
<div class="h">
<img src="{full_logo_url}" alt="Ryfty" style="height:40px">
</div>
<div class="m">
<h1 style="text-align:center;margin:0 0 10px;font-size:24px;color:#0284c7">Refund Request Approved</h1>
<p style="text-align:center;margin:0 0 30px;color:#666">We've approved your refund request, {name}</p>


<h3 style="text-align:center;margin:0 0 15px;color:#0284c7">KES {amount:.2f}</h3>
<table class="t">
<tr><td class="l">Refund ID</td><td class="v" style="font-family:monospace">{refund_id}</td></tr>
<tr><td class="l">Transaction Ref</td><td class="v" style="font-family:monospace">{transaction_id}</td></tr>
<tr><td class="l">Reason</td><td class="v">{reason}</td></tr>
</table>
</div>

<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:12px;color:#92400e;font-size:14px;margin:15px 0">
<strong>What happens next:</strong><br>
• Your refund is being processed by our payment team<br>
• We'll send a confirmation once the money is transferred<br>
• Contact support if you don't receive it within the expected timeframe
</div>

<p style="text-align:center;font-size:14px;color:#666">
Refund ID: {refund_id}<br>
<strong>Ryfty</strong> | <a href="https://ryfty.net" style="color:#0284c7">Website</a> | <a href="mailto:support@ryfty.net" style="color:#0284c7">Support</a>
</p>
</div>
</div>
</body>
</html>"""