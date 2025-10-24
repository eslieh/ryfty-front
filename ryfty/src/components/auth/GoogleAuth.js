"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import config from '@/config';

// Helper function to get the correct API base URL
const getApiBaseUrl = () => {
  return config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
};

export default function GoogleAuth({ userType, mode = 'login', onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  const handleGoogleAuth = () => {
    if (!config.features.googleAuth) {
      setError('Google authentication is not configured');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Build the backend Google auth URL
      const params = new URLSearchParams({
        userType: userType || 'user',
        mode: mode,
        // Pass current URL parameters to maintain state
        ...(searchParams.get('redirect') && { redirect: searchParams.get('redirect') })
      });

      // Redirect to backend Google OAuth endpoint
      const googleAuthUrl = `${getApiBaseUrl()}/auth/google?${params.toString()}`;
      
      // Store current state in sessionStorage to restore after redirect
      sessionStorage.setItem('ryfty-auth-state', JSON.stringify({
        userType: userType || 'user',
        mode: mode,
        redirect: searchParams.get('redirect'),
        timestamp: Date.now()
      }));

      // Redirect to backend
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Google auth redirect error:', error);
      setError('Failed to initiate Google authentication');
      setIsLoading(false);
    }
  };

  if (!config.features.googleAuth) {
    return null;
  }

  return (
    <div className="google-auth-container">
      {error && (
        <motion.div 
          className="error-message google-error"
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
        type="button"
        className={`google-auth-button ${isLoading ? 'loading' : ''}`}
        onClick={handleGoogleAuth}
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
      >
        {isLoading ? (
          <div className="google-loading">
            <div className="spinner"></div>
            <span>Redirecting to Google...</span>
          </div>
        ) : (
          <>
            <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>
              {mode === 'login' ? 'Continue' : 'Sign up'} with Google
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}
