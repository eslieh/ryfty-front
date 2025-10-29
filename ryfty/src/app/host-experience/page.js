"use client";

import Footer from "@/components/footer";
import PageTransition from "@/components/PageTransition";
import "@/styles/host-experience.css";
import "../globals.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function HostExperience() {
  const router = useRouter();
  const { isAuthenticated, user, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleGetStarted = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    if (isAuthenticated) {
      // User is authenticated, switch to provider role and redirect
      setIsLoading(true);
      try {
        const result = await switchRole('provider');
        if (result.success) {
          router.push('/provider');
        } else {
          console.error('Failed to switch to provider role:', result.error);
          // Still redirect to provider page even if role switch fails
          router.push('/provider');
        }
      } catch (error) {
        console.error('Error switching to provider role:', error);
        // Still redirect to provider page
        router.push('/provider');
      } finally {
        setIsLoading(false);
      }
    } else {
      // User is not authenticated, redirect to auth page
      router.push('/auth');
    }
  };

  const handlePricingClick = () => {
    router.push('/host-experience/pricing');
  };

  // Image object for easy management
  const images = {
    hero_section: {
      app_screenshot_1: "/phone-mock-mini.png",
      app_screenshot_2: "/phone-mock.png"
    },
    city_life_section: {
      experience_card_1: "https://i.pinimg.com/1200x/48/01/96/480196cc8ff08c6e3e48890f98eb330d.jpg",
      experience_card_2: "https://i.pinimg.com/736x/ae/36/83/ae36836c0d16b701e49815d3e9fe7ac7.jpg", 
      experience_card_3: "https://i.pinimg.com/736x/d1/c3/6d/d1c36d1720bdc44eab47d278d7d0ea24.jpg"
    },
    show_up_beautifully_section: {
      app_screenshot_3: "/provider-screenshot.png",
      app_screenshot_4: "https://i.pinimg.com/1200x/55/8d/80/558d805ca6259504b1d9d3d4b5a94ac4.jpg"
    },
    get_discovered_section: {
      discovery_image_1: "YOUR_DISCOVERY_IMAGE_1_URL",
      discovery_image_2: "YOUR_DISCOVERY_IMAGE_2_URL"
    },
    best_tools_section: {
      tools_image_1: "YOUR_TOOLS_IMAGE_1_URL",
      tools_image_2: "YOUR_TOOLS_IMAGE_2_URL"
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
          
          <div className="header-buttons">
            <button 
              className="btn btn-secondary" 
              onClick={handlePricingClick}
            >
              Pricing
            </button>
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
        </div>
      </motion.header>

      <div className="host-experience-page">
        {/* 🌄 Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-headline">Turn Your Passion Into an Experience</h1>
              <p className="hero-subtext">Create and share unforgettable moments — from cooking classes and hikes to art sessions and tours. Reach locals and travelers looking for something authentic, personal, and new.</p>
            </div>
            <div className="hero-image">
              <div className="phone-mockup-main">
                <img 
                  src={images.hero_section.app_screenshot_1} 
                  alt="Ryfty app showing diverse experiences"
                  className="app-screenshot"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 🏙️ City Life Section */}
        <section className="city-life-section">
          <div className="section-container">
            <h2 className="section-headline">Bring the best of your city to life on Ryfty</h2>
            <p className="section-subtext">Apply to join our marketplace of high-quality experiences led by locals like you.</p>
            <div className="experience-cards">
              <div className="experience-card">
                <img 
                  src={images.city_life_section.experience_card_1} 
                  alt="Outdoor adventure experience"
                  className="card-image"
                />
                <p className="card-description">Adventure & Outdoors</p>
              </div>
              <div className="experience-card">
                <img 
                  src={images.city_life_section.experience_card_2} 
                  alt="Hands-on craft experience"
                  className="card-image"
                />
                <p className="card-description">Road Escapes</p>
              </div>
              <div className="experience-card">
                <img 
                  src={images.city_life_section.experience_card_3} 
                  alt="Cultural urban experience"
                  className="card-image"
                />
                <p className="card-description">Social & Lifestyle Events</p>
              </div>
            </div>
          </div>
        </section>


        {/* ⚙️ How It Works */}
        <section className="how-it-works-section">
          <div className="section-container">
            <h2 className="section-headline">Host one-of-a-kind experiences of all kinds</h2>
            <div className="experience-categories">
              <div className="category-column">
                <p>Hands-on Creativity</p>
                <p>Nature & Exploration</p>
                <p>Culinary Journeys</p>
              </div>
              <div className="category-column">
                <p>Culture & Heritage</p>
                <p>Music & Entertainment</p>
                <p>Wellness & Mindfulness</p>
              </div>
            </div>
          </div>
        </section>

        {/* 📊 Statistics Section
        <section className="statistics-section">
          <div className="section-container">
            <h2 className="section-headline">Millions of guests. The most loved brand in travel.</h2>
            <p className="section-subtext">Ryfty is the best way to reach people looking to explore your city.</p>
            <div className="statistics-grid">
              <div className="stat-item">
                <div className="stat-number">50,000+</div>
                <div className="stat-label">guests</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">$2M+</div>
                <div className="stat-label">earned by hosts</div>
              </div>
            </div>
          </div>
        </section> */}

        {/* 💰 Pricing Section */}
        <section className="pricing-preview-section">
          <div className="section-container">
            <h2 className="section-headline">Simple, Transparent Pricing</h2>
            <p className="section-subtext">Keep more of what you earn with our straightforward 5% platform fee. No hidden costs, no surprises.</p>
            <div className="pricing-preview-cards">
              <div className="pricing-preview-card">
                <div className="card-icon">💰</div>
                <h3>5% Platform Fee</h3>
                <p>Only pay when you earn. No setup fees, no monthly charges.</p>
              </div>
              <div className="pricing-preview-card">
                <div className="card-icon">⚡</div>
                <h3>Instant Payouts</h3>
                <p>Get paid directly to your M-Pesa within 24 hours.</p>
              </div>
              <div className="pricing-preview-card">
                <div className="card-icon">🔒</div>
                <h3>No Hidden Fees</h3>
                <p>What you see is what you pay. Transparent pricing always.</p>
              </div>
            </div>
            <div className="pricing-cta">
              <button 
                className="btn btn-primary large" 
                onClick={handlePricingClick}
              >
                View Detailed Pricing
              </button>
            </div>
          </div>
        </section>

        {/* 📱 Show Up Beautifully Section */}
        <section className="show-up-section">
          <div className="section-container">
            <h2 className="section-headline">Show up beautifully. Get booked effortlessly.</h2>
            <p className="section-subtext">Craft your experience listing, set your availability, and start welcoming guests — all from one beautifully simple app.</p>
            <div className="phone-mockup-main-container">
            <div className="phone-mockup-mini">
              <img 
                src={images.show_up_beautifully_section.app_screenshot_3} 
                alt="Ryfty host profile and listing"
                className="app-screenshot"
              />
            </div>
            </div>
          </div>
        </section>

        {/* 🔍 Get Discovered Section */}
        <section className="discovered-section">
          <div className="section-container">
            <h2 className="section-headline">Be seen. Be chosen. Be remembered.</h2>
            <p className="section-subtext">
            Ryfty brings your experiences to life across search, travel recommendations, and curated collections for explorers near and far.
            </p>
            <div className="discovery-points">
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p>Featured in search results</p>
              </div>
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p>Matched to your ideal guests</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🛠️ Best Tools Section */}
        <section className="tools-section">
          <div className="section-container">
            <h2 className="section-headline">Powerful tools built for creators like you</h2>
            <p className="section-subtext">
            Manage your reservations, communicate with guests, and receive fast, secure payments — all from the Ryfty app.
            </p>
            <div className="tools-grid">
              <div className="tool-column">
              <p>Effortless reservations</p>
              <p>Smart scheduling</p>
              </div>
              <div className="tool-column">
              <p>{`Direct guest chat (coming soon)`}</p>
              <p>Instant payouts</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🔒 Trust & Safety */}
        <section className="trust-safety-section">
          <div className="section-container">
            <h2 className="section-headline">Your questions, answered</h2>
            <div className="faq-section">
              <div className="faq-item">
                <h3>Top questions</h3>
                <div className="faq-content">
                  <p><strong>How do I get started?</strong></p>
                  <p>Simply create your profile, add your experience details, set your pricing, and start accepting bookings.</p>
                  
                  <p><strong>What support do you provide?</strong></p>
                  <p>We offer 24/7 support, secure payments, and help with guest communication throughout the entire process.</p>
                  
                  <p><strong>How do I get paid?</strong></p>
                  <p>Get paid directly to your bank account or M-Pesa paybill within 24 hours after each experience.</p>
                </div>
              </div>
              <div className="faq-item">
                <h3>Hosting basics</h3>
              </div>
              <div className="faq-item">
                <h3>Application process</h3>
              </div>
              <div className="faq-item">
                <h3>Licensing & insurance</h3>
              </div>
            </div>
          </div>
        </section>

        </div>
      <Footer />
    </PageTransition>
  );
}