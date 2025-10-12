"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initiateWithdrawal } from '@/utils/api';
import '@/styles/wallet.css';

export default function WithdrawalModal({ isOpen, onClose, onSuccess, walletBalance }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      // Reset form
      setAmount('');
      setError('');
      
      // Call success callback with response data
      onSuccess(response);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err.message || 'Failed to initiate withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError('');
      onClose();
    }
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
