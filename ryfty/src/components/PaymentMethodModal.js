"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPaymentMethod, updatePaymentMethod } from '@/utils/api';

// Bank data with paybill numbers
const BANK_DATA = [
  {"bank_name": "Equity Bank", "paybill_number": "247247"},
  {"bank_name": "Co-operative Bank", "paybill_number": "400200"},
  {"bank_name": "Standard Chartered Bank", "paybill_number": "329329"},
  {"bank_name": "Absa Bank", "paybill_number": "303030"},
  {"bank_name": "Family Bank", "paybill_number": "222111"},
  {"bank_name": "I&M Bank", "paybill_number": "542542"},
  {"bank_name": "National Bank", "paybill_number": "547700"},
  {"bank_name": "Diamond Trust Bank", "paybill_number": "516600"},
  {"bank_name": "Ecobank", "paybill_number": "700201"},
  {"bank_name": "Jamii Bora Bank", "paybill_number": "529901"},
  {"bank_name": "Bank of Africa", "paybill_number": "972900"},
  {"bank_name": "UBA Bank", "paybill_number": "559900"},
  {"bank_name": "Prime Bank", "paybill_number": "982800"},
  {"bank_name": "Guaranty Trust Bank", "paybill_number": "910200"},
  {"bank_name": "Gulf African Bank", "paybill_number": "985050"},
  {"bank_name": "Housing Finance Company", "paybill_number": "100400"},
  {"bank_name": "Consolidated Bank", "paybill_number": "508400"},
  {"bank_name": "Credit Bank", "paybill_number": "972700"},
  {"bank_name": "Equatorial Commercial Bank", "paybill_number": "498100"},
  {"bank_name": "Sidian Bank", "paybill_number": "111999"}
];

const PaymentMethodModal = ({ isOpen, onClose, onSuccess, editingMethod = null }) => {
  const [methodType, setMethodType] = useState('mpesa');
  const [formData, setFormData] = useState({
    mpesa_number: '',
    paybill: '',
    account_no: '',
    bank_id: '',
    bank_account_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when editing
  useEffect(() => {
    if (editingMethod) {
      setMethodType(editingMethod.default_method);
      setFormData({
        mpesa_number: editingMethod.mpesa_number || '',
        paybill: editingMethod.paybill || '',
        account_no: editingMethod.account_no || '',
        bank_id: editingMethod.bank_id || '',
        bank_account_number: editingMethod.bank_account_number || ''
      });
    } else {
      // Reset form for new payment method
      setMethodType('mpesa');
      setFormData({
        mpesa_number: '',
        paybill: '',
        account_no: '',
        bank_id: '',
        bank_account_number: ''
      });
    }
    setError('');
  }, [editingMethod, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateForm = () => {
    switch (methodType) {
      case 'mpesa':
        if (!formData.mpesa_number.trim()) {
          setError('M-Pesa number is required');
          return false;
        }
        if (!/^0[0-9]{9}$/.test(formData.mpesa_number)) {
          setError('Please enter a valid M-Pesa number (10 digits starting with 0)');
          return false;
        }
        break;
      case 'paybill':
        if (!formData.paybill.trim()) {
          setError('Paybill number is required');
          return false;
        }
        if (!formData.account_no.trim()) {
          setError('Account number is required');
          return false;
        }
        break;
      case 'bank':
        if (!formData.bank_id) {
          setError('Please select a bank');
          return false;
        }
        if (!formData.bank_account_number.trim()) {
          setError('Bank account number is required');
          return false;
        }
        break;
      default:
        setError('Please select a payment method type');
        return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        default_method: methodType
      };

      // Add method-specific fields
      switch (methodType) {
        case 'mpesa':
          payload.mpesa_number = formData.mpesa_number;
          break;
        case 'paybill':
          payload.paybill = formData.paybill;
          payload.account_no = formData.account_no;
          break;
        case 'bank':
          payload.bank_id = parseInt(formData.bank_id);
          payload.bank_account_number = formData.bank_account_number;
          break;
      }

      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, payload);
      } else {
        await createPaymentMethod(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving payment method:', err);
      setError(err.message || 'Failed to save payment method');
    } finally {
      setLoading(false);
    }
  };

  const getBankName = (bankId) => {
    const bank = BANK_DATA.find(b => b.paybill_number === bankId);
    return bank ? bank.bank_name : '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content payment-method-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h2>
            <button 
              className="modal-close"
              onClick={onClose}
              disabled={loading}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="payment-method-form">
            {/* Method Type Selection */}
            <div className="form-group">
              <label className="form-label">Payment Method Type</label>
              <div className="method-type-selector">
                <button
                  type="button"
                  className={`method-type-btn ${methodType === 'mpesa' ? 'active' : ''}`}
                  onClick={() => setMethodType('mpesa')}
                  disabled={loading}
                >
                  <div className="method-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>M-Pesa</span>
                </button>
                
                <button
                  type="button"
                  className={`method-type-btn ${methodType === 'paybill' ? 'active' : ''}`}
                  onClick={() => setMethodType('paybill')}
                  disabled={loading}
                >
                  <div className="method-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H21V21H3V17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Paybill</span>
                </button>
                
                <button
                  type="button"
                  className={`method-type-btn ${methodType === 'bank' ? 'active' : ''}`}
                  onClick={() => setMethodType('bank')}
                  disabled={loading}
                >
                  <div className="method-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 21H21V19H3V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 7H21V5H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 11H21V9H3V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 15H21V13H3V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Bank Account</span>
                </button>
              </div>
            </div>

            {/* M-Pesa Form */}
            {methodType === 'mpesa' && (
              <div className="form-group">
                <label htmlFor="mpesa_number" className="form-label">
                  M-Pesa Number
                </label>
                <input
                  type="tel"
                  id="mpesa_number"
                  className="form-input"
                  placeholder="0712345678"
                  value={formData.mpesa_number}
                  onChange={(e) => handleInputChange('mpesa_number', e.target.value)}
                  disabled={loading}
                  maxLength="10"
                />
                <div className="form-help">
                  Enter your 10-digit M-Pesa number starting with 0
                </div>
              </div>
            )}

            {/* Paybill Form */}
            {methodType === 'paybill' && (
              <>
                <div className="form-group">
                  <label htmlFor="paybill" className="form-label">
                    Paybill Number
                  </label>
                  <input
                    type="text"
                    id="paybill"
                    className="form-input"
                    placeholder="123456"
                    value={formData.paybill}
                    onChange={(e) => handleInputChange('paybill', e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="account_no" className="form-label">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="account_no"
                    className="form-input"
                    placeholder="9876543210"
                    value={formData.account_no}
                    onChange={(e) => handleInputChange('account_no', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Bank Account Form */}
            {methodType === 'bank' && (
              <>
                <div className="form-group">
                  <label htmlFor="bank_id" className="form-label">
                    Bank
                  </label>
                  <select
                    id="bank_id"
                    className="form-select"
                    value={formData.bank_id}
                    onChange={(e) => handleInputChange('bank_id', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a bank</option>
                    {BANK_DATA.map((bank, index) => (
                      <option key={index} value={bank.paybill_number}>
                        {bank.bank_name} ({bank.paybill_number})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="bank_account_number" className="form-label">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    id="bank_account_number"
                    className="form-input"
                    placeholder="00123456789"
                    value={formData.bank_account_number}
                    onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="form-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner small"></div>
                    {editingMethod ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingMethod ? 'Update Method' : 'Add Method'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentMethodModal;
