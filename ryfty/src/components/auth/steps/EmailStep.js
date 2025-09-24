"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function EmailStep({ formData, updateFormData, nextStep, authMode, setMode }) {
  const [email, setEmail] = useState(formData.email || '');
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValid(validateEmail(value));
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (isValid) {
      updateFormData('email', email);
      
      if (authMode === 'login') {
        nextStep('password');
      } else {
        nextStep('signup-details');
      }
    }
  };

  const switchMode = () => {
    const newMode = authMode === 'login' ? 'signup' : 'login';
    setMode(newMode);
  };

  return (
    <div className="email-step">
      {/* Header */}
      <div className="step-header">
        <h1 className="step-title">
          {authMode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="step-subtitle">
          {authMode === 'login' 
            ? 'Enter your email to sign in' 
            : 'Enter your email to get started'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleContinue} className="step-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="form-input large"
              placeholder="Enter your email"
              required
              autoComplete="email"
              autoFocus
            />
            <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <motion.button
          type="submit"
          className={`step-continue-button ${isValid ? 'active' : ''}`}
          disabled={!isValid}
          whileHover={isValid ? { scale: 1.02 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
        >
          Continue
        </motion.button>
      </form>

      {/* Footer */}
      <div className="step-footer">
        <p className="footer-text">
          {authMode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button 
                className="footer-link"
                onClick={switchMode}
                type="button"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button 
                className="footer-link"
                onClick={switchMode}
                type="button"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
