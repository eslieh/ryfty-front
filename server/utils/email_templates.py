from utils.helpers import first_name

full_logo = "https://res.cloudinary.com/dfvauxrrg/image/upload/v1758229961/riqwmbhf5n9wtlh53thg.png"
favicon_logo = "https://res.cloudinary.com/dfvauxrrg/image/upload/v1758230015/bv548kucor95zbgxvhy1.png"

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
                    <div style="width: 80px; height: 80px; background: #4CAF50; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(76, 175, 80, 0.3);">
                        <span style="font-size: 36px; color: white;">✓</span>
                    </div>
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
                    <div style="background: #4CAF50; color: white; padding: 20px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 16px rgba(76, 175, 80, 0.25);">
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
                        <a href="https://ryfty.net" style="color: #4CAF50; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Visit Website
                        </a>
                        <a href="mailto:support@ryfty.net" style="color: #4CAF50; text-decoration: none; font-size: 14px; margin: 0 12px;">
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
                    <div style="width: 80px; height: 80px; background: #E53935; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(229, 57, 53, 0.3);">
                        <span style="font-size: 36px; color: white;">⚡</span>
                    </div>
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
    user = reservation["user"]
    experience = reservation["experience"]
    slot = reservation["slot"]
    name = first_name(user["name"])
    reservation_id = reservation["id"]
    title = experience["title"]
    slot_name = slot["name"]
    start_time = slot["start_time"]
    end_time = slot["end_time"]
    num_people = reservation["num_people"]
    total_price = reservation["total_price"]
    amount_paid = reservation["amount_paid"]
    status = reservation["status"].capitalize()
    created_at = reservation["created_at"][:10]  # YYYY-MM-DD

    return f"""
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #1a1a1a; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; margin: 0; min-height: 100vh;">
        <div style="max-width: 680px; margin: auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: #4CAF50; padding: 32px 40px; text-align: center; color: white;">
                <img src="{full_logo}" alt="Ryfty Logo" style="height: 48px; margin-bottom: 16px; filter: brightness(0) invert(1);" />
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    Booking Confirmed
                </h1>
                <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">
                    Thank you for choosing Ryfty, {name}
                </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
                
                <!-- Success Message -->
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                    <div style="width: 60px; height: 60px; background: #4CAF50; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 24px; color: white;">✓</span>
                    </div>
                    <h2 style="margin: 0 0 8px; color: #166534; font-size: 20px; font-weight: 600;">
                        Reservation {status}
                    </h2>
                    <p style="margin: 0; color: #15803d; font-size: 14px;">
                        Your experience is confirmed and we've sent this receipt to your email
                    </p>
                </div>

                <!-- Receipt Section -->
                <div style="background: #fafafa; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #d1d5db;">
                        <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                            Booking Receipt
                        </h3>
                        <span style="background: #4CAF50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                            {status}
                        </span>
                    </div>

                    <!-- Reservation Details -->
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Confirmation Number</span>
                            <span style="color: #1f2937; font-weight: 600; font-family: 'Courier New', monospace;">#{reservation_id}</span>
                        </div>
                        
                        <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
                            <h4 style="margin: 0 0 12px; color: #1f2937; font-size: 16px; font-weight: 600;">
                                {title}
                            </h4>
                            <div style="display: grid; gap: 8px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #6b7280; font-size: 14px;">Time Slot</span>
                                    <span style="color: #1f2937; font-weight: 500;">{slot_name}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #6b7280; font-size: 14px;">Duration</span>
                                    <span style="color: #1f2937; font-weight: 500;">{start_time} - {end_time}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #6b7280; font-size: 14px;">Party Size</span>
                                    <span style="color: #1f2937; font-weight: 500;">{num_people} {"person" if num_people == 1 else "people"}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #6b7280; font-size: 14px;">Booking Date</span>
                                    <span style="color: #1f2937; font-weight: 500;">{created_at}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Summary -->
                    <div style="border-top: 2px dashed #d1d5db; padding-top: 20px;">
                        <h4 style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                            Payment Summary
                        </h4>
                        <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: #6b7280; font-size: 14px;">Experience Fee</span>
                                <span style="color: #1f2937;">${total_price:.2f}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: #6b7280; font-size: 14px;">Platform Fee</span>
                                <span style="color: #1f2937;">$0.00</span>
                            </div>
                            <div style="border-top: 1px solid #e5e7eb; margin-top: 12px; padding-top: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #1f2937; font-size: 16px; font-weight: 600;">Total Paid</span>
                                    <span style="color: #4CAF50; font-size: 20px; font-weight: 700;">${amount_paid:.2f}</span>
                                </div>
                            </div>
                            <div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
                                <div style="display: flex; align-items: center; justify-content: center;">
                                    <span style="color: #15803d; font-size: 12px; font-weight: 600;">
                                        PAYMENT CONFIRMED
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="https://ryfty.net/reservations/{reservation_id}" 
                       style="background: #4CAF50; color: white; padding: 16px 32px; border-radius: 24px; 
                              text-decoration: none; font-weight: 600; font-size: 16px;
                              display: inline-block; box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);">
                        View Complete Details
                    </a>
                    <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">
                        Access your booking details anytime on our platform
                    </p>
                </div>

                <!-- Preparation Guidelines -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                    <h4 style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: 600;">
                        Before Your Experience:
                    </h4>
                    <div style="color: #4b5563; line-height: 1.6;">
                        <p style="margin: 0 0 8px;">• Arrive 10 minutes before your scheduled time</p>
                        <p style="margin: 0 0 8px;">• Bring valid identification for verification</p>
                        <p style="margin: 0 0 8px;">• Keep your confirmation number handy</p>
                        <p style="margin: 0;">• Contact support if you have any questions</p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                <div style="text-align: center;">
                    <img src="{full_logo}" alt="Ryfty" style="height: 54px; width: auto; margin-bottom: 16px; opacity: 0.7;">
                    <p style="margin: 0 0 8px; font-size: 16px; color: #1f2937; font-weight: 600;">
                        Ryfty
                    </p>
                    <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
                        In the end, we only keep the experiences. ✨
                    </p>
                    <div style="margin-bottom: 16px;">
                        <a href="https://ryfty.net" style="color: #4CAF50; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Visit Website
                        </a>
                        <a href="mailto:support@ryfty.net" style="color: #4CAF50; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Contact Support
                        </a>
                        <a href="#" style="color: #4CAF50; text-decoration: none; font-size: 14px; margin: 0 12px;">
                            Mobile App
                        </a>
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                            © 2025 Ryfty. All rights reserved. | Confirmation #{reservation_id}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    """