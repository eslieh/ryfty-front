"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import QrScanner from 'qr-scanner';
import { getDeviceToken, hasDeviceToken } from '@/utils/deviceToken';
import { deviceCheckin } from '@/utils/api';
import '@/styles/checkin.css';

export default function CheckinPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [pendingCheckin, setPendingCheckin] = useState(null);
  const [isProcessingCheckin, setIsProcessingCheckin] = useState(false);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    checkDeviceAuth();
  }, []);

  const checkDeviceAuth = () => {
    if (!hasDeviceToken()) {
      setError('Device not authorized. Please scan the QR code from the provider.');
      setLoading(false);
      return;
    }
    
    setLoading(false);
    // Camera will only start when user clicks "Start Scanning"
  };

  const requestCameraAccess = async () => {
    try {
      console.log('🎥 Requesting camera access...');
      
      // Ensure video element exists
      if (!videoRef.current) {
        console.error('❌ Video element not available');
        setError('Video element not available. Please refresh the page.');
        return;
      }
      
      console.log('✅ Video element found:', videoRef.current);
      
      // Initialize QR Scanner directly - let it handle camera access
      console.log('🔍 Initializing QR Scanner...');
      
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('🎯 ===== QR CODE DETECTED! =====');
          console.log('📦 Raw result:', result);
          console.log('📝 Result type:', typeof result);
          console.log('📄 Result data:', result.data || result);
          console.log('================================');
          handleScanResult(result);
        },
        {
          onDecodeError: (error) => {
            // Log ALL decode attempts for debugging
            // console.log('🔄 Scanning... (looking for QR code)');
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
          maxScansPerSecond: 5, // Increase scan frequency for testing
          returnDetailedScanResult: true, // Get detailed results for debugging
        }
      );
      
      qrScannerRef.current = qrScanner;
      console.log('📷 QR Scanner instance created');
      
      // Start the scanner - this will trigger camera permission request
      console.log('▶️ Starting QR Scanner...');
      await qrScanner.start();
      console.log('✅ QR Scanner started successfully!');
      
      // Check camera status
      const hasCamera = await QrScanner.hasCamera();
      console.log('📹 Has camera:', hasCamera);
      
      setCameraPermission('granted');
      
    } catch (err) {
      console.error('❌ Camera access error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      setCameraPermission('denied');
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access to scan QR codes.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported. Please use a modern browser with camera support.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera constraints cannot be satisfied. Trying alternative camera...');
        tryAlternativeCamera();
      } else {
        setError(`Failed to access camera: ${err.message}`);
      }
    }
  };

  const tryAlternativeCamera = async () => {
    try {
      console.log('🔄 Trying alternative camera configuration...');
      
      if (!videoRef.current) {
        console.error('❌ Video element not available for alternative camera');
        setError('Video element not available. Please refresh the page.');
        return;
      }
      
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('🎯 ===== QR CODE DETECTED! =====');
          console.log('📦 Raw result:', result);
          console.log('================================');
          handleScanResult(result);
        },
        {
          onDecodeError: (error) => {
            console.log('🔄 Scanning...');
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'user', // Try front camera instead
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        }
      );
      
      qrScannerRef.current = qrScanner;
      await qrScanner.start();
      setCameraPermission('granted');
      console.log('✅ Alternative camera started successfully');
      
    } catch (err) {
      console.error('❌ Alternative camera also failed:', err);
      setError('Unable to access any camera. Please check your browser settings and try again.');
    }
  };

  const validateReservationCode = (code) => {
    // Check if code starts with 'ryfty_reservation_'
    const reservationPrefix = 'ryfty_reservation_';
    if (!code.startsWith(reservationPrefix)) {
      return { valid: false, error: 'Invalid QR code format. Expected reservation QR code.' };
    }
    
    // Extract UUID part
    let idWithBraces = code.substring(reservationPrefix.length);

    // Remove { and } if present
    const uuid = idWithBraces.replace(/[{}]/g, '');
    
    // Basic UUID validation (8-4-4-4-12 format)
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // if (!uuidRegex.test(uuid)) {
    //   return { valid: false, error: 'Invalid reservation ID format.' };
    // }
    
    return { valid: true, reservationId: uuid };
  };

  const handleScanResult = (result) => {
    console.log('🎯 ===== handleScanResult CALLED =====');
    console.log('📦 Full result object:', result);
    console.log('🔍 isScanning state:', isScanning);
    
    // if (!isScanning) {
    //   console.log('⚠️ Not scanning - ignoring result');
    //   return;
    // }
    
    // Extract QR data
    const qrData = typeof result === 'string' ? result : (result.data || JSON.stringify(result));
    console.log('📝 Extracted QR data:', qrData);
    console.log('📏 QR data length:', qrData.length);
    
    // // Alert what QR code was scanned
    // alert(`QR Code Scanned: "${qrData}"`);
    
    // Debounce rapid scans - prevent processing the same code multiple times
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTime;
    
    console.log('⏱️ Time since last scan:', timeSinceLastScan, 'ms');
    
    if (timeSinceLastScan < 2000) { // 2 second debounce
      console.log('⏸️ Scan debounced - too soon after last scan');
      return;
    }
    
    console.log('✅ Processing scan...');
    
    // Update last scan time
    setLastScanTime(now);
    
    // Track the last scanned code for feedback
    setLastScannedCode({
      data: qrData,
      timestamp: new Date().toISOString()
    });
    
    // Validate the scanned code
    const validation = validateReservationCode(qrData);
    console.log('🔍 Validation result:', validation);
    
    if (!validation.valid) {
      console.log('❌ Invalid QR code format:', qrData);
      console.log('Expected format: ryfty_reservation_{uuid}');
      
      // Show specific error based on what was scanned
      let errorMessage = validation.error;
      if (qrData.startsWith('http')) {
        errorMessage = 'This appears to be a website QR code. Please scan a reservation QR code.';
      } else if (qrData.includes('@')) {
        errorMessage = 'This appears to be an email QR code. Please scan a reservation QR code.';
      } else if (qrData.length < 10) {
        errorMessage = 'This QR code is too short. Please scan a reservation QR code.';
      }
      
      setScanError(errorMessage);
      setTimeout(() => setScanError(null), 3000);
      return;
    }
    
    console.log('✅ Valid reservation QR code found:', validation.reservationId);
    
    // Valid reservation code found - show confirmation instead of auto-processing
    setPendingCheckin({
      code: qrData,
      reservationId: validation.reservationId,
      scannedAt: new Date().toISOString()
    });
    
    // Stop scanning until user confirms or cancels
    setIsScanning(false);
  };

  const confirmCheckin = async () => {
    if (!pendingCheckin) return;
    
    setIsProcessingCheckin(true);
    try {
      await processReservation(pendingCheckin.reservationId);
    } catch (error) {
      console.error('Check-in failed:', error);
      setIsProcessingCheckin(false);
    }
  };

  const cancelCheckin = () => {
    setPendingCheckin(null);
    setIsProcessingCheckin(false);
    setIsScanning(true);
  };

  const processReservation = async (reservationId) => {
    try {
      console.log('🔄 Processing reservation:', reservationId);
      
      // Make real API call to check-in
      const response = await deviceCheckin(reservationId);
      console.log('✅ Check-in response:', response);
      
      if (response.status === 'success') {
        // Show success message with actual response data
        const successMessage = `✅ ${response.message}`;
        
        // Create personalized welcome message
        let welcomeMessage = "Welcome!";
        if (response.message && response.message.includes("checked in successfully")) {
          // Extract name from message like "Eslieh Victor checked in successfully"
          const nameMatch = response.message.match(/^([^]+?)\s+checked in successfully/);
          if (nameMatch) {
            welcomeMessage = `Welcome, ${nameMatch[1]}!`;
          }
        }
        
        // Update scan result with success state
        setScanResult({
          code: `ryfty_reservation_${reservationId}`,
          reservationId: reservationId,
          scannedAt: new Date().toISOString(),
          status: 'success',
          checkinData: response,
          message: successMessage,
          welcomeMessage: welcomeMessage,
          numberOfGuests: response.number_of_guests || 1
        });
      } else if (response.status === 'already_checked_in') {
        // Handle already checked in case (400)
        setScanError('This customer has already been checked in.');
        setTimeout(() => {
          setScanError(null);
          setPendingCheckin(null);
          setIsProcessingCheckin(false);
          setIsScanning(true);
        }, 3000);
        return;
      } else if (response.status === 'reservation_not_found') {
        // Handle reservation not found case (404)
        setScanError('Reservation not found. Please check the QR code and try again.');
        setTimeout(() => {
          setScanError(null);
          setPendingCheckin(null);
          setIsProcessingCheckin(false);
          setIsScanning(true);
        }, 3000);
        return;
      }
      
      // Reset for next scan after delay
      setTimeout(() => {
        setScanResult(null);
        setPendingCheckin(null);
        setIsProcessingCheckin(false);
        setIsScanning(true);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error processing reservation:', error);
      
      let errorMessage = 'Failed to process reservation. Please try again.';
      
      if (error.message === 'Device token not found') {
        errorMessage = 'Device authorization expired. Please re-scan the device QR code.';
      } else if (error.message.includes('Check-in failed')) {
        errorMessage = `Check-in failed: ${error.message}`;
      }
      
      setScanError(errorMessage);
      setTimeout(() => {
        setScanError(null);
        setPendingCheckin(null);
        setIsProcessingCheckin(false);
        setIsScanning(true);
      }, 3000);
    }
  };

  const startScanning = async () => {
    console.log('🚀 ===== START SCANNING CLICKED =====');
    console.log('📹 Video element:', videoRef.current);
    console.log('📱 Scanner ref before:', qrScannerRef.current);
    
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setLastScannedCode(null);
    setLastScanTime(0);
    setPendingCheckin(null);
    setIsProcessingCheckin(false);
    
    console.log('🎬 Calling requestCameraAccess...');
    await requestCameraAccess();
    console.log('✅ requestCameraAccess completed');
    console.log('📱 Scanner ref after:', qrScannerRef.current);
  };

  const stopScanning = () => {
    setIsScanning(false);
    console.log('⏹️ Stopping QR code scanning...');
    
    // Stop the QR scanner
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    // Reset camera permission state
    setCameraPermission(null);
  };

  const retryCameraAccess = async () => {
    console.log('🔄 Retrying camera access...');
    setError(null);
    setCameraPermission(null);
    setLoading(true);
    
    // Clean up existing scanner
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      } catch (e) {
        console.log('Error cleaning up scanner:', e);
      }
      qrScannerRef.current = null;
    }
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setLoading(false);
    await requestCameraAccess();
  };

  const handleClose = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
    }
    window.close();
  };

  if (loading) {
    return (
      <div className="checkin-mobile-page">
        <div className="checkin-mobile-container">
          <div className="checkin-loading">
            <div className="checkin-spinner">
              <div className="spinner-ring"></div>
            </div>
            <h2>Initializing Check-in</h2>
            <p>Setting up camera access...</p>
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
            <h2>Access Required</h2>
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

  if (cameraPermission === 'denied') {
    return (
      <div className="checkin-mobile-page">
        <div className="checkin-mobile-container">
          <div className="checkin-error">
            <div className="error-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M15 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8L15 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 3V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Camera Access Denied</h2>
            <p>Please allow camera access in your browser settings to scan QR codes for check-in.</p>
            <div className="checkin-actions-mobile">
              <button 
                className="checkin-btn checkin-btn-primary"
                onClick={retryCameraAccess}
              >
                Try Again
              </button>
              <button 
                className="checkin-btn checkin-btn-secondary"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-mobile-page">
      <div className="checkin-camera-container">
        {/* Camera Header */}
        <div className="camera-header">
          <div className="camera-title">
            <h1>Check-in Scanner</h1>
            <p>Scan customer QR codes to process check-ins</p>
          </div>
          <button 
            className="camera-close-btn"
            onClick={handleClose}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
          
          {/* Scanning Overlay */}
          <div className="scanning-overlay">
            <div className="scan-frame">
              <div className="scan-corner scan-corner-tl"></div>
              <div className="scan-corner scan-corner-tr"></div>
              <div className="scan-corner scan-corner-bl"></div>
              <div className="scan-corner scan-corner-br"></div>
            </div>
            <div className="scan-line"></div>
          </div>

          {/* Scanning Status */}
          {isScanning && !scanResult && (
            <div className="scanning-status">
              <div className="scanning-indicator">
                <div className="scanning-dot"></div>
                <div className="scanning-dot"></div>
                <div className="scanning-dot"></div>
              </div>
              <p>Scanning all QR codes...</p>
              <small>Only reservation QR codes will be accepted</small>
            </div>
          )}

          {/* QR Code Detection Feedback */}
          {lastScannedCode && isScanning && !scanResult && (
            <div className="qr-detected-feedback">
              <div className="detection-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <small>QR code detected - validating...</small>
            </div>
          )}

          {/* Scan Error */}
          {scanError && (
            <div className="scan-error">
              <div className="error-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>{scanError}</p>
            </div>
          )}

          {/* Pending Check-in Confirmation */}
          {pendingCheckin && !scanResult && (
            <div className="pending-checkin">
              <div className="pending-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="pending-title">Valid QR Code Detected</h2>
              <p className="pending-subtitle">Ready to check in this customer?</p>
              <div className="checkin-details">
                <div className="detail-item">
                  <span className="detail-label">Reservation ID</span>
                  <span className="detail-value">{pendingCheckin.reservationId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scanned At</span>
                  <span className="detail-value">{new Date(pendingCheckin.scannedAt).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="checkin-actions">
                <button 
                  className="checkin-btn checkin-btn-primary"
                  onClick={confirmCheckin}
                  disabled={isProcessingCheckin}
                >
                  {isProcessingCheckin ? (
                    <>
                      <div className="spinner-small"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Check In
                    </>
                  )}
                </button>
                <button 
                  className="checkin-btn checkin-btn-secondary"
                  onClick={cancelCheckin}
                  disabled={isProcessingCheckin}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Scan Success */}
          {scanResult && scanResult.status === 'success' && (
            <div className="scan-success">
              <div className="success-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="welcome-title">{scanResult.welcomeMessage || "Welcome!"}</h2>
              <div className="checkin-details">
                <div className="detail-item primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <span className="detail-label">Number of Guests</span>
                    <span className="detail-value">{scanResult.numberOfGuests || 1}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Reservation ID</span>
                  <span className="detail-value">{scanResult.reservationId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Check-in Time</span>
                  <span className="detail-value">{new Date(scanResult.scannedAt).toLocaleTimeString()}</span>
                </div>
                <div className="detail-item success-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Successfully Checked In</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="camera-controls">
          <div className="camera-info">
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8L15 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Camera Active</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Device Authorized</span>
            </div>
          </div>

          <div className="camera-actions">
            {!pendingCheckin && (
              <button 
                className={`camera-action-btn ${isScanning ? 'active' : ''}`}
                onClick={isScanning ? stopScanning : startScanning}
              >
                {isScanning ? (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8L15 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Start Scanning
                  </>
                )}
              </button>
            )}
            {pendingCheckin && (
              <div className="pending-status">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Waiting for confirmation...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}