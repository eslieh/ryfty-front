import React, { useState, useEffect, useRef } from "react";
import "../styles/landing.css"; // Ensure styles are imported
import { useNavigate } from "react-router-dom";
const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef(null);
  const navigate = useNavigate()
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, []);
  return (
    <div className="landing-page">
      <div className="top-actions">
        <div className="logo-container">
          <div className="dot">
            <div className="box"></div>
          </div>
          <div className="ryfty-name">ryfty</div>
        </div>
        <div className="login-c">
          <button className="courier-login" onClick={() => navigate('/auth/courier')}>Courier Login</button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Seamless Deliveries, Simplified.</h1>
          <p>
            Onboard your courier service with Ryfty and automate package
            tracking, notifications, and fulfillment.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.pexels.com/photos/1267325/pexels-photo-1267325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Delivery illustration"
          />
        </div>
      </section>

      <section className="main-body-sections">
        {/* How It Works */}
        <section className="how-it-works">
          <h2 className="howi">How it Works</h2>
          <div className="steps">
            <div className="step">
              <img
                src="https://images.pexels.com/photos/7648057/pexels-photo-7648057.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Step 1"
              />
              <div className="data-s">
                <h3>1. Onboard Your Courier</h3>
                <p>Sign up & set up fulfillment stations.</p>
              </div>
            </div>
            <div className="step">
              <img
                src="https://images.pexels.com/photos/6169051/pexels-photo-6169051.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Step 2"
              />
              <div className="data-s">
                <h3>2. Manage Parcels with Ease</h3>
                <p>Add packages, update status, and notify clients.</p>
              </div>
            </div>
            <div className="step">
              <img
                src="https://images.pexels.com/photos/6146929/pexels-photo-6146929.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Step 3"
              />
              <div className="data-s">
                <h3>3. Deliver & Notify Clients</h3>
                <p>Real-time tracking & SMS updates to recipients.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Ryfty */}
        <section className="why-choose" ref={targetRef}>
          <h2 className="whyry">Why Choose Ryfty?</h2>

          {/* Show only when in viewport */}
          <div className={`hidden-image ${isVisible ? "show" : ""}`}>
            <img src="/hands.png" alt="" className="image0c" />
          </div>

          <div className="features">
          <div className="feature">
              <img
                src="https://i.pinimg.com/736x/cd/01/d1/cd01d19b216c19b07ee0b8f83c74edac.jpg"
                alt="Instant SMS Notifications"
              />
              <div className="feat">
                <h3>Instant SMS Notifications</h3>
                <p>Keep senders & receivers updated.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feat">
                <h3>Effortless Parcel Management</h3>
                <p>Track, update & fulfill orders easily.</p>
              </div>
              <img
                src="https://i.pinimg.com/736x/b4/5d/c6/b45dc630b83212890576faa5b711cb0c.jpg"
                alt="Effortless Parcel Management"
              />
            </div>
            <div className="feature">
              <img
                src="https://i.pinimg.com/736x/a4/cd/fd/a4cdfd0e923e431c198e2cd03c313da8.jpg"
                alt="Multi-location Support"
              />
              <div className="feat">
                <h3>Multi-location Support</h3>
                <p>Connect fulfillment stations nationwide.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feat">
                <h3>Secure & Scalable</h3>
                <p>Built for growing courier services.</p>
              </div>
              <img
                src="https://i.pinimg.com/736x/66/bf/4e/66bf4e8349cf5963f15f92b40ca5d6fd.jpg"
                alt="Secure & Scalable"
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta">
          <h2>Join the Future of Parcel Delivery</h2>
          <button className="btn btn-primary">Get started today</button>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-links">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy Policy</a>
          </div>
          <div className="footer-contact">
            <p>Support: support@ryfty.net | +254 712 345 678</p>
          </div>
          <div className="footer-socials">
            <a href="#">LinkedIn</a>
            <a href="#">Twitter</a>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default Landing;
