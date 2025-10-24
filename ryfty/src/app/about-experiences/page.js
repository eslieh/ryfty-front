"use client";

import Footer from "@/components/footer";
import PageTransition from "@/components/PageTransition";
import "@/styles/host-experience.css";
import "../globals.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function AboutExperiences() {
  const router = useRouter();
  const { isAuthenticated, user, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleGetStarted = async () => {
    if (isLoading) return;
    
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        const result = await switchRole('user');
        if (result.success) {
          router.push('/');
        } else {
          console.error('Failed to switch to user role:', result.error);
          router.push('/');
        }
      } catch (error) {
        console.error('Error switching to user role:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push('/auth');
    }
  };

  const handleExploreClick = () => {
    router.push('/');
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
                "Start Exploring"
              )}
            </button>
          </div>
        </div>
      </motion.header>

      <div className="host-experience-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-headline">Break Free From Loneliness, Discover Your Community</h1>
              <p className="hero-subtext">Connect with locals who share your interests. Join authentic experiences that bring people together and help you explore Kenya's hidden gems while building meaningful friendships.</p>
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

        {/* City Life Section */}
        <section className="city-life-section">
          <div className="section-container">
            <h2 className="section-headline">Rediscover Kenya Through Local Eyes</h2>
            <p className="section-subtext">From Nairobi's vibrant streets to the serene landscapes of the countryside, connect with passionate locals who will show you the authentic side of Kenya.</p>
            <div className="experience-cards">
              <div className="experience-card">
                <img 
                  src={images.city_life_section.experience_card_1} 
                  alt="Outdoor adventure experience"
                  className="card-image"
                />
                <p className="card-description">Adventure & Nature</p>
              </div>
              <div className="experience-card">
                <img 
                  src={images.city_life_section.experience_card_2} 
                  alt="Cultural experience"
                  className="card-image"
                />
                <p className="card-description">Cultural Heritage</p>
              </div>
              <div className="experience-card">
                <img 
                  src={images.city_life_section.experience_card_3} 
                  alt="Social experience"
                  className="card-image"
                />
                <p className="card-description">Social Connections</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works-section">
          <div className="section-container">
            <h2 className="section-headline">Find Your Tribe Through Shared Experiences</h2>
            <div className="experience-categories">
              <div className="category-column">
                <p>Cooking Classes & Food Tours</p>
                <p>Hiking & Outdoor Adventures</p>
                <p>Art & Creative Workshops</p>
              </div>
              <div className="category-column">
                <p>Cultural Tours & Heritage</p>
                <p>Music & Entertainment Events</p>
                <p>Wellness & Mindfulness Sessions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="statistics-section">
          <div className="section-container">
            <h2 className="section-headline">Join Thousands Who Found Their Community</h2>
            <p className="section-subtext">Be part of a growing community of Kenyans who are breaking barriers and building connections through shared experiences.</p>
            <div className="statistics-grid">
              <div className="stat-item">
                <div className="stat-number">15,000+</div>
                <div className="stat-label">connections made</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">unique experiences</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing-preview-section">
          <div className="section-container">
            <h2 className="section-headline">Affordable Adventures, Priceless Memories</h2>
            <p className="section-subtext">Experience authentic Kenya without breaking the bank. Most experiences start from just KES 500.</p>
            <div className="pricing-preview-cards">
              <div className="pricing-preview-card">
                <div className="card-icon">💰</div>
                <h3>Budget-Friendly</h3>
                <p>Experiences starting from KES 500. No hidden fees, transparent pricing.</p>
              </div>
              <div className="pricing-preview-card">
                <div className="card-icon">⚡</div>
                <h3>Easy Booking</h3>
                <p>Book instantly with secure M-Pesa payments. Cancel anytime.</p>
              </div>
              <div className="pricing-preview-card">
                <div className="card-icon">🔒</div>
                <h3>Safe & Verified</h3>
                <p>All hosts are verified. Your safety and satisfaction guaranteed.</p>
              </div>
            </div>
            <div className="pricing-cta">
              <button 
                className="btn btn-primary large" 
                onClick={handleExploreClick}
              >
                Browse Experiences
              </button>
            </div>
          </div>
        </section>

        {/* Show Up Beautifully Section */}
        <section className="show-up-section">
          <div className="section-container">
            <h2 className="section-headline">Your Journey Starts Here</h2>
            <p className="section-subtext">Discover experiences, connect with hosts, and build lasting friendships through our simple and intuitive platform.</p>
            <div className="phone-mockup-main-container">
            <div className="phone-mockup-mini">
              <img 
                src={images.hero_section.app_screenshot_1} 
                alt="Ryfty user experience"
                className="app-screenshot"
              />
            </div>
            </div>
          </div>
        </section>

        {/* Get Discovered Section */}
        <section className="discovered-section">
          <div className="section-container">
            <h2 className="section-headline">Never Feel Alone Again</h2>
            <p className="section-subtext">
            Whether you're new to the city, looking to expand your social circle, or simply want to explore Kenya with like-minded people, Ryfty connects you with experiences and people that matter.
            </p>
            <div className="discovery-points">
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p>Meet locals who share your interests</p>
              </div>
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p>Discover hidden gems in your city</p>
              </div>
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p>Build meaningful friendships</p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Tools Section */}
        <section className="tools-section">
          <div className="section-container">
            <h2 className="section-headline">Everything You Need to Connect and Explore</h2>
            <p className="section-subtext">
            From browsing experiences to staying in touch with new friends, Ryfty makes it easy to step out of your comfort zone and into a world of possibilities.
            </p>
            <div className="tools-grid">
              <div className="tool-column">
              <p>Easy experience discovery</p>
              <p>Secure instant booking</p>
              </div>
              <div className="tool-column">
              <p>Direct host communication</p>
              <p>Community reviews & ratings</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Safety */}
        <section className="trust-safety-section">
          <div className="section-container">
            <h2 className="section-headline">Your Questions, Answered</h2>
            <div className="faq-section">
              <div className="faq-item">
                <h3>Getting Started</h3>
                <div className="faq-content">
                  <p><strong>How do I find experiences near me?</strong></p>
                  <p>Simply browse our curated list of experiences, filter by location, price, or interest, and book instantly.</p>
                  
                  <p><strong>What if I'm shy or nervous about meeting new people?</strong></p>
                  <p>Many of our experiences are designed for introverts and newcomers. Start with smaller groups or one-on-one experiences.</p>
                  
                  <p><strong>How do I know the experiences are safe?</strong></p>
                  <p>All hosts are verified, and we have a robust review system. You can also message hosts before booking to ask questions.</p>
                </div>
              </div>
              <div className="faq-item">
                <h3>Booking & Payment</h3>
                <div className="faq-content">
                  <p><strong>How do I pay for experiences?</strong></p>
                  <p>We accept M-Pesa payments for instant, secure transactions. You only pay when you book.</p>
                  
                  <p><strong>Can I cancel if something comes up?</strong></p>
                  <p>Yes, most experiences offer flexible cancellation policies. Check the specific experience details before booking.</p>
                </div>
              </div>
              <div className="faq-item">
                <h3>Community & Safety</h3>
                <div className="faq-content">
                  <p><strong>What if I don't enjoy the experience?</strong></p>
                  <p>We have a satisfaction guarantee. If you're not happy, contact our support team for a full refund.</p>
                  
                  <p><strong>How do I connect with other participants?</strong></p>
                  <p>Many experiences include group activities and social time. You can also connect with other participants through our community features.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        </div>
      <Footer />
    </PageTransition>
  );
}
