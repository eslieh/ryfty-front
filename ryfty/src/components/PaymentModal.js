"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initiatePartialPayment } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";
import "@/styles/payment-modal.css";

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  reservationId, 
  balanceAmount, 
  experienceTitle,
  onPaymentSuccess 
}) {
  const { user } = useAuth();
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(balanceAmount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [isWaitingForSSE, setIsWaitingForSSE] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [paymentTimeout, setPaymentTimeout] = useState(null);

  // Payment timeout configuration (in milliseconds)
  const PAYMENT_TIMEOUT_DURATION = 300000; // 5 minutes (300 seconds)

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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Remove any non-numeric characters except for decimal point
    const cleanValue = value.replace(/[^\d]/g, '');
    const amount = parseInt(cleanValue) || 0;
    
    setPaymentAmount(amount);
    setError(null);
    
    // Validate amount after setting it
    if (amount > balanceAmount) {
      setError(`Amount cannot exceed outstanding balance of ${formatPrice(balanceAmount)}`);
    } else if (amount <= 0 && cleanValue !== '') {
      setError('Amount must be greater than 0');
    }
  };

  const handleAmountBlur = () => {
    // Ensure amount is within valid range on blur
    if (paymentAmount > balanceAmount) {
      setPaymentAmount(balanceAmount);
      setError(null);
    } else if (paymentAmount <= 0) {
      setPaymentAmount(1);
      setError(null);
    }
  };

  const handleQuickAmount = (percentage) => {
    const amount = Math.floor(balanceAmount * percentage);
    setPaymentAmount(amount);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mpesaNumber) {
      setError("Please enter your M-Pesa number");
      return;
    }

    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > balanceAmount) {
      setError(`Amount cannot exceed outstanding balance of ${formatPrice(balanceAmount)}`);
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
        amount: paymentAmount
      };

      console.log('Submitting partial payment:', paymentData);
      
      const response = await initiatePartialPayment(reservationId, paymentData);
      console.log('Partial payment response:', response);
      
      // Start EventSource for payment status updates
      const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
      const newEventSource = new EventSource(`${baseUrl}/events/${user?.id || 'anonymous'}`);
      setEventSource(newEventSource);

      // Start waiting for payment confirmation
      setIsWaitingForPayment(true);
      setIsWaitingForSSE(true);
      setPaymentStatus('Waiting for payment...');

      // Set up timeout for payment response
      const timeoutId = setTimeout(() => {
        console.log('Payment timeout reached');
        setPaymentStatus("⏰ Payment Timeout - Please check your phone or try again");
        // Close EventSource on timeout
        if (newEventSource) {
          newEventSource.close();
          setEventSource(null);
        }
      }, PAYMENT_TIMEOUT_DURATION);
      
      setPaymentTimeout(timeoutId);

      // Set up EventSource for payment status updates
      newEventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("Payment event:", data);

        // Clear timeout when we receive any payment status update
        if (paymentTimeout) {
          clearTimeout(paymentTimeout);
          setPaymentTimeout(null);
        }

        // Clear SSE waiting state when we receive any update
        setIsWaitingForSSE(false);

        if (data.data?.state === "pending_confirmation") {
          setPaymentStatus("Processing payment...");
        }
        if (data.data?.state === "success") {
          setPaymentStatus("✅ Payment Successful!");
          setIsWaitingForPayment(false);
          setSuccess(true);
          
          // Close EventSource and call success callback
          newEventSource.close();
          setEventSource(null);
          
          setTimeout(() => {
            onPaymentSuccess?.();
            handleClose();
          }, 2000);
        }
        if (data.data?.state === "failed") {
          setPaymentStatus("❌ Payment Failed!");
          setIsWaitingForPayment(false);
          // Don't close EventSource or reset states - let user decide when to close
        }
      };

      newEventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setPaymentStatus("❌ Connection Error");
        setIsWaitingForPayment(false);
        setIsWaitingForSSE(false);
        // Clear timeout on error
        if (paymentTimeout) {
          clearTimeout(paymentTimeout);
          setPaymentTimeout(null);
        }
        // Don't automatically close - let user decide
      };
      
    } catch (err) {
      console.error('Payment error:', err);
      
      // Extract specific error message from backend
      let errorMessage = 'Payment failed. Please try again.';
      
      if (err.message) {
        // Use the specific error message from backend
        errorMessage = err.message;
        
        // Handle specific error cases with user-friendly messages
        if (err.message.includes('Reservation not found')) {
          errorMessage = 'Reservation not found. Please refresh the page and try again.';
        } else if (err.message.includes('already fully paid')) {
          errorMessage = 'This reservation is already fully paid.';
        } else if (err.message.includes('more than the required')) {
          errorMessage = err.message; // Keep the specific amount message from backend
        } else if (err.message.includes('Amount and reservation_id are required')) {
          errorMessage = 'Invalid payment request. Please try again.';
        } else if (err.message.includes('Failed to create payment request')) {
          errorMessage = 'Unable to process payment request. Please try again.';
        } else if (err.message.includes('Authentication required')) {
          errorMessage = 'Please log in to make a payment.';
        }
      }
      
      setError(errorMessage);
      
      // Close EventSource on error
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      // Clear timeout on error
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
        setPaymentTimeout(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Close EventSource if it exists
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    // Clear payment timeout if it exists
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }
    
    setMpesaNumber("");
    setPaymentAmount(balanceAmount);
    setError(null);
    setSuccess(false);
    setIsProcessing(false);
    setIsWaitingForPayment(false);
    setIsWaitingForSSE(false);
    setPaymentStatus('');
    onClose();
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
      }
    };
  }, [eventSource, paymentTimeout]);

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
                  <div className="summary-item">
                    <span className="summary-label">Remaining After Payment:</span>
                    <span className="summary-value remaining">{formatPrice(balanceAmount - paymentAmount)}</span>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="payment-instructions">
                  <h3>Payment Instructions</h3>
                  <ol>
                    <li>Enter the amount you want to pay (up to outstanding balance)</li>
                    <li>Enter your M-Pesa number below</li>
                    <li>Click "Request Payment" to initiate the payment</li>
                    <li>You will receive an M-Pesa prompt on your phone</li>
                    <li>Enter your M-Pesa PIN to complete the payment</li>
                  </ol>
                </div>

                {/* Payment Status */}
                {isWaitingForPayment && (
                  <div className="payment-status">
                    <div className="status-content">
                      <div className="status-icon">
                        {paymentStatus.includes('✅') ? (
                          <div className="status-success">✅</div>
                        ) : paymentStatus.includes('❌') ? (
                          <div className="status-error">❌</div>
                        ) : paymentStatus.includes('⏰') ? (
                          <div className="status-timeout">⏰</div>
                        ) : (
                          <div className="status-loading">
                            <div className="payment-spinner"></div>
                          </div>
                        )}
                      </div>
                      <div className="status-text">
                        <h4 className="status-title">{paymentStatus}</h4>
                        <p className="status-message">
                          {paymentStatus.includes('✅') 
                            ? 'Your payment has been processed successfully!'
                            : paymentStatus.includes('❌')
                            ? 'Payment failed. Please try again or contact support.'
                            : paymentStatus.includes('⏰')
                            ? 'Payment request timed out. Please check your phone for M-Pesa prompts or try again.'
                            : 'Please check your phone for the M-Pesa prompt and complete the payment.'
                          }
                        </p>
                        {isWaitingForSSE && (
                          <div className="sse-waiting-indicator">
                            <div className="sse-spinner"></div>
                            <span className="sse-text">Waiting for payment confirmation...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                {!isWaitingForPayment && (
                  <form onSubmit={handleSubmit} className="payment-form">
                    <div className="form-group">
                      <label htmlFor="payment-amount" className="form-label">
                        Payment Amount
                      </label>
                      
                      {/* Quick Amount Buttons */}
                      <div className="quick-amount-buttons">
                        <button
                          type="button"
                          className="quick-amount-btn"
                          onClick={() => handleQuickAmount(0.25)}
                          disabled={isProcessing}
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          className="quick-amount-btn"
                          onClick={() => handleQuickAmount(0.5)}
                          disabled={isProcessing}
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          className="quick-amount-btn"
                          onClick={() => handleQuickAmount(0.75)}
                          disabled={isProcessing}
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          className="quick-amount-btn full"
                          onClick={() => setPaymentAmount(balanceAmount)}
                          disabled={isProcessing}
                        >
                          Full Amount
                        </button>
                      </div>
                      
                      <div className="input-container">
                        <span className="input-prefix">KES</span>
                        <input
                          type="text"
                          id="payment-amount"
                          className="form-input amount-input"
                          placeholder="0"
                          value={paymentAmount ? paymentAmount.toLocaleString() : ''}
                          onChange={handleAmountChange}
                          onBlur={handleAmountBlur}
                          disabled={isProcessing}
                        />
                        <button
                          type="button"
                          className="clear-amount-btn"
                          onClick={() => setPaymentAmount(0)}
                          disabled={isProcessing}
                          title="Clear amount"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      <p className="form-help">
                        Enter amount to pay (maximum: {formatPrice(balanceAmount)}) or use quick buttons above
                      </p>
                    </div>

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
                        <div className="error-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="error-content">
                          <div className="error-title">Payment Error</div>
                          <div className="error-message">{error}</div>
                        </div>
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
                        disabled={isProcessing || !mpesaNumber || !paymentAmount}
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
                            Initiate Payment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Payment Status Actions */}
                {isWaitingForPayment && (
                  <div className="payment-status-actions">
                    {paymentStatus.includes('❌') || paymentStatus.includes('⏰') ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setIsWaitingForPayment(false);
                            setPaymentStatus('');
                            setError(null);
                          }}
                        >
                          Try Again
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={handleClose}
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={handleClose}
                      >
                        Close (Payment in Progress)
                      </button>
                    )}
                  </div>
                )}
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
