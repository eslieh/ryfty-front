"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { authorizeDevice, fetchAuthorizedDevices, deauthorizeDevice } from '@/utils/api';
import config from '@/config';
import '@/styles/provider.css';

export default function DeviceManagementPage({ params }) {
  const { experienceId, slotId } = params;
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentDeviceToken, setCurrentDeviceToken] = useState(null);
  const [currentCheckinUrl, setCurrentCheckinUrl] = useState(null);

  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (!isAuthenticated || !isProvider()) {
      router.push('/auth');
    }
  }, [isAuthenticated, isProvider, router]);

  // Fetch authorized devices on component mount
    

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAuthorizedDevices();
      console.log('Authorized devices response:', response);
      
      if (response && response.devices) {
        setDevices(response.devices);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to fetch authorized devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await authorizeDevice(experienceId, slotId, deviceName.trim());
      console.log('Device authorization response:', response);
      
      if (response && response.device_token) {
        setCurrentDeviceToken(response.device_token);
        const checkinUrl = `${config.app.baseUrl}/checkin/auth?token=${response.device_token}`;
        setCurrentCheckinUrl(checkinUrl);
        setShowShareModal(true);
        setDeviceName('');
        setShowAddDevice(false);
        // Refresh devices list
        await fetchDevices();
      }
    } catch (err) {
      console.error('Error authorizing device:', err);
      setError('Failed to authorize device');
    } finally {
      setSubmitting(false);
    }
  };

  const shareToWhatsApp = () => {
    const message = `Check-in authorization link: ${currentCheckinUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareDeepLink = () => {
    // For mobile devices, try to open the app directly
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Try to open the app first
      window.location.href = currentCheckinUrl;
      
      // Fallback to web if app doesn't open
      setTimeout(() => {
        window.open(currentCheckinUrl, '_blank');
      }, 2000);
    } else {
      // For desktop, just open in new tab
      window.open(currentCheckinUrl, '_blank');
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check-in Authorization',
          text: 'Use this link to authorize your device for check-in',
          url: currentCheckinUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to copy
        copyToClipboard(currentCheckinUrl);
      }
    } else {
      // Fallback to copy
      copyToClipboard(currentCheckinUrl);
    }
  };

  const handleDeauthorizeDevice = async (deviceName) => {
    if (!confirm(`Are you sure you want to deauthorize "${deviceName}"?`)) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await deauthorizeDevice(deviceName);
      console.log('Device deauthorization response:', response);
      
      // Refresh devices list
      await fetchDevices();
    } catch (err) {
      console.error('Error deauthorizing device:', err);
      setError('Failed to deauthorize device');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeviceExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  // Loading state
  if (loading && devices.length === 0) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading devices...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-main-page">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation
          className="provider-left-nav"
          orientation="vertical"
        />

        <motion.main 
          className="provider-main-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="content-wrapper">
            {/* Header */}
            <div className="manage-header">
              <div className="header-left">
                <button 
                  className="btn btn-secondary back-btn"
                  onClick={() => window.history.back()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
                <div className="page-title-section">
                  <h1 className="page-title">Device Management</h1>
                  <p className="page-subtitle">
                    Manage check-in devices for this slot
                  </p>
                </div>
              </div>
            </div>

            {/* Device Management Section */}
            <div className="device-management-section">
              <motion.div 
                className="device-management-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="section-header">
                  <h2 className="section-title">Check-in Devices</h2>
                  <p className="section-subtitle">Manage devices authorized for check-in</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddDevice(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add Device
                </button>
              </motion.div>

              {error && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* Add Device Modal */}
              {showAddDevice && (
                <motion.div 
                  className="modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowAddDevice(false)}
                >
                  <motion.div 
                    className="modal-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h3>Add Check-in Device</h3>
                      <button 
                        className="modal-close"
                        onClick={() => setShowAddDevice(false)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddDevice} className="device-form">
                      <div className="form-group">
                        <label htmlFor="deviceName">Device Name</label>
                        <input
                          type="text"
                          id="deviceName"
                          value={deviceName}
                          onChange={(e) => setDeviceName(e.target.value)}
                          placeholder="e.g., John's iPhone, iPad Pro"
                          required
                          disabled={submitting}
                        />
                        <small className="form-help">
                          Enter a descriptive name for the device that will be used for check-in
                        </small>
                      </div>
                      
                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => setShowAddDevice(false)}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={submitting || !deviceName.trim()}
                        >
                          {submitting ? 'Authorizing...' : 'Authorize Device'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}

              {/* Share Modal */}
              {showShareModal && (
                <motion.div 
                  className="modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowShareModal(false)}
                >
                  <motion.div 
                    className="modal-content share-modal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h3>Share Check-in Authorization</h3>
                      <button 
                        className="modal-close"
                        onClick={() => setShowShareModal(false)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="share-content">
                      <div className="share-instructions">
                        <p>Share this authorization link with the device that needs to be authorized for check-in:</p>
                      </div>
                      
                      <div className="share-url-display">
                        <label>Check-in URL:</label>
                        <div className="url-display">
                          <code>{currentCheckinUrl}</code>
                          <button 
                            className="copy-url-btn"
                            onClick={() => copyToClipboard(currentCheckinUrl)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M16 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8M16 4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4M16 4C16 5.10457 15.1046 6 14 6H10C8.89543 6 8 5.10457 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Copy Link
                          </button>
                        </div>
                      </div>

                      <div className="share-buttons">
                        <button 
                          className="share-btn whatsapp-btn"
                          onClick={shareToWhatsApp}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="currentColor"/>
                          </svg>
                          Share on WhatsApp
                        </button>

                        <button 
                          className="share-btn deeplink-btn"
                          onClick={shareDeepLink}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Open Link
                        </button>

                        <button 
                          className="share-btn copy-btn"
                          onClick={shareViaWebShare}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="16,6 12,2 8,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Share
                        </button>
                      </div>

                      <div className="share-token">
                        <label>Device Token:</label>
                        <div className="token-display">
                          <code>{currentDeviceToken}</code>
                          <button 
                            className="copy-token-btn"
                            onClick={() => copyToClipboard(currentDeviceToken)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M16 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8M16 4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4M16 4C16 5.10457 15.1046 6 14 6H10C8.89543 6 8 5.10457 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Copy Token
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Devices List */}
              {loading ? (
                <div className="devices-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading devices...</p>
                </div>
              ) : devices.length > 0 ? (
                <motion.div 
                  className="devices-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {devices.map((device, index) => (
                    <motion.div
                      key={`${device.device_name}-${device.authorized_at}`}
                      className={`device-card ${isDeviceExpired(device.expires_at) ? 'expired' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="device-info">
                        <div className="device-header">
                          <h4 className="device-name">{device.device_name}</h4>
                          <div className={`device-status ${device.active ? 'active' : 'inactive'}`}>
                            {device.active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        
                        <div className="device-details">
                          <div className="device-detail-item">
                            <span className="detail-label">Authorized:</span>
                            <span className="detail-value">{formatDate(device.authorized_at)}</span>
                          </div>
                          <div className="device-detail-item">
                            <span className="detail-label">Expires:</span>
                            <span className={`detail-value ${isDeviceExpired(device.expires_at) ? 'expired' : ''}`}>
                              {formatDate(device.expires_at)}
                            </span>
                          </div>
                          <div className="device-detail-item">
                            <span className="detail-label">Experience:</span>
                            <span className="detail-value">{device.experience_id}</span>
                          </div>
                          <div className="device-detail-item">
                            <span className="detail-label">Slot:</span>
                            <span className="detail-value">{device.slot_id}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="device-actions">
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeauthorizeDevice(device.device_name)}
                          disabled={loading}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Deauthorize
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="empty-devices"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>No devices authorized</h3>
                  <p>Add devices to enable check-in functionality for this slot.</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
