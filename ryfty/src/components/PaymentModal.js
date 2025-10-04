"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { completePayment } from "@/utils/api";
import "@/styles/payment-modal.css";

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  reservationId, 
  balanceAmount, 
  experienceTitle,
  onPaymentSuccess 
}) {
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const validateMpesaNumber = (number) => {
    // Remove any spaces or dashes
    const cleanNumber = number.replace(/[\s-]/g, '');
    
    // Check if it's a valid Kenyan mobile number
    const kenyanMobileRegex = /^(07|01)[0-9]{8}$/;
    return kenyanMobileRegex.test(cleanNumber);
  };

  const handleMpesaNumberChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 10 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 10);
    setMpesaNumber(cleanValue);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mpesaNumber) {
      setError("Please enter your M-Pesa number");
      return;
    }

    if (!validateMpesaNumber(mpesaNumber)) {
      setError("Please enter a valid Kenyan mobile number (07xxxxxxxx or 01xxxxxxxx)");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const paymentData = {
        mpesa_number: mpesaNumber,
        amount: balanceAmount
      };

      console.log('Submitting payment:', paymentData);
      
      const response = await completePayment(reservationId, paymentData);
      console.log('Payment response:', response);
      
      setSuccess(true);
      
      // Close modal after 2 seconds and call success callback
      setTimeout(() => {
        onPaymentSuccess?.();
        handleClose();
      }, 2000);
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setMpesaNumber("");
    setError(null);
    setSuccess(false);
    setIsProcessing(false);
    onClose();
  };

  const formatMpesaNumber = (number) => {
    if (number.length <= 3) return number;
    if (number.length <= 6) return `${number.slice(0, 3)} ${number.slice(3)}`;
    return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="payment-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="payment-modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="payment-modal-header">
            <h2 className="payment-modal-title">Complete Payment</h2>
            <button 
              className="payment-modal-close"
              onClick={handleClose}
              disabled={isProcessing}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="payment-modal-body">
            {!success ? (
              <>
                {/* Payment Summary */}
                <div className="payment-summary">
                  <div className="summary-item">
                    <span className="summary-label">Experience:</span>
                    <span className="summary-value">{experienceTitle}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Outstanding Balance:</span>
                    <span className="summary-value balance">{formatPrice(balanceAmount)}</span>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="payment-instructions">
                  <h3>Payment Instructions</h3>
                  <ol>
                    <li>Enter your M-Pesa number below</li>
                    <li>Click "Request Payment" to initiate the payment</li>
                    <li>You will receive an M-Pesa prompt on your phone</li>
                    <li>Enter your M-Pesa PIN to complete the payment</li>
                  </ol>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="payment-form">
                  <div className="form-group">
                    <label htmlFor="mpesa-number" className="form-label">
                      M-Pesa Number
                    </label>
                    <div className="input-container">
                      <span className="input-prefix">+254</span>
                      <input
                        type="tel"
                        id="mpesa-number"
                        className="form-input"
                        placeholder="7xxxxxxxxx"
                        value={formatMpesaNumber(mpesaNumber)}
                        onChange={handleMpesaNumberChange}
                        disabled={isProcessing}
                        maxLength={12}
                      />
                    </div>
                    <p className="form-help">
                      Enter your 10-digit Kenyan mobile number (07xxxxxxxx or 01xxxxxxxx)
                    </p>
                  </div>

                  {error && (
                    <div className="form-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleClose}
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isProcessing || !mpesaNumber}
                    >
                      {isProcessing ? (
                        <>
                          <div className="spinner"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Request Payment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="payment-success">
                <div className="success-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="success-title">Payment Request Sent!</h3>
                <p className="success-message">
                  Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                </p>
                <div className="success-details">
                  <div className="detail-item">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{formatPrice(balanceAmount)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">+254 {formatMpesaNumber(mpesaNumber)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
