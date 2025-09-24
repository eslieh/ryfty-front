"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Completing authentication...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken, loading } = useAuth();

  useEffect(() => {
    // Wait for auth context to be ready before processing callback
    if (!loading) {
      handleAuthCallback();
    }
  }, [loading]);

  const handleAuthCallback = async () => {
    try {
      // Get URL parameters from the callback
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      
      // Get user data from URL parameters (new format from backend)
      const userEmail = searchParams.get('email');
      const userId = searchParams.get('id');
      const userName = searchParams.get('name');
      const userAvatar = searchParams.get('avatar_url');
      const userRole = searchParams.get('role');

      // Handle error cases
      if (error) {
        setStatus('error');
        setMessage(decodeURIComponent(error));
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
        return;
      }

      // Handle success cases
      if (token) {
        // Create user object from URL parameters
        const userData = {
          id: userId,
          email: userEmail,
          name: userName,
          avatar_url: userAvatar,
          role: userRole
        };

        // Use AuthContext to handle login
        console.log('Calling loginWithToken with:', { token, userData });
        if (!loginWithToken) {
          throw new Error('loginWithToken function not available');
        }
        const result = await loginWithToken(token, userData);
        console.log('loginWithToken result:', result);
        
        if (result.success) {
          setStatus('success');
          setMessage('Welcome back!');
        } else {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => {
            router.push('/auth');
          }, 3000);
          return;
        }

        // Determine redirect destination
        let redirectUrl = '/';
        
        // Check for stored redirect from sessionStorage
        const authState = sessionStorage.getItem('ryfty-auth-state');
        if (authState) {
          try {
            const state = JSON.parse(authState);
            if (state.redirect) {
              redirectUrl = state.redirect;
            } else if (userRole === 'provider' || state.userType === 'provider') {
              redirectUrl = '/provider/dashboard';
            }
            // Clean up stored state
            sessionStorage.removeItem('ryfty-auth-state');
          } catch (e) {
            console.error('Error parsing auth state:', e);
          }
        } else if (userRole === 'provider') {
          redirectUrl = '/provider/dashboard';
        }

        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1500);
      } else {
        // No token or error, something went wrong
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="callback-spinner">
            <div className="spinner large"></div>
          </div>
        );
      case 'success':
        return (
          <motion.div
            className="callback-icon success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            className="callback-icon error"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Show loading state while auth context is initializing
  if (loading) {
    return (
      <div className="auth-callback-container">
        <div className="auth-background">
          <div className="auth-background-overlay"></div>
        </div>
        <motion.div 
          className="callback-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="callback-content">
            <div className="callback-spinner">
              <div className="spinner large"></div>
            </div>
            <h1 className="callback-title">Initializing Authentication</h1>
            <p className="callback-message">Please wait while we set up your session...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-callback-container">
      <div className="auth-background">
        <div className="auth-background-overlay"></div>
      </div>
      
      <div className="auth-content">
        <motion.div 
          className="auth-card callback-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="callback-content">
            {getStatusIcon()}
            
            <motion.h1 
              className="callback-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {status === 'processing' && 'Authenticating...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Authentication Failed'}
            </motion.h1>
            
            <motion.p 
              className="callback-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.p>

            {status === 'processing' && (
              <motion.div
                className="callback-dots"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.button
                className="callback-retry-button"
                onClick={() => router.push('/auth')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try Again
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
