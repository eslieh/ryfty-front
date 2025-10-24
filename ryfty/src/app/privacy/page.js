"use client";

import Footer from "@/components/footer";
import PageTransition from "@/components/PageTransition";
import "@/app/globals.css";
import "@/styles/legal.css";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </motion.header>

          <motion.div 
            className="legal-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <section className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                At Ryfty, we are committed to protecting your privacy and personal information. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our platform 
                to discover, book, or host experiences.
              </p>
              <p>
                By using our Service, you consent to the data practices described in this policy. If you do not 
                agree with our practices, please do not use our Service.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Information We Collect</h2>
              <h3>2.1 Information You Provide Directly</h3>
              <p>We collect information you provide when you:</p>
              <ul>
                <li><strong>Create an Account:</strong> Name, email address, phone number, profile photo</li>
                <li><strong>Host Experiences:</strong> Business information, experience descriptions, pricing, availability</li>
                <li><strong>Book Experiences:</strong> Booking details, payment information, special requirements</li>
                <li><strong>Communicate:</strong> Messages, reviews, ratings, feedback</li>
                <li><strong>Contact Support:</strong> Support requests, correspondence</li>
              </ul>

              <h3>2.2 Information We Collect Automatically</h3>
              <p>When you use our Service, we automatically collect:</p>
              <ul>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address</li>
                <li><strong>Location Data:</strong> General location (city/region) for experience discovery</li>
                <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics data</li>
                <li><strong>Log Data:</strong> Server logs, error reports, performance metrics</li>
              </ul>

              <h3>2.3 Information from Third Parties</h3>
              <p>We may receive information from:</p>
              <ul>
                <li><strong>Payment Processors:</strong> M-Pesa transaction data, payment confirmations</li>
                <li><strong>Social Media:</strong> Profile information when you sign up with Google</li>
                <li><strong>Analytics Providers:</strong> Usage statistics and performance data</li>
                <li><strong>Business Partners:</strong> Marketing and referral data</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <h3>3.1 Service Provision</h3>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and maintain our platform services</li>
                <li>Process bookings and payments</li>
                <li>Facilitate communication between hosts and guests</li>
                <li>Manage user accounts and profiles</li>
                <li>Provide customer support</li>
              </ul>

              <h3>3.2 Platform Improvement</h3>
              <p>We use data to:</p>
              <ul>
                <li>Analyze usage patterns and improve our platform</li>
                <li>Develop new features and services</li>
                <li>Optimize user experience and interface</li>
                <li>Conduct research and analytics</li>
              </ul>

              <h3>3.3 Communication</h3>
              <p>We may use your information to:</p>
              <ul>
                <li>Send service-related notifications</li>
                <li>Provide updates about your bookings</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Respond to your inquiries and support requests</li>
              </ul>

              <h3>3.4 Safety and Security</h3>
              <p>We use information to:</p>
              <ul>
                <li>Verify user identities and prevent fraud</li>
                <li>Ensure platform safety and security</li>
                <li>Investigate and prevent violations of our terms</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Information Sharing and Disclosure</h2>
              <h3>4.1 Public Information</h3>
              <p>The following information may be visible to other users:</p>
              <ul>
                <li>Host profiles and experience listings</li>
                <li>Public reviews and ratings</li>
                <li>Experience photos and descriptions</li>
                <li>General location information</li>
              </ul>

              <h3>4.2 Service Providers</h3>
              <p>We share information with trusted third parties who help us operate our platform:</p>
              <ul>
                <li><strong>Payment Processors:</strong> M-Pesa for payment processing</li>
                <li><strong>Cloud Services:</strong> Data storage and hosting providers</li>
                <li><strong>Analytics:</strong> Usage and performance analytics</li>
                <li><strong>Communication:</strong> Email and messaging services</li>
                <li><strong>Security:</strong> Fraud prevention and security services</li>
              </ul>

              <h3>4.3 Legal Requirements</h3>
              <p>We may disclose information when required by law or to:</p>
              <ul>
                <li>Comply with legal processes or government requests</li>
                <li>Protect our rights, property, or safety</li>
                <li>Protect the rights, property, or safety of our users</li>
                <li>Investigate or prevent illegal activities</li>
              </ul>

              <h3>4.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, user information may be transferred 
                as part of the business transaction.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Data Security</h2>
              <h3>5.1 Security Measures</h3>
              <p>We implement appropriate security measures to protect your information:</p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and updates</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>

              <h3>5.2 Data Retention</h3>
              <p>
                We retain your information for as long as necessary to provide our services and comply with 
                legal obligations. Account data is typically retained for the duration of your account plus 
                a reasonable period for business and legal purposes.
              </p>

              <h3>5.3 International Transfers</h3>
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Your Rights and Choices</h2>
              <h3>6.1 Access and Control</h3>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Update or correct your information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h3>6.2 Account Settings</h3>
              <p>
                You can manage your privacy preferences through your account settings, including:
              </p>
              <ul>
                <li>Profile visibility settings</li>
                <li>Communication preferences</li>
                <li>Data sharing options</li>
                <li>Account deletion requests</li>
              </ul>

              <h3>6.3 Cookies and Tracking</h3>
              <p>
                You can control cookies through your browser settings. However, disabling certain cookies 
                may affect the functionality of our Service.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If we become aware that we have collected personal 
                information from a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Third-Party Services</h2>
              <p>
                Our Service may contain links to third-party websites or services. This Privacy Policy does not 
                apply to these third-party services. We encourage you to read the privacy policies of any 
                third-party services you use.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Data Protection Compliance</h2>
              <h3>9.1 Kenyan Data Protection Act</h3>
              <p>
                We comply with the Data Protection Act, 2019 of Kenya, which governs the collection, use, 
                and protection of personal data in Kenya.
              </p>

              <h3>9.2 Data Protection Officer</h3>
              <p>
                We have appointed a Data Protection Officer to oversee our data protection practices. 
                You can contact them at privacy@ryfty.net.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Contact Information</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul>
                <li><strong>Email:</strong> privacy@ryfty.net</li>
                <li><strong>Support Email:</strong> support@ryfty.net</li>
                <li><strong>Address:</strong> Nairobi, Kenya</li>
                <li><strong>Phone:</strong> +254 795 739288</li>
              </ul>
              <p>
                For data protection inquiries specifically, please contact our Data Protection Officer at 
                dpo@ryfty.net.
              </p>
            </section>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </PageTransition>
  );
}
