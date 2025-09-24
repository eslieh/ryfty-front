"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import config from '@/config';

export default function PhoneAuth({ userType }) {
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { sendPhoneVerification, verifyPhoneCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add Kenya country code if not present
    if (digits.length > 0 && !digits.startsWith('254')) {
      if (digits.startsWith('0')) {
        return '+254' + digits.substring(1);
      } else if (digits.startsWith('7') || digits.startsWith('1')) {
        return '+254' + digits;
      }
    }
    
    // Format with + prefix
    if (digits.startsWith('254')) {
      return '+' + digits;
    }
    
    return value;
  };

  const validatePhoneNumber = (phone) => {
    // Basic Kenyan phone number validation
    const kenyanPhoneRegex = /^\+254[17]\d{8}$/;
    return kenyanPhoneRegex.test(phone);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendPhoneVerification(phoneNumber);
      
      if (result.success) {
        setStep('verify');
        startResendCooldown();
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyPhoneCode(phoneNumber, verificationCode);
      
      if (result.success) {
        // Redirect based on user type or redirect parameter
        const redirect = searchParams.get('redirect') || 
                        (userType === 'provider' ? '/provider/dashboard' : '/');
        router.push(redirect);
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await sendPhoneVerification(phoneNumber);
      
      if (result.success) {
        startResendCooldown();
        // You could show a success message here
      } else {
        setError(result.error || 'Failed to resend verification code');
      }
    } catch (error) {
      setError('Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) setError('');
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    if (error) setError('');
  };

  if (!config.features.phoneAuth) {
    return (
      <div className="phone-auth-disabled">
        <p>Phone authentication is not available at this time.</p>
      </div>
    );
  }

  return (
    <div className="phone-auth">
      {step === 'phone' ? (
        <motion.form 
          onSubmit={handlePhoneSubmit}
          className="phone-form"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number
            </label>
            <div className="input-wrapper">
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="form-input phone-input"
                placeholder="+254 712 345 678"
                required
                autoComplete="tel"
              />
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.2165 3.36162C2.30513 3.09849 2.44756 2.85669 2.63477 2.65162C2.82199 2.44655 3.04974 2.28271 3.30372 2.17052C3.55771 2.05833 3.83227 2.00026 4.10999 2H7.10999C7.59344 1.99522 8.06309 2.16708 8.43204 2.48353C8.801 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 21.999 16.92H22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="phone-hint">
              We&apos;ll send you a verification code via SMS
            </p>
          </div>

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
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={!validatePhoneNumber(phoneNumber) || isLoading}
            whileHover={validatePhoneNumber(phoneNumber) && !isLoading ? { scale: 1.02 } : {}}
            whileTap={validatePhoneNumber(phoneNumber) && !isLoading ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Sending code...
              </div>
            ) : (
              'Send verification code'
            )}
          </motion.button>
        </motion.form>
      ) : (
        <motion.form 
          onSubmit={handleVerificationSubmit}
          className="verification-form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="verification-header">
            <h3>Enter verification code</h3>
            <p>We sent a 6-digit code to {phoneNumber}</p>
            <button 
              type="button" 
              className="change-number-button"
              onClick={() => setStep('phone')}
            >
              Change number
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="verificationCode" className="form-label">
              Verification Code
            </label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={handleCodeChange}
              className="form-input verification-input"
              placeholder="000000"
              maxLength="6"
              required
              autoComplete="one-time-code"
            />
          </div>

          <div className="resend-section">
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              className={`resend-button ${resendCooldown > 0 ? 'disabled' : ''}`}
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isLoading}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>

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
            className={`submit-button ${isLoading ? 'loading' : ''}`}
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
              'Verify and continue'
            )}
          </motion.button>
        </motion.form>
      )}
    </div>
  );
}
