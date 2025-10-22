"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initiateWithdrawal, verifyWithdrawal } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import config from '@/config';
import '@/styles/wallet.css';

export default function WithdrawalModal({ isOpen, onClose, onSuccess, walletBalance, walletData }) {
  const { user } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState('amount'); // 'amount', 'verify', 'success'
  
  // Amount step state
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Verification step state
  const [verificationCode, setVerificationCode] = useState('');
  const [disbursementId, setDisbursementId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  
  // Success state
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  
  // EventSource for real-time updates
  const [eventSource, setEventSource] = useState(null);
  const [withdrawalTimeout, setWithdrawalTimeout] = useState(null);

  // Withdrawal timeout configuration (in milliseconds)
  const WITHDRAWAL_TIMEOUT_DURATION = 300000; // 5 minutes (300 seconds)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(parseFloat(amount));
  };

  // Helper function to format payment method destination
  const getPaymentMethodDestination = () => {
    if (!walletData?.payment_methods || walletData.payment_methods.length === 0) {
      return null;
    }

    const defaultMethod = walletData.payment_methods[0]; // Assuming first is default
    
    switch (defaultMethod.default_method) {
      case 'mpesa':
        return {
          type: 'M-Pesa',
          destination: defaultMethod.mpesa_number,
          icon: '📱'
        };
      case 'paybill':
        return {
          type: 'Paybill',
          destination: `${defaultMethod.paybill} (Account: ${defaultMethod.account_no})`,
          icon: '🏦'
        };
      case 'bank':
        return {
          type: 'Bank Account',
          destination: `${defaultMethod.bank_account_number} (Bank ID: ${defaultMethod.bank_id})`,
          icon: '🏛️'
        };
      default:
        return {
          type: 'Payment Method',
          destination: 'Not specified',
          icon: '💳'
        };
    }
  };

  // Step 1: Initiate withdrawal and send email code
  const handleInitiateWithdrawal = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 10) {
      setError('Minimum withdrawal amount is KES 10');
      return;
    }

    if (parseFloat(amount) > parseFloat(walletBalance)) {
      setError('Amount exceeds available balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await initiateWithdrawal(parseFloat(amount));
      console.log('Withdrawal initiated successfully:', response);
      
      // Store disbursement ID and move to verification step
      setDisbursementId(response.disbursement_id);
      setCurrentStep('verify');
      
    } catch (err) {
      console.error('Withdrawal initiation error:', err);
      
      // Extract specific error message from backend
      let errorMessage = 'Withdrawal failed. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
        
        // Handle specific error cases with user-friendly messages
        if (err.message.includes('Wallet not found')) {
          errorMessage = 'Wallet not found. Please refresh the page and try again.';
        } else if (err.message.includes('Insufficient balance')) {
          errorMessage = 'Insufficient balance for withdrawal.';
        } else if (err.message.includes('Invalid withdrawal request')) {
          errorMessage = 'Invalid withdrawal request. Please try again.';
        } else if (err.message.includes('Authentication required')) {
          errorMessage = 'Please log in to make a withdrawal.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify withdrawal with email code
  const handleVerifyWithdrawal = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      const response = await verifyWithdrawal(disbursementId, verificationCode);
      console.log('Withdrawal verified successfully:', response);
      
      // Set waiting state for SSE confirmation
      setIsWaitingForConfirmation(true);
      
      // Start EventSource for real-time updates
      const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
      const withdrawalEventSource = new EventSource(`${baseUrl}/events/${user?.id || 'anonymous'}`);
      setEventSource(withdrawalEventSource);

      // Set up timeout for withdrawal response
      const timeoutId = setTimeout(() => {
        console.log('Withdrawal timeout reached');
        setIsWaitingForConfirmation(false);
        setVerificationError("⏰ Withdrawal Timeout - Please check your payment method or try again");
        if (withdrawalEventSource) {
          withdrawalEventSource.close();
          setEventSource(null);
        }
      }, WITHDRAWAL_TIMEOUT_DURATION);
      
      setWithdrawalTimeout(timeoutId);

      // Set up EventSource for withdrawal status updates
      withdrawalEventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("Withdrawal event:", data);

        // Clear timeout when we receive any withdrawal status update
        if (withdrawalTimeout) {
          clearTimeout(withdrawalTimeout);
          setWithdrawalTimeout(null);
        }

        // Handle different event types from the backend
        if (data.type === 'generic_event' && data.data?.state === 'pending_confirmation') {
          // Keep showing waiting state while processing
          setIsWaitingForConfirmation(true);
        }
        if (data.type === 'generic_event' && data.data?.state === 'success') {
          const transactionId = data.data?.transaction_id || 'N/A';
          setTransactionId(transactionId);
          setIsWaitingForConfirmation(false);
          setCurrentStep('success');
          setSuccess(true);
          
          // Close EventSource and call success callback
          withdrawalEventSource.close();
          setEventSource(null);
          
          setTimeout(() => {
            onSuccess({
              ...response,
              transaction_id: transactionId,
              amount: parseFloat(amount)
            });
            handleClose();
          }, 2000);
        }
        if (data.type === 'generic_event' && data.data?.state === 'failed') {
          const errorMessage = data.data?.description || 'Unknown error occurred';
          setIsWaitingForConfirmation(false);
          setVerificationError(`❌ Withdrawal Failed: ${errorMessage}`);
          // Don't close EventSource - let user decide when to close
        }
      };

      withdrawalEventSource.onerror = (error) => {
        console.error('Withdrawal EventSource error:', error);
        setIsWaitingForConfirmation(false);
        setVerificationError("❌ Connection Error");
        // Clear timeout on error
        if (withdrawalTimeout) {
          clearTimeout(withdrawalTimeout);
          setWithdrawalTimeout(null);
        }
      };
      
    } catch (err) {
      console.error('Withdrawal verification error:', err);
      
      let errorMessage = 'Verification failed. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
        
        // Handle specific error cases
        if (err.message.includes('Invalid disbursement or token')) {
          errorMessage = 'Invalid verification code. Please check your email and try again.';
        } else if (err.message.includes('Disbursement not found')) {
          errorMessage = 'Withdrawal request not found. Please start over.';
        } else if (err.message.includes('already processed')) {
          errorMessage = 'This withdrawal has already been processed.';
        }
      }
      
      setVerificationError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    // Close EventSource if it exists
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    // Clear withdrawal timeout if it exists
    if (withdrawalTimeout) {
      clearTimeout(withdrawalTimeout);
      setWithdrawalTimeout(null);
    }
    
    // Reset all state
    setCurrentStep('amount');
    setAmount('');
    setError('');
    setVerificationCode('');
    setDisbursementId('');
    setVerificationError('');
    setSuccess(false);
    setLoading(false);
    setIsVerifying(false);
    setIsWaitingForConfirmation(false);
    setTransactionId('');
    onClose();
  };

  const handleBackToAmount = () => {
    setCurrentStep('amount');
    setVerificationCode('');
    setVerificationError('');
    setDisbursementId('');
    setIsWaitingForConfirmation(false);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleVerificationCodeChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 6 digits
    if (/^\d*$/.test(value) && value.length <= 6) {
      setVerificationCode(value);
      setVerificationError('');
    }
  };

  const setQuickAmount = (percentage) => {
    const quickAmount = (parseFloat(walletBalance) * percentage / 100).toFixed(2);
    setAmount(quickAmount);
    setError('');
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (withdrawalTimeout) {
        clearTimeout(withdrawalTimeout);
      }
    };
  }, [eventSource, withdrawalTimeout]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="modal-content withdrawal-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title">
              {currentStep === 'amount' && 'Withdraw Funds'}
              {currentStep === 'verify' && 'Verify Withdrawal'}
              {currentStep === 'success' && 'Withdrawal Successful'}
            </h2>
            <button
              className="modal-close"
              onClick={handleClose}
              disabled={loading || isVerifying}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            {/* Step 1: Amount Input */}
            {currentStep === 'amount' && (
              <>
            <div className="withdrawal-info">
              <div className="balance-display">
                <span className="balance-label">Available Balance:</span>
                <span className="balance-amount">{formatCurrency(walletBalance)}</span>
            </div>

                  {/* Payment Method Destination */}
                  {getPaymentMethodDestination() && (
                    <div className="payment-destination">
                      <div className="destination-header">
                        <span className="destination-icon">{getPaymentMethodDestination().icon}</span>
                        <span className="destination-label">Money will be sent to:</span>
                      </div>
                      <div className="destination-details">
                        <div className="destination-type">{getPaymentMethodDestination().type}</div>
                        <div className="destination-value">{getPaymentMethodDestination().destination}</div>
                      </div>
                      </div>
                    )}
                  
                  {!getPaymentMethodDestination() && (
                    <div className="no-payment-method-warning">
                      <div className="warning-icon">⚠️</div>
                      <div className="warning-text">
                        <strong>No payment method set!</strong>
                        <p>Please add a payment method before withdrawing funds.</p>
                </div>
              </div>
            )}
                </div>

                <form onSubmit={handleInitiateWithdrawal} className="withdrawal-form">
                    <div className="form-group">
                      <label htmlFor="amount" className="form-label">
                        Withdrawal Amount
                      </label>
                      <div className="amount-input-container">
                        <span className="currency-symbol">KES</span>
                        <input
                          type="text"
                          id="amount"
                          value={amount}
                          onChange={handleAmountChange}
                        placeholder="10.00"
                          className={`form-input amount-input ${error ? 'error' : ''}`}
                          disabled={loading}
                        />
                      </div>
                    <div className="form-help">Minimum withdrawal amount is KES 10</div>
                      {error && <div className="form-error">{error}</div>}
                    </div>

                    <div className="quick-amounts">
                      <span className="quick-amount-label">Quick amounts:</span>
                      <div className="quick-amount-buttons">
                        <button
                          type="button"
                          className="quick-amount-btn"
                          onClick={() => setQuickAmount(25)}
                          disabled={loading}
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          className="quick-amount-btn"
                          onClick={() => setQuickAmount(50)}
                          disabled={loading}
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          className="quick-amount-btn"
                          onClick={() => setQuickAmount(75)}
                          disabled={loading}
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          className="quick-amount-btn"
                          onClick={() => setQuickAmount(100)}
                          disabled={loading}
                        >
                          All
                        </button>
                      </div>
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      disabled={loading || !amount || parseFloat(amount) < 10 || !getPaymentMethodDestination()}
                    >
                      {loading ? (
                        <>
                          <div className="spinner small"></div>
                          Sending Code...
                        </>
                      ) : (
                        'Send Verification Code'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 2: Verification Code Input */}
            {currentStep === 'verify' && (
              <>
                <div className="verification-info">
                  <div className="verification-icon">
                    {isWaitingForConfirmation ? (
                      <div className="verification-spinner">
                        <div className="spinner large"></div>
                      </div>
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="verification-title">
                    {isWaitingForConfirmation ? 'Processing Withdrawal...' : 'Check Your Email'}
                  </h3>
                  <p className="verification-message">
                    {isWaitingForConfirmation 
                      ? 'Your withdrawal is being processed. Please wait for confirmation...'
                      : 'We\'ve sent a 6-digit verification code to your email address. Please enter the code below to complete your withdrawal.'
                    }
                  </p>
                  <div className="withdrawal-details">
                    <div className="detail-item">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                </div>

                {!isWaitingForConfirmation && (
                  <form onSubmit={handleVerifyWithdrawal} className="verification-form">
                    <div className="form-group">
                      <label htmlFor="verificationCode" className="form-label">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="verificationCode"
                        value={verificationCode}
                        onChange={handleVerificationCodeChange}
                        placeholder="123456"
                        className={`form-input verification-input ${verificationError ? 'error' : ''}`}
                        disabled={isVerifying}
                        maxLength="6"
                        autoComplete="one-time-code"
                      />
                      {verificationError && <div className="form-error">{verificationError}</div>}
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleBackToAmount}
                        disabled={isVerifying}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isVerifying || verificationCode.length !== 6}
                      >
                        {isVerifying ? (
                          <>
                            <div className="spinner small"></div>
                            Verifying...
                          </>
                        ) : (
                          'Verify & Withdraw'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {isWaitingForConfirmation && (
                  <div className="verification-form">
                    <div className="waiting-for-confirmation">
                      <div className="waiting-spinner">
                        <div className="spinner large"></div>
                    </div>
                      <h4 className="waiting-title">Processing Your Withdrawal</h4>
                      <p className="waiting-message">
                        Please wait while we process your withdrawal request. This may take a few moments.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Success */}
            {currentStep === 'success' && (
              <div className="withdrawal-success">
                <div className="success-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="success-title">Withdrawal Successful!</h3>
                <p className="success-message">
                  Your withdrawal has been processed successfully and funds will be transferred to your payment method.
                </p>
                <div className="success-details">
                  <div className="detail-item">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{formatCurrency(amount)}</span>
                  </div>
                  {transactionId && transactionId !== 'N/A' && (
                    <div className="detail-item">
                      <span className="detail-label">Transaction ID:</span>
                      <span className="detail-value">{transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
