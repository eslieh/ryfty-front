"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfilePhotoUpload from '../ProfilePhotoUpload';

export default function ProfilePhotoStep({ formData, updateFormData, nextStep }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePhotoUpload = (photoUrl) => {
    updateFormData('profilePhoto', photoUrl);
  };

  const handleSkip = async () => {
    await createAccount(null);
  };

  const handleContinue = async () => {
    await createAccount(formData.profilePhoto);
  };

  const createAccount = async (profilePhoto) => {
    setIsLoading(true);
    setError('');

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        password: formData.password,
        role: formData.userType,
        profilePhoto
      };

      const result = await register(userData);
      
      if (result.success) {
        if (result.needsVerification) {
          // Move to verification step
          nextStep('verification');
        } else {
          // Direct success (shouldn't happen with new flow, but just in case)
          const redirect = searchParams.get('redirect') || 
                          (formData.userType === 'provider' ? '/provider/onboarding' : '/welcome');
          router.push(redirect);
        }
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-photo-step">
      {/* Header */}
      <div className="step-header">
        <h1 className="step-title">Add a profile photo</h1>
        <p className="step-subtitle">
          Help others recognize you by adding a profile photo. You can always change this later.
        </p>
      </div>

      {/* Photo Upload */}
      <div className="photo-upload-section">
        <ProfilePhotoUpload 
          onPhotoUpload={handlePhotoUpload}
          currentPhoto={formData.profilePhoto}
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

      {/* Action Buttons */}
      <div className="photo-step-actions">
        {formData.profilePhoto ? (
          <motion.button
            type="button"
            className="step-continue-button active"
            onClick={handleContinue}
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Creating account...
              </div>
            ) : (
              `Create ${formData.userType === 'provider' ? 'Provider' : 'Customer'} Account`
            )}
          </motion.button>
        ) : (
          <>
            <motion.button
              type="button"
              className="step-continue-button active"
              onClick={handleContinue}
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <div className="button-loading">
                  <div className="spinner"></div>
                  Creating account...
                </div>
              ) : (
                `Create ${formData.userType === 'provider' ? 'Provider' : 'Customer'} Account`
              )}
            </motion.button>
            
            <button
              type="button"
              className="skip-button"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip for now
            </button>
          </>
        )}
      </div>

      {/* Welcome Message */}
      <div className="welcome-message">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Welcome to Ryfty, {formData.firstName}!</h3>
          <p>
            {formData.userType === 'provider' 
              ? "You're about to join our community of experience providers. Share your expertise and create memorable moments for others."
              : "You're about to join our community of experience seekers. Discover amazing adventures and create lasting memories."
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}
