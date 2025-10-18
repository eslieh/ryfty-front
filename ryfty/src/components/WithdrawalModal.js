"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initiateWithdrawal } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import config from '@/config';
import '@/styles/wallet.css';

export default function WithdrawalModal({ isOpen, onClose, onSuccess, walletBalance }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [isWaitingForWithdrawal, setIsWaitingForWithdrawal] = useState(false);
  const [isWaitingForSSE, setIsWaitingForSSE] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [withdrawalTimeout, setWithdrawalTimeout] = useState(null);
  const [transactionId, setTransactionId] = useState('');

  // Withdrawal timeout configuration (in milliseconds)
  const WITHDRAWAL_TIMEOUT_DURATION = 300000; // 5 minutes (300 seconds)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(parseFloat(amount));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
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
      
      // Start dedicated EventSource for withdrawal status updates
      const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
      const withdrawalEventSource = new EventSource(`${baseUrl}/events/${user?.id || 'anonymous'}`);
      setEventSource(withdrawalEventSource);

      // Start waiting for withdrawal confirmation
      setIsWaitingForWithdrawal(true);
      setIsWaitingForSSE(true);
      setWithdrawalStatus('Processing withdrawal...');

      // Set up timeout for withdrawal response
      const timeoutId = setTimeout(() => {
        console.log('Withdrawal timeout reached');
        setWithdrawalStatus("⏰ Withdrawal Timeout - Please check your payment method or try again");
        // Close EventSource on timeout
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

        // Clear SSE waiting state when we receive any update
        setIsWaitingForSSE(false);

        // Handle different event types from the backend
        if (data.type === 'generic_event' && data.data?.state === 'pending_confirmation') {
          setWithdrawalStatus("Processing withdrawal...");
        }
        if (data.type === 'generic_event' && data.data?.state === 'success') {
          const transactionId = data.data?.transaction_id || 'N/A';
          setTransactionId(transactionId);
          setWithdrawalStatus("✅ Withdrawal Successful!");
          setIsWaitingForWithdrawal(false);
          setSuccess(true);
          
          // Close EventSource and call success callback with transaction ID
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
          setWithdrawalStatus("❌ Withdrawal Failed!");
          setError(errorMessage);
          setIsWaitingForWithdrawal(false);
          // Don't close EventSource or reset states - let user decide when to close
        }
      };

      withdrawalEventSource.onerror = (error) => {
        console.error('Withdrawal EventSource error:', error);
        setWithdrawalStatus("❌ Connection Error");
        setIsWaitingForWithdrawal(false);
        setIsWaitingForSSE(false);
        // Clear timeout on error
        if (withdrawalTimeout) {
          clearTimeout(withdrawalTimeout);
          setWithdrawalTimeout(null);
        }
        // Don't automatically close - let user decide
      };
      
    } catch (err) {
      console.error('Withdrawal error:', err);
      
      // Extract specific error message from backend
      let errorMessage = 'Withdrawal failed. Please try again.';
      
      if (err.message) {
        // Use the specific error message from backend
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
      
      // Close EventSource on error
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      // Clear timeout on error
      if (withdrawalTimeout) {
        clearTimeout(withdrawalTimeout);
        setWithdrawalTimeout(null);
      }
    } finally {
      setLoading(false);
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
    
    setAmount('');
    setError('');
    setSuccess(false);
    setLoading(false);
    setIsWaitingForWithdrawal(false);
    setIsWaitingForSSE(false);
    setWithdrawalStatus('');
    setTransactionId('');
    onClose();
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
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
            <h2 className="modal-title">Withdraw Funds</h2>
            <button
              className="modal-close"
              onClick={handleClose}
              disabled={loading}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="withdrawal-info">
              <div className="balance-display">
                <span className="balance-label">Available Balance:</span>
                <span className="balance-amount">{formatCurrency(walletBalance)}</span>
              </div>
            </div>

            {/* Withdrawal Status */}
            {isWaitingForWithdrawal && (
              <div className="withdrawal-status">
                <div className="status-content">
                  <div className="status-icon">
                    {withdrawalStatus.includes('✅') ? (
                      <div className="status-success">✅</div>
                    ) : withdrawalStatus.includes('❌') ? (
                      <div className="status-error">❌</div>
                    ) : withdrawalStatus.includes('⏰') ? (
                      <div className="status-timeout">⏰</div>
                    ) : (
                      <div className="status-loading">
                        <div className="withdrawal-spinner"></div>
                      </div>
                    )}
                  </div>
                  <div className="status-text">
                    <h4 className="status-title">{withdrawalStatus}</h4>
                    <p className="status-message">
                      {withdrawalStatus.includes('✅') 
                        ? 'Your withdrawal has been processed successfully!'
                        : withdrawalStatus.includes('❌')
                        ? error || 'Withdrawal failed. Please try again or contact support.'
                        : withdrawalStatus.includes('⏰')
                        ? 'Withdrawal request timed out. Please check your payment method or try again.'
                        : 'Please wait while we process your withdrawal request.'
                      }
                    </p>
                    {isWaitingForSSE && (
                      <div className="sse-waiting-indicator">
                        <div className="sse-spinner"></div>
                        <span className="sse-text">Waiting for withdrawal confirmation...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!success ? (
              <>
                {/* Withdrawal Form */}
                {!isWaitingForWithdrawal && (
                  <form onSubmit={handleSubmit} className="withdrawal-form">
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
                          placeholder="0.00"
                          className={`form-input amount-input ${error ? 'error' : ''}`}
                          disabled={loading}
                        />
                      </div>
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
                        disabled={loading || !amount || parseFloat(amount) <= 0}
                      >
                        {loading ? (
                          <>
                            <div className="spinner small"></div>
                            Processing...
                          </>
                        ) : (
                          'Withdraw'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Error Display for Failed Withdrawals */}
                {withdrawalStatus.includes('❌') && error && (
                  <div className="withdrawal-error-display">
                    <div className="error-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="error-content">
                      <div className="error-title">Withdrawal Error</div>
                      <div className="error-message">{error}</div>
                    </div>
                  </div>
                )}

                {/* Withdrawal Status Actions */}
                {isWaitingForWithdrawal && (
                  <div className="withdrawal-status-actions">
                    {withdrawalStatus.includes('❌') || withdrawalStatus.includes('⏰') ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setIsWaitingForWithdrawal(false);
                            setWithdrawalStatus('');
                            setError('');
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
                        Close (Withdrawal in Progress)
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Success State */
              <div className="withdrawal-success">
                <div className="success-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="success-title">Withdrawal Request Sent!</h3>
                <p className="success-message">
                  Your withdrawal request has been submitted and is being processed.
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
