"use client";

import Footer from "@/components/footer";
import PageTransition from "@/components/PageTransition";
import "@/app/globals.css";
import "@/styles/legal.css";
import { motion } from "framer-motion";

export default function TermsOfUse() {
  return (
    <PageTransition>
      <div className="legal-page">
        <div className="legal-container">
          <motion.header 
            className="legal-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>Terms of Use</h1>
            <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </motion.header>

          <motion.div 
            className="legal-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <section className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                Welcome to Ryfty, a platform that connects experience hosts with guests seeking authentic, local experiences. 
                These Terms of Use ("Terms") govern your use of our website, mobile application, and related services 
                (collectively, the "Service") operated by Ryfty ("we," "us," or "our").
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part 
                of these terms, you may not access the Service.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Description of Service</h2>
              <p>
                Ryfty is an online marketplace that enables users to:
              </p>
              <ul>
                <li>Create, list, and manage experience offerings as a host</li>
                <li>Discover, book, and participate in experiences as a guest</li>
                <li>Process payments for experiences through M-Pesa</li>
                <li>Communicate with other users through our platform</li>
                <li>Leave and read reviews and ratings</li>
              </ul>
              <p>
                We act as an intermediary between hosts and guests, facilitating transactions but not providing the 
                experiences directly.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. User Accounts and Registration</h2>
              <h3>3.1 Account Creation</h3>
              <p>
                To use certain features of our Service, you must create an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h3>3.2 Account Types</h3>
              <p>
                We offer different account types:
              </p>
              <ul>
                <li><strong>Guest Accounts:</strong> For users who book and participate in experiences</li>
                <li><strong>Host Accounts:</strong> For users who create and offer experiences</li>
                <li><strong>Business Accounts:</strong> For registered businesses offering experiences</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Host Responsibilities and Obligations</h2>
              <h3>4.1 Experience Requirements</h3>
              <p>
                As a host, you agree to:
              </p>
              <ul>
                <li>Provide accurate descriptions of your experiences</li>
                <li>Maintain appropriate insurance coverage for your activities</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Obtain necessary permits and licenses</li>
                <li>Ensure the safety of all participants</li>
                <li>Deliver experiences as described in your listings</li>
              </ul>

              <h3>4.2 Content and Listings</h3>
              <p>
                You are solely responsible for:
              </p>
              <ul>
                <li>All content you upload, including photos, descriptions, and pricing</li>
                <li>Ensuring your content does not infringe on third-party rights</li>
                <li>Maintaining the accuracy of your listings</li>
                <li>Responding to guest inquiries promptly</li>
              </ul>

              <h3>4.3 Pricing and Payments</h3>
              <p>
                Hosts set their own prices for experiences. We charge a 5% platform fee on completed reservations. 
                M-Pesa processing fees apply separately based on transaction amount and account type (B2C or B2B).
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Guest Responsibilities and Obligations</h2>
              <h3>5.1 Booking and Participation</h3>
              <p>
                As a guest, you agree to:
              </p>
              <ul>
                <li>Provide accurate information when booking</li>
                <li>Arrive on time for scheduled experiences</li>
                <li>Follow all safety instructions and guidelines</li>
                <li>Respect the host's property and other participants</li>
                <li>Pay all applicable fees and charges</li>
              </ul>

              <h3>5.2 Cancellation and Refunds</h3>
              <p>
                Cancellation policies vary by experience and are set by individual hosts. Refunds are subject to 
                the host's cancellation policy and our platform terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Payment Terms</h2>
              <h3>6.1 Payment Processing</h3>
              <p>
                All payments are processed through M-Pesa. We support both individual (B2C) and business (B2B) 
                payment methods. M-Pesa charges are based on transaction amounts and account types.
              </p>

              <h3>6.2 Platform Fees</h3>
              <p>
                We charge a 5% platform fee on completed reservations. This fee covers:
              </p>
              <ul>
                <li>Platform maintenance and updates</li>
                <li>Customer support services</li>
                <li>Payment processing</li>
                <li>Marketing and discovery tools</li>
                <li>Host protection and insurance</li>
              </ul>

              <h3>6.3 Payouts</h3>
              <p>
                Hosts receive payments within 24 hours of completed experiences, minus applicable fees. 
                Payouts are made directly to the host's M-Pesa account.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Prohibited Activities</h2>
              <p>
                You agree not to:
              </p>
              <ul>
                <li>Use the Service for any unlawful purpose or in violation of any laws</li>
                <li>Post false, misleading, or fraudulent content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Circumvent any security measures or payment systems</li>
                <li>Post content that violates intellectual property rights</li>
                <li>Engage in any form of discrimination or hate speech</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>8. Content and Intellectual Property</h2>
              <h3>8.1 User Content</h3>
              <p>
                You retain ownership of content you create and upload. By posting content, you grant us a 
                non-exclusive, worldwide, royalty-free license to use, display, and distribute your content 
                in connection with the Service.
              </p>

              <h3>8.2 Platform Content</h3>
              <p>
                The Service and its original content, features, and functionality are owned by Ryfty and are 
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, 
                use, and protect your information when you use our Service.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Disclaimers and Limitations of Liability</h2>
              <h3>10.1 Service Availability</h3>
              <p>
                We strive to provide continuous service availability but cannot guarantee uninterrupted access. 
                The Service is provided "as is" without warranties of any kind.
              </p>

              <h3>10.2 Third-Party Services</h3>
              <p>
                We are not responsible for the actions, content, or services of third parties, including hosts, 
                guests, or payment processors like M-Pesa.
              </p>

              <h3>10.3 Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Ryfty shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of the Service.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Ryfty and its officers, directors, employees, and agents 
                from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Termination</h2>
              <h3>12.1 Termination by You</h3>
              <p>
                You may terminate your account at any time by contacting us or using the account deletion feature 
                in your profile settings.
              </p>

              <h3>12.2 Termination by Us</h3>
              <p>
                We may terminate or suspend your account immediately, without prior notice, for conduct that we 
                believe violates these Terms or is harmful to other users, us, or third parties.
              </p>

              <h3>12.3 Effect of Termination</h3>
              <p>
                Upon termination, your right to use the Service ceases immediately. We may delete your account 
                and data, though some information may be retained as required by law.
              </p>
            </section>

            <section className="legal-section">
              <h2>13. Dispute Resolution</h2>
              <h3>13.1 Governing Law</h3>
              <p>
                These Terms are governed by the laws of Kenya, without regard to conflict of law principles.
              </p>

              <h3>13.2 Dispute Resolution Process</h3>
              <p>
                Before pursuing legal action, you agree to first contact us to attempt to resolve any disputes 
                through good faith negotiations.
              </p>

              <h3>13.3 Arbitration</h3>
              <p>
                Any disputes arising from these Terms or your use of the Service shall be resolved through binding 
                arbitration in accordance with the Arbitration Act of Kenya.
              </p>
            </section>

            <section className="legal-section">
              <h2>14. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes 
                through the Service or by email. Your continued use of the Service after such modifications 
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>15. General Provisions</h2>
              <h3>15.1 Entire Agreement</h3>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Ryfty 
                regarding the Service.
              </p>

              <h3>15.2 Severability</h3>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain 
                in full force and effect.
              </p>

              <h3>15.3 Waiver</h3>
              <p>
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of 
                those rights.
              </p>

              <h3>15.4 Contact Information</h3>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>Email: support@ryfty.net</li>
                <li>Address: Nairobi, Kenya</li>
                <li>Phone: +254 795 739288</li>
              </ul>
            </section>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </PageTransition>
  );
}
