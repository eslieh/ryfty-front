"use client";

import Footer from "@/components/footer";
import PageTransition from "@/components/PageTransition";
import "@/styles/host-experience.css";
import "@/app/globals.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, user, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reservationAmount, setReservationAmount] = useState(1000);
  const [calculatedFees, setCalculatedFees] = useState({});

  // M-Pesa B2C charges (for individual providers)
  const getB2CBusinessCharge = (amount) => {
    const tariffTable = [
      { min: 1, max: 49, charge: 0 },
      { min: 50, max: 100, charge: 0 },
      { min: 101, max: 500, charge: 5 },
      { min: 501, max: 1000, charge: 5 },
      { min: 1001, max: 1500, charge: 5 },
      { min: 1501, max: 2500, charge: 9 },
      { min: 2501, max: 3500, charge: 9 },
      { min: 3501, max: 5000, charge: 9 },
      { min: 5001, max: 7500, charge: 11 },
      { min: 7501, max: 10000, charge: 11 },
      { min: 10001, max: 15000, charge: 11 },
      { min: 15001, max: 20000, charge: 11 },
      { min: 20001, max: 25000, charge: 13 },
      { min: 25001, max: 30000, charge: 13 },
      { min: 30001, max: 35000, charge: 13 },
      { min: 35001, max: 40000, charge: 13 },
      { min: 40001, max: 45000, charge: 13 },
      { min: 45001, max: 50000, charge: 13 },
      { min: 50001, max: 70000, charge: 13 },
      { min: 70001, max: 250000, charge: 13 },
    ];

    for (const tariff of tariffTable) {
      if (amount >= tariff.min && amount <= tariff.max) {
        return tariff.charge;
      }
    }
    return 0;
  };

  // M-Pesa B2B charges (for business providers)
  const getB2BBusinessCharge = (amount) => {
    const tariffTable = [
      { min: 1, max: 49, charge: 2 },
      { min: 50, max: 100, charge: 3 },
      { min: 101, max: 500, charge: 8 },
      { min: 501, max: 1000, charge: 13 },
      { min: 1001, max: 1500, charge: 18 },
      { min: 1501, max: 2500, charge: 25 },
      { min: 2501, max: 3500, charge: 30 },
      { min: 3501, max: 5000, charge: 39 },
      { min: 5001, max: 7500, charge: 48 },
      { min: 7501, max: 10000, charge: 54 },
      { min: 10001, max: 15000, charge: 63 },
      { min: 15001, max: 20000, charge: 68 },
      { min: 20001, max: 25000, charge: 74 },
      { min: 25001, max: 30000, charge: 79 },
      { min: 30001, max: 35000, charge: 90 },
      { min: 35001, max: 40000, charge: 106 },
      { min: 40001, max: 45000, charge: 110 },
      { min: 45001, max: 50000, charge: 115 },
      { min: 50001, max: 70000, charge: 115 },
      { min: 70001, max: 150000, charge: 115 },
      { min: 150001, max: 250000, charge: 115 },
      { min: 250001, max: 500000, charge: 115 },
      { min: 500001, max: 1000000, charge: 115 },
      { min: 1000001, max: 3000000, charge: 115 },
      { min: 3000001, max: 5000000, charge: 115 },
      { min: 5000001, max: 20000000, charge: 115 },
      { min: 20000001, max: 50000000, charge: 115 },
    ];

    for (const tariff of tariffTable) {
      if (amount >= tariff.min && amount <= tariff.max) {
        return tariff.charge;
      }
    }
    return 0;
  };

  // Calculate all fees
  const calculateFees = (amount) => {
    const ryftyFee = amount * 0.05; // 5% Ryfty fee
    const mpesaB2C = getB2CBusinessCharge(amount);
    const mpesaB2B = getB2BBusinessCharge(amount);
    const totalFeesB2C = ryftyFee + mpesaB2C;
    const totalFeesB2B = ryftyFee + mpesaB2B;
    const netEarningsB2C = amount - totalFeesB2C;
    const netEarningsB2B = amount - totalFeesB2B;

    return {
      reservationAmount: amount,
      ryftyFee: Math.round(ryftyFee),
      mpesaB2C,
      mpesaB2B,
      totalFeesB2C: Math.round(totalFeesB2C),
      totalFeesB2B: Math.round(totalFeesB2B),
      netEarningsB2C: Math.round(netEarningsB2C),
      netEarningsB2B: Math.round(netEarningsB2B),
      feePercentageB2C: Math.round((totalFeesB2C / amount) * 100 * 100) / 100,
      feePercentageB2B: Math.round((totalFeesB2B / amount) * 100 * 100) / 100,
    };
  };

  useEffect(() => {
    setCalculatedFees(calculateFees(reservationAmount));
  }, [reservationAmount]);

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleGetStarted = async () => {
    if (isLoading) return;
    
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        const result = await switchRole('provider');
        if (result.success) {
          router.push('/provider');
        } else {
          console.error('Failed to switch to provider role:', result.error);
          router.push('/provider');
        }
      } catch (error) {
        console.error('Error switching to provider role:', error);
        router.push('/provider');
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push('/auth');
    }
  };

  return (
    <PageTransition>
      {/* Fixed Floating Header */}
      <motion.header 
        className="floating-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="header-contents">
          <motion.div 
            className="header-logo"
            onClick={handleLogoClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/dot.png" alt="Ryfty Logo" className="logo" />
          </motion.div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleGetStarted}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Loading...</span>
              </div>
            ) : (
              "Get Started"
            )}
          </button>
        </div>
      </motion.header>

      <div className="host-experience-page">
        {/* 🌄 Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-headline">Simple, Transparent Pricing</h1>
              <p className="hero-subtext">Keep more of what you earn with our straightforward 5% platform fee. No hidden costs, no surprises—just clear, honest pricing that works for you.</p>
            </div>
            <div className="hero-image">
              <div className="pricing-calculator">
                <div className="calculator-header">
                  <h3>Earnings Calculator</h3>
                  <p>See how much you'll earn from each reservation</p>
                </div>
                <div className="calculator-input">
                  <label>Reservation Amount (KES)</label>
                  <input
                    type="number"
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(Number(e.target.value))}
                    min="1"
                    max="50000000"
                  />
                </div>
                <div className="calculator-results">
                  <div className="result-row">
                    <span>Reservation Amount:</span>
                    <span>KES {calculatedFees.reservationAmount?.toLocaleString()}</span>
                  </div>
                  <div className="result-row">
                    <span>Ryfty Fee (5%):</span>
                    <span>-KES {calculatedFees.ryftyFee?.toLocaleString()}</span>
                  </div>
                  <div className="result-row">
                    <span>M-Pesa Fee (B2C):</span>
                    <span>-KES {calculatedFees.mpesaB2C?.toLocaleString()}</span>
                  </div>
                  <div className="result-row total">
                    <span>Your Earnings (B2C):</span>
                    <span>KES {calculatedFees.netEarningsB2C?.toLocaleString()}</span>
                  </div>
                  <div className="result-row">
                    <span>M-Pesa Fee (B2B):</span>
                    <span>-KES {calculatedFees.mpesaB2B?.toLocaleString()}</span>
                  </div>
                  <div className="result-row total">
                    <span>Your Earnings (B2B):</span>
                    <span>KES {calculatedFees.netEarningsB2B?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 💰 Pricing Breakdown Section */}
        <section className="pricing-breakdown-section">
          <div className="section-container">
            <h2 className="section-headline">How Our Pricing Works</h2>
            <p className="section-subtext">We believe in keeping things simple and transparent. Here's exactly what you pay and when.</p>
            
            <div className="pricing-cards">
              <div className="pricing-card">
                <div className="card-header">
                  <h3>Platform Fee</h3>
                  <div className="fee-amount">5%</div>
                </div>
                <div className="card-content">
                  <p>We charge a simple 5% fee on each completed reservation. This covers:</p>
                  <ul>
                    <li>Platform maintenance and updates</li>
                    <li>Customer support</li>
                    <li>Payment processing</li>
                    <li>Marketing and discovery tools</li>
                    <li>Host protection and insurance</li>
                  </ul>
                </div>
              </div>

              <div className="pricing-card">
                <div className="card-header">
                  <h3>Payment Processing</h3>
                  <div className="fee-amount">M-Pesa</div>
                </div>
                <div className="card-content">
                  <p>M-Pesa charges apply based on transaction amount:</p>
                  <div className="mpesa-rates">
                    <div className="rate-type">
                      <h4>Individual (B2C)</h4>
                      <p>KES 0-5 for most transactions</p>
                    </div>
                    <div className="rate-type">
                      <h4>Business (B2B)</h4>
                      <p>KES 2-115 based on amount</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pricing-card">
                <div className="card-header">
                  <h3>No Hidden Fees</h3>
                  <div className="fee-amount">0%</div>
                </div>
                <div className="card-content">
                  <p>What you see is what you pay. No additional charges for:</p>
                  <ul>
                    <li>Listing your experiences</li>
                    <li>Managing bookings</li>
                    <li>Customer communication</li>
                    <li>Basic analytics and insights</li>
                    <li>Standard support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 📊 Comparison Section */}
        <section className="comparison-section">
          <div className="section-container">
            <h2 className="section-headline">Ryfty vs. Other Platforms</h2>
            <p className="section-subtext">See how our pricing compares to other experience platforms</p>
            
            <div className="comparison-table">
              <div className="table-header">
                <div className="feature-column">Feature</div>
                <div className="ryfty-column">Ryfty</div>
                <div className="competitor-column">Other Platforms</div>
              </div>
              
              <div className="table-row">
                <div className="feature-column">Platform Fee</div>
                <div className="ryfty-column">5%</div>
                <div className="competitor-column">8-15%</div>
              </div>
              
              <div className="table-row">
                <div className="feature-column">Payment Processing</div>
                <div className="ryfty-column">M-Pesa rates only</div>
                <div className="competitor-column">Additional 2-3%</div>
              </div>
              
              <div className="table-row">
                <div className="feature-column">Listing Fee</div>
                <div className="ryfty-column">Free</div>
                <div className="competitor-column">Monthly fees</div>
              </div>
              
              <div className="table-row">
                <div className="feature-column">Cancellation Protection</div>
                <div className="ryfty-column">Included</div>
                <div className="competitor-column">Extra cost</div>
              </div>
              
              <div className="table-row">
                <div className="feature-column">Customer Support</div>
                <div className="ryfty-column">24/7 included</div>
                <div className="competitor-column">Limited or paid</div>
              </div>
            </div>
          </div>
        </section>

        {/* 💡 Tips Section */}
        <section className="tips-section">
          <div className="section-container">
            <h2 className="section-headline">Maximize Your Earnings</h2>
            <p className="section-subtext">Simple strategies to increase your revenue and reduce costs</p>
            
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon">💰</div>
                <h3>Set Competitive Prices</h3>
                <p>Research similar experiences in your area and price competitively. Higher prices can mean higher earnings even with fees.</p>
              </div>
              
              <div className="tip-card">
                <div className="tip-icon">📅</div>
                <h3>Optimize Your Schedule</h3>
                <p>Fill your calendar with more bookings. More reservations mean more total earnings, even with our 5% fee.</p>
              </div>
              
              <div className="tip-card">
                <div className="tip-icon">⭐</div>
                <h3>Maintain High Ratings</h3>
                <p>Great reviews lead to more bookings and higher prices. Focus on delivering exceptional experiences.</p>
              </div>
              
              <div className="tip-card">
                <div className="tip-icon">🎯</div>
                <h3>Choose B2B When Possible</h3>
                <p>For larger transactions, B2B M-Pesa rates can be more cost-effective than B2C rates.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ❓ FAQ Section */}
        <section className="faq-section">
          <div className="section-container">
            <h2 className="section-headline">Pricing Questions</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h3>When do I pay the 5% platform fee?</h3>
                <p>The platform fee is automatically deducted from each completed reservation before the money is sent to you. You only pay when you earn.</p>
              </div>
              
              <div className="faq-item">
                <h3>Are there any setup or monthly fees?</h3>
                <p>No. There are no setup fees, monthly fees, or hidden costs. You only pay the 5% platform fee on completed reservations.</p>
              </div>
              
              <div className="faq-item">
                <h3>What if a guest cancels?</h3>
                <p>If a guest cancels within our cancellation policy, you keep the full amount and no platform fee is charged. We handle the refund process.</p>
              </div>
              
              <div className="faq-item">
                <h3>How do M-Pesa charges work?</h3>
                <p>M-Pesa charges are based on the transaction amount and whether you're registered as B2C (individual) or B2B (business). These charges are separate from our platform fee.</p>
              </div>
              
              <div className="faq-item">
                <h3>Can I see a breakdown of all fees?</h3>
                <p>Yes. In your host dashboard, you can see a detailed breakdown of every transaction, including our platform fee and M-Pesa charges.</p>
              </div>
              
              <div className="faq-item">
                <h3>Do you offer volume discounts?</h3>
                <p>Currently, we maintain a flat 5% rate for all hosts to keep pricing simple and fair. We're exploring volume incentives for the future.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🚀 CTA Section */}
        <section className="cta-section">
          <div className="section-container">
            <h2 className="section-headline">Ready to Start Earning?</h2>
            <p className="section-subtext">Join thousands of hosts who are already earning with Ryfty's simple, transparent pricing.</p>
            <button 
              className="btn btn-primary large" 
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                "Start Hosting Today"
              )}
            </button>
            <p className="cta-subtext">No setup fees • Start earning immediately • Cancel anytime</p>
          </div>
        </section>
      </div>
      
      <Footer />
    </PageTransition>
  );
}
