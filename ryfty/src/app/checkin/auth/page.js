"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { verifyDeviceToken } from '@/utils/api';
import { saveDeviceToken, removeDeviceToken } from '@/utils/deviceToken';
import '@/styles/checkin.css';

function CheckinAuthContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (!token) {
      setError('No authorization token provided');
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Verifying device token:', token);
      const response = await verifyDeviceToken(token);
      console.log('Device verification response:', response);
      
      if (response && response.message === 'Device verified successfully') {
        setDeviceInfo({
          deviceName: response.device_name,
          experienceId: response.experience_id,
          slotId: response.slot_id,
          authorizedBy: response.authorized_by
        });
        
        // Save token to localStorage for future use
        saveDeviceToken(token, {
          deviceName: response.device_name,
          experienceId: response.experience_id,
          slotId: response.slot_id,
          authorizedBy: response.authorized_by,
          verifiedAt: new Date().toISOString()
        });
        
        setVerificationSuccess(true);
      } else {
        setError('Invalid verification response');
      }
    } catch (err) {
      console.error('Error verifying token:', err);
      
      if (err.message === 'TOKEN_EXPIRED') {
        setError('This authorization token has expired. Please request a new one from the provider.');
      } else {
        setError(err.message || 'Failed to verify device token');
      }
      
      // Remove any existing token on error
      removeDeviceToken();
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckin = () => {
    // Navigate to check-in flow (to be implemented)
    router.push(`/checkin`);
  };

  const handleClose = () => {
    // Close the window or navigate away
    if (window.opener) {
      window.close();
    } else {
      // If opened directly, redirect to home or show message
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="checkin-mobile-page">
        <div className="checkin-mobile-container">
          <div className="checkin-loading">
            <h2>Verifying Device</h2>
            <p>Please wait while we verify your authorization...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkin-mobile-page">
        <div className="checkin-mobile-container">
          <div className="checkin-error">
            <div className="error-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Authorization Failed</h2>
            <p>{error}</p>
            <button 
              className="checkin-btn checkin-btn-primary"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationSuccess && deviceInfo) {
    return (
      <div className="checkin-mobile-page">
        <div className="checkin-mobile-container">
          <motion.div 
            className="checkin-success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="success-animation">
              <div className="success-icon">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            <div className="success-content">
              <h1 className="success-title">Device Authorized!</h1>
              <p className="success-subtitle">
                Your device is now ready for check-in operations.
              </p>

              <div className="device-info-mobile">
                <div className="info-item-mobile">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Device</span>
                    <span className="info-value">{deviceInfo.deviceName}</span>
                  </div>
                </div>

                <div className="info-item-mobile">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Experience</span>
                    <span className="info-value">{deviceInfo.experienceId.slice(0, 8)}...</span>
                  </div>
                </div>

                <div className="info-item-mobile">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Slot</span>
                    <span className="info-value">{deviceInfo.slotId.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              <div className="checkin-actions-mobile">
                <button 
                  className="checkin-btn checkin-btn-primary checkin-btn-large"
                  onClick={handleStartCheckin}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Start Check-in
                </button>
                
                <button 
                  className="checkin-btn checkin-btn-secondary"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}

export default function CheckinAuthPage() {
  return (
    <Suspense fallback={
      <div className="checkin-mobile-page">
        <div className="checkin-mobile-container">
          <div className="checkin-loading">
            <h2>Loading...</h2>
            <p>Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <CheckinAuthContent />
    </Suspense>
  );
}
