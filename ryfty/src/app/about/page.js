"use client";

import Footer from "@/components/footer";
import PageTransition from "@/components/PageTransition";
import "@/styles/host-experience.css";
import "../globals.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function About() {
  const router = useRouter();
  const { isAuthenticated, user, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleExploreExperiences = () => {
    router.push('/about-experiences');
  };

  const handleHostExperience = () => {
    router.push('/host-experience');
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

  // Image object for easy management
  const images = {
    hero_section: {
      community_image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
      app_screenshot: "https://i.pinimg.com/1200x/dd/55/91/dd5591ebed2005210844a84e8eb8bd0f.jpg"
    },
    mission_section: {
      mission_image: "https://i.pinimg.com/1200x/d1/1d/ab/d11dab55147f8a2a69aa58d251c2de5e.jpg"
    },
    values_section: {
      values_image: "https://i.pinimg.com/736x/3d/74/5a/3d745a4a2f428acbcc50a4d638485459.jpg"
    },
    safety_section: {
      safety_image: "https://i.pinimg.com/736x/0c/ee/65/0cee65871ca0195397d91131ad9c3e7e.jpg"
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
            {/* <button 
              className="btn btn-secondary" 
              onClick={handleExploreExperiences}
            >
              Explore Experiences
            </button> */}
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
                "Join Our Community"
              )}
            </button>
          </div>
        </div>
      </motion.header>

      <div className="host-experience-page">
        {/* 🌟 Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-headline">We Believe in the Power of Human Connection</h1>
              <p className="hero-subtext">Ryfty was born from a simple truth: the best experiences happen when people come together. We're not just a platform—we're a movement to combat loneliness, celebrate local culture, and create meaningful connections that last a lifetime.</p>
              <div className="hero-buttons">
                <button 
                  className="btn btn-primary large" 
                  onClick={handleExploreExperiences}
                >
                  Discover Experiences
                </button>
                {/* <button 
                  className="btn btn-secondary large" 
                  onClick={handleHostExperience}
                >
                  Share Your Passion
                </button> */}
              </div>
            </div>
            <div className="hero-image-io">
                <img 
                  src={images.hero_section.app_screenshot} 
                  alt="Ryfty community connecting people"
                  className="app-screenshot"
                />
            </div>
          </div>
        </section>

        {/* 💝 Our Story Section */}
        <section className="city-life-section">
          <div className="section-container">
            <h2 className="section-headline">Born from a Dream to Connect Kenya</h2>
            <p className="section-subtext">We started Ryfty because we saw too many people feeling isolated in their own cities. Too many incredible experiences going unnoticed. Too many talented locals with stories to share, but no platform to share them.</p>
            
            <div className="experience-cards">
              <div className="experience-card">
                <img 
                  src={images.mission_section.mission_image} 
                  alt="Local community gathering"
                  className="card-image"
                />
                <p className="card-description">Building Bridges Between People</p>
              </div>
              <div className="experience-card">
                <img 
                  src={images.values_section.values_image} 
                  alt="Diverse group of friends"
                  className="card-image"
                />
                <p className="card-description">Celebrating Our Differences</p>
              </div>
              <div className="experience-card">
                <img 
                  src={images.safety_section.safety_image} 
                  alt="Safe and secure community"
                  className="card-image"
                />
                <p className="card-description">Creating Safe Spaces</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🎯 Our Mission Section */}
        <section className="how-it-works-section">
          <div className="section-container">
            <h2 className="section-headline">Our Mission: Making Kenya More Connected</h2>
            <div className="experience-categories">
              <div className="category-column">
                <p><strong>Combat Loneliness:</strong> We believe no one should feel alone in their own city</p>
                <p><strong>Celebrate Local Culture:</strong> Every neighborhood has stories worth sharing</p>
                <p><strong>Empower Creators:</strong> Turn your passion into purpose and income</p>
              </div>
              <div className="category-column">
                <p><strong>Build Community:</strong> Create lasting friendships through shared experiences</p>
                <p><strong>Support Local Economy:</strong> Keep money circulating within our communities</p>
                <p><strong>Promote Safety:</strong> Every interaction is verified, secure, and meaningful</p>
              </div>
            </div>
          </div>
        </section>

        {/* 📊 Impact Section */}
        <section className="statistics-section">
          <div className="section-container">
            <h2 className="section-headline">The Impact We're Making Together</h2>
            <p className="section-subtext">Every booking, every experience, every connection makes Kenya a little more connected.</p>
            <div className="statistics-grid">
              <div className="stat-item">
                <div className="stat-number">15,000+</div>
                <div className="stat-label">meaningful connections made</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">local experiences created</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">KES 2M+</div>
                <div className="stat-label">earned by local creators</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">satisfaction rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* 🛡️ Safety & Trust Section */}
        <section className="pricing-preview-section">
          <div className="section-container">
            <h2 className="section-headline">Your Safety is Our Priority</h2>
            <p className="section-subtext">We've built Ryfty with safety at its core. Every host is verified, every experience is reviewed, and every interaction is protected.</p>
            <div className="pricing-preview-cards">
              <div className="pricing-preview-card">
                <div className="card-icon">🔍</div>
                <h3>Verified Hosts</h3>
                <p>Every host undergoes a thorough verification process including background checks and identity verification.</p>
              </div>
              <div className="pricing-preview-card">
                <div className="card-icon">💬</div>
                <h3>Real Reviews</h3>
                <p>Read authentic reviews from real participants. We never fake reviews or hide negative feedback.</p>
              </div>
              <div className="pricing-preview-card">
                <div className="card-icon">🛡️</div>
                <h3>24/7 Support</h3>
                <p>Our support team is always available to help with any concerns or issues that may arise.</p>
              </div>
              <div className="pricing-preview-card">
                <div className="card-icon">💰</div>
                <h3>Secure Payments</h3>
                <p>All payments are processed securely through M-Pesa with full transaction protection.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🌍 Community Values Section */}
        <section className="show-up-section">
          <div className="section-container">
            <h2 className="section-headline">Our Values: What Drives Us Every Day</h2>
            <p className="section-subtext">These aren't just words on a wall—they're the principles that guide every decision we make and every feature we build.</p>
            <div className="discovery-points">
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p><strong>Authenticity:</strong> Real experiences, real people, real connections</p>
              </div>
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p><strong>Inclusivity:</strong> Everyone belongs, everyone has something to share</p>
              </div>
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p><strong>Transparency:</strong> Clear pricing, honest reviews, open communication</p>
              </div>
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p><strong>Community First:</strong> We succeed when our community succeeds</p>
              </div>
              <div className="discovery-point">
                <div className="point-icon"></div>
                <p><strong>Local Impact:</strong> Supporting local creators and local economies</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🚀 Why Choose Ryfty Section */}
        <section className="discovered-section">
          <div className="section-container">
            <h2 className="section-headline">Why Ryfty is Different</h2>
            <p className="section-subtext">
            We're not just another booking platform. We're a community-first experience marketplace built specifically for Kenya, by Kenyans, for Kenyans.
            </p>
            <div className="tools-grid">
              <div className="tool-column">
                <p><strong>Local Focus:</strong> Built for Kenyan culture, Kenyan needs, Kenyan dreams</p>
                <p><strong>M-Pesa Integration:</strong> Seamless payments in the way Kenyans prefer</p>
                <p><strong>Community Support:</strong> We're here to help you succeed, not just take a cut</p>
              </div>
              <div className="tool-column">
                <p><strong>Quality Over Quantity:</strong> Every experience is curated for authenticity</p>
                <p><strong>Safety First:</strong> Comprehensive verification and support systems</p>
                <p><strong>Fair Pricing:</strong> Transparent fees that support both hosts and guests</p>
              </div>
            </div>
          </div>
        </section>

        {/* 💝 Join Our Mission Section */}
        <section className="tools-section">
          <div className="section-container">
            <h2 className="section-headline">Ready to Be Part of Something Bigger?</h2>
            <p className="section-subtext">
            Whether you're looking to discover new experiences or share your passion with others, you're not just joining a platform—you're joining a movement to make Kenya more connected.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn btn-primary large" 
                onClick={handleExploreExperiences}
              >
                Start Exploring
              </button>
              <button 
                className="btn btn-secondary large" 
                onClick={handleHostExperience}
              >
                Become a Host
              </button>
            </div>
            <p className="cta-subtext">
              Join thousands of Kenyans who are already building connections and creating memories through Ryfty.
            </p>
          </div>
        </section>

        {/* ❓ FAQ Section */}
        <section className="trust-safety-section">
          <div className="section-container">
            <h2 className="section-headline">Questions About Ryfty?</h2>
            <div className="faq-section">
              <div className="faq-item">
                <h3>About Our Platform</h3>
                <div className="faq-content">
                  <p><strong>What makes Ryfty different from other platforms?</strong></p>
                  <p>We're built specifically for Kenya, with M-Pesa integration, local cultural understanding, and a focus on authentic community connections rather than just transactions.</p>
                  
                  <p><strong>How do you ensure the quality of experiences?</strong></p>
                  <p>Every host is verified, every experience is reviewed by our team, and we maintain high standards through community feedback and continuous monitoring.</p>
                  
                  <p><strong>Is Ryfty safe to use?</strong></p>
                  <p>Absolutely. We have comprehensive safety measures including host verification, secure payments, 24/7 support, and a robust review system.</p>
                </div>
              </div>
              <div className="faq-item">
                <h3>For Experience Seekers</h3>
                <div className="faq-content">
                  <p><strong>How do I find experiences that match my interests?</strong></p>
                  <p>Browse by category, location, price, or use our smart recommendations based on your preferences and past bookings.</p>
                  
                  <p><strong>What if I'm nervous about meeting new people?</strong></p>
                  <p>Many of our experiences are designed for people who want to step out of their comfort zone gradually. Start with smaller groups or one-on-one experiences.</p>
                </div>
              </div>
              <div className="faq-item">
                <h3>For Hosts</h3>
                <div className="faq-content">
                  <p><strong>How do I become a host on Ryfty?</strong></p>
                  <p>Simply create your profile, describe your experience, set your pricing, and go through our verification process. We'll help you every step of the way.</p>
                  
                  <p><strong>What support do you provide to hosts?</strong></p>
                  <p>We offer marketing support, guest communication tools, payment processing, and 24/7 support to help you succeed.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🌟 Final CTA Section */}
        <section className="final-cta-section">
          <div className="section-container">
            <h2 className="section-headline">Together, We're Building a More Connected Kenya</h2>
            <p className="section-subtext">
            Every experience shared, every connection made, every story told brings us closer to our vision: a Kenya where no one feels alone, where every neighborhood's stories are celebrated, and where passion becomes purpose.
            </p>
            <div className="hero-buttons">
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
                  "Join Our Community Today"
                )}
              </button>
            </div>
            <p className="cta-subtext">
              Ready to discover what makes Kenya truly special? Ready to share your story? Ready to connect?
            </p>
          </div>
        </section>

      </div>
      <Footer />
    </PageTransition>
  );
}
