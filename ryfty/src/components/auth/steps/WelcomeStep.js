"use client";

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleAuth from '../GoogleAuth';
import config from '@/config';

export default function WelcomeStep({ nextStep, setMode, onGoogleSuccess, formData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleEmailContinue = () => {
    setMode('login');
    nextStep('email');
  };

  const handleSignupContinue = () => {
    setMode('signup');
    nextStep('email');
  };

  const handlePhoneContinue = () => {
    nextStep('phone');
  };

  const handleGoogleSuccess = (result) => {
    // Handle successful Google authentication
    if (result.success) {
      // Redirect based on user type or redirect parameter
      const redirect = searchParams.get('redirect') || 
                      (result.user?.role === 'provider' ? '/provider/dashboard' : '/');
      router.push(redirect);
    }
  };

  return (
    <div className="welcome-step">
      {/* Header */}
      <div className="step-header">
        <motion.img 
          src="/main.png" 
          alt="Ryfty" 
          className="auth-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        />
        <h1 className="step-title">Welcome to Ryfty</h1>
        <p className="step-subtitle">
          Discover amazing experiences or share your expertise with others
        </p>
      </div>

      {/* Authentication Options */}
      <div className="auth-options">
        {/* Google Authentication */}
        {config.features.googleAuth && (
          <div className="auth-option">
            <GoogleAuth 
              userType={formData.userType} 
              mode="login"
              onSuccess={handleGoogleSuccess}
            />
          </div>
        )}

        {/* Divider */}
        {config.features.googleAuth && (
          <div className="auth-divider">
            <span>or</span>
          </div>
        )}

        {/* Email Options */}
        <div className="auth-option">
          <button 
            className="auth-method-button primary"
            onClick={handleEmailContinue}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Continue with email
          </button>
        </div>

        {/* Phone Option */}
        {config.features.phoneAuth && (
          <div className="auth-option">
            <button 
              className="auth-method-button secondary"
              onClick={handlePhoneContinue}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.2165 3.36162C2.30513 3.09849 2.44756 2.85669 2.63477 2.65162C2.82199 2.44655 3.04974 2.28271 3.30372 2.17052C3.55771 2.05833 3.83227 2.00026 4.10999 2H7.10999C7.59344 1.99522 8.06309 2.16708 8.43204 2.48353C8.801 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 21.999 16.92H22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Continue with phone
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="welcome-footer">
        <p className="footer-text">
          Don&apos;t have an account?{' '}
          <button 
            className="footer-link"
            onClick={handleSignupContinue}
            type="button"
          >
            Create one
          </button>
        </p>
        
        <p className="terms-text">
          By continuing, you agree to our{' '}
          <a href="/terms" target="_blank" className="terms-link">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" className="terms-link">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
