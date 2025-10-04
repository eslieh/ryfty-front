"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeGenerator({ reservationId, size = 200 }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!reservationId) return;

      try {
        setLoading(true);
        setError(null);

        console.log('Generating QR code for:', reservationId);

        // Generate QR code data URL
        const dataUrl = await QRCode.toDataURL(reservationId, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });

        console.log('QR code generated successfully');
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [reservationId, size]);

  if (loading) {
    return (
      <div className="qr-code-container">
        <div className="qr-code-loading">
          <div className="loading-spinner"></div>
          <p>Generating QR Code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-code-container">
        <div className="qr-code-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-code-container">
      <div className="qr-code-header">
        <h3 className="qr-code-title">Reservation QR Code</h3>
        <p className="qr-code-description">
          Scan this QR code to verify your reservation
        </p>
      </div>
      
      <div className="qr-code-wrapper">
        <div className="qr-code-image-container">
          <img 
            src={qrCodeDataUrl} 
            alt={`QR Code for reservation ${reservationId}`}
            className="qr-code-image"
          />
          <div className="qr-code-overlay">
            <img 
              src="/dot.png" 
              alt="Ryfty Logo"
              className="qr-code-logo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
