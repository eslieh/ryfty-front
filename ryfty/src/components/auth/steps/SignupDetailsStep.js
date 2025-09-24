"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SignupDetailsStep({ formData, updateFormData, nextStep }) {
  const [details, setDetails] = useState({
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    phone: formData.phone || '',
    password: formData.password || '',
    confirmPassword: '',
    userType: formData.userType || 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[passwordStrength] || 'Very Weak';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
    return colors[passwordStrength] || '#ef4444';
  };

  const handleChange = (field, value) => {
    const newDetails = { ...details, [field]: value };
    setDetails(newDetails);
    
    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
    
    // Update form data in parent
    updateFormData(field, value);
  };

  const handleUserTypeChange = (type) => {
    handleChange('userType', type);
  };

  const validateForm = () => {
    return details.firstName.trim() && 
           details.lastName.trim() && 
           details.password && 
           details.password === details.confirmPassword &&
           passwordStrength >= 3;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validateForm()) {
      nextStep('profile-photo');
    }
  };

  const isFormValid = validateForm();

  return (
    <div className="signup-details-step">
      {/* Header */}
      <div className="step-header">
        <h1 className="step-title">Tell us about yourself</h1>
        <p className="step-subtitle">
          We&apos;ll use this information to create your account
        </p>
      </div>

      {/* User Type Selection */}
      <div className="user-type-selector">
        <div className="type-tabs">
          <button 
            type="button"
            className={`type-tab ${details.userType === 'customer' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('customer')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Customer
          </button>
          <button 
            type="button"
            className={`type-tab ${details.userType === 'provider' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('provider')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21L12 17L19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Provider
          </button>
        </div>
        <p className="type-description">
          {details.userType === 'customer' 
            ? 'Discover and book amazing experiences' 
            : 'Share your expertise and host experiences'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleContinue} className="step-form">
        {/* Name Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={details.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="form-input"
              placeholder="First name"
              required
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={details.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="form-input"
              placeholder="Last name"
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Phone Field */}
        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Phone Number <span style={{ color: '#9ca3af' }}>(Optional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={details.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="form-input"
            placeholder="+1 (555) 123-4567"
            autoComplete="tel"
          />
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={details.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="form-input"
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
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
          
          {/* Password Strength Indicator */}
          {details.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className="strength-fill" 
                  style={{ 
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: getPasswordStrengthColor()
                  }}
                ></div>
              </div>
              <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                {getPasswordStrengthText()}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={details.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={`form-input ${details.confirmPassword && details.password !== details.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
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
          {details.confirmPassword && details.password !== details.confirmPassword && (
            <span className="field-error">Passwords do not match</span>
          )}
        </div>

        <motion.button
          type="submit"
          className={`step-continue-button ${isFormValid ? 'active' : ''}`}
          disabled={!isFormValid}
          whileHover={isFormValid ? { scale: 1.02 } : {}}
          whileTap={isFormValid ? { scale: 0.98 } : {}}
        >
          Continue
        </motion.button>
      </form>
    </div>
  );
}
