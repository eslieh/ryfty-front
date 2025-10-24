"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PasswordStep({ formData, updateFormData, nextStep }) {
  const [password, setPassword] = useState(formData.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    updateFormData('password', value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.email, password);
      
      if (result.success) {
        // Redirect based on user type or redirect parameter
        const redirect = searchParams.get('redirect') || 
                        (formData.userType === 'provider' ? '/provider/dashboard' : '/');
        router.push(redirect);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    nextStep('forgot-password');
  };

  return (
    <div className="password-step">
      {/* Header */}
      <div className="step-header">
        <h1 className="step-title">Enter your password</h1>
        <p className="step-subtitle">
          Welcome back, {formData.email}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="step-form">
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className="form-input large"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              autoFocus
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="forgot-password">
          <button 
            type="button" 
            className="forgot-password-link"
            onClick={handleForgotPassword}
          >
            Forgot your password?
          </button>
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
          className={`step-continue-button ${password && !isLoading ? 'active' : ''}`}
          disabled={!password || isLoading}
          whileHover={password && !isLoading ? { scale: 1.02 } : {}}
          whileTap={password && !isLoading ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <div className="button-loading">
              <div className="spinner"></div>
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </motion.button>
      </form>
    </div>
  );
}
