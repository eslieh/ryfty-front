"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerificationStep({ formData, email, onSuccess }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const { verifyAccount, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyAccount(email, verificationCode);
      
      if (result.success) {
        // Redirect based on user type or redirect parameter
        const redirect = searchParams.get('redirect') || 
                        (formData.userType === 'provider' ? '/provider/onboarding' : '/welcome');
        
        if (onSuccess) {
          onSuccess(result);
        } else {
          router.push(redirect);
        }
      } else {
        setError(result.error || 'Invalid or expired token');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError('');

    try {
      // Re-register to send a new verification code
      const result = await register(formData);
      
      if (result.success) {
        setCanResend(false);
        setResendTimer(60);
        // Show success message briefly
        setError('');
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (error) {
      setError('Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verification-step">
      {/* Header */}
      <div className="step-header">
        <h1 className="step-title">Verify your account</h1>
        <p className="step-subtitle">
          We've sent a 6-digit verification code to<br />
          <strong>{email}</strong>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="step-form">
        <div className="form-group">
          <label htmlFor="verificationCode" className="form-label">
            Verification Code
          </label>
          <input
            type="text"
            id="verificationCode"
            value={verificationCode}
            onChange={handleCodeChange}
            className="form-input large verification-input"
            placeholder="000000"
            required
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
          />
          <div className="phone-hint">
            Enter the 6-digit code sent to your email
          </div>
        </div>

        {/* Resend Section */}
        <div className="resend-section">
          {canResend ? (
            <span>
              Didn't receive the code?{' '}
              <button
                type="button"
                className="resend-button"
                onClick={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend code'}
              </button>
            </span>
          ) : (
            <span>
              Resend code in {resendTimer}s
            </span>
          )}
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
          className={`step-continue-button ${verificationCode.length === 6 && !isLoading ? 'active' : ''}`}
          disabled={verificationCode.length !== 6 || isLoading}
          whileHover={verificationCode.length === 6 && !isLoading ? { scale: 1.02 } : {}}
          whileTap={verificationCode.length === 6 && !isLoading ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <div className="button-loading">
              <div className="spinner"></div>
              Verifying...
            </div>
          ) : (
            'Verify Account'
          )}
        </motion.button>
      </form>
    </div>
  );
}
