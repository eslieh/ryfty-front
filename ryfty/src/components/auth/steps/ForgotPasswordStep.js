"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordStep({ onNext, onBack }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { requestPasswordReset } = useAuth();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        onNext(email);
      } else {
        setError(result.error || 'Failed to send reset code');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="forgot-password-step">
      {/* Header */}
      <div className="step-header">
        <h1 className="step-title">Reset your password</h1>
        <p className="step-subtitle">
          Enter your email address and we&apos;ll send you a reset code
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="step-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
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
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          className={`step-continue-button ${isValidEmail && !isLoading ? 'active' : ''}`}
          disabled={!isValidEmail || isLoading}
          whileHover={isValidEmail && !isLoading ? { scale: 1.02 } : {}}
          whileTap={isValidEmail && !isLoading ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <div className="button-loading">
              <div className="spinner"></div>
              Sending code...
            </div>
          ) : (
            'Send Reset Code'
          )}
        </motion.button>
      </form>

      {/* Back to Login */}
      <div className="step-footer">
        <button 
          type="button"
          className="footer-link"
          onClick={onBack}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}
