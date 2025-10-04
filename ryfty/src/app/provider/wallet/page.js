"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchWalletData, deletePaymentMethod } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/wallet.css';
import PaymentMethodModal from '@/components/PaymentMethodModal';

export default function ProviderWallet() {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (!isAuthenticated || !isProvider()) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, isProvider, router]);

  // Fetch wallet data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchWalletData();
        setWalletData(response);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError(err.message || 'Failed to fetch wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isProvider]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddPaymentMethod = () => {
    setEditingMethod(null);
    setIsModalOpen(true);
  };

  const handleEditPaymentMethod = (method) => {
    setEditingMethod(method);
    setIsModalOpen(true);
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      await deletePaymentMethod(methodId);
      // Refresh wallet data
      const response = await fetchWalletData();
      setWalletData(response);
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Failed to delete payment method');
    }
  };

  const handleModalSuccess = async () => {
    // Refresh wallet data after successful add/edit
    try {
      const response = await fetchWalletData();
      setWalletData(response);
    } catch (err) {
      console.error('Error refreshing wallet data:', err);
    }
  };

  const SettlementCard = ({ settlement }) => (
    <motion.div
      className="settlement-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="settlement-header">
        <div className="settlement-amount">{formatCurrency(settlement.amount)}</div>
        <div className="settlement-date">{formatDate(settlement.date_done)}</div>
      </div>
      
      <div className="settlement-details">
        <div className="settlement-detail">
          <span className="detail-label">Transaction ID:</span>
          <span className="detail-value">{settlement.txn_id}</span>
        </div>
        <div className="settlement-detail">
          <span className="detail-label">Checkout ID:</span>
          <span className="detail-value">{settlement.checkout_id}</span>
        </div>
        <div className="settlement-detail">
          <span className="detail-label">Service Fee:</span>
          <span className="detail-value">{formatCurrency(settlement.service_fee)}</span>
        </div>
        <div className="settlement-detail">
          <span className="detail-label">Platform:</span>
          <span className="detail-value">{settlement.platform ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </motion.div>
  );

  const RefundCard = ({ refund }) => (
    <motion.div
      className="refund-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="refund-header">
        <div className={`refund-status refund-status-${refund.status}`}>
          {refund.status}
        </div>
        <div className="refund-amount">
          {refund.approved_amount && refund.approved_amount !== 'None' 
            ? formatCurrency(refund.approved_amount)
            : 'Amount TBD'
          }
        </div>
      </div>
      
      <div className="refund-details">
        <div className="refund-reason">
          <span className="detail-label">Reason:</span>
          <span className="detail-value">{refund.reason}</span>
        </div>
        <div className="refund-processed">
          <span className="detail-label">Processed:</span>
          <span className="detail-value">
            {refund.processed_at ? formatDate(refund.processed_at) : 'Pending'}
          </span>
        </div>
      </div>
    </motion.div>
  );

  const PaymentMethodCard = ({ paymentMethod }) => (
    <motion.div
      className="payment-method-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="payment-method-header">
        <div className="payment-method-type">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17H21V21H3V17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="method-name">{paymentMethod.default_method.toUpperCase()}</span>
        </div>
        <div className="payment-method-status">Default</div>
      </div>
      
      <div className="payment-method-details">
        {/* M-Pesa method - only show M-Pesa number */}
        {paymentMethod.default_method === 'mpesa' && paymentMethod.mpesa_number && (
          <div className="payment-detail">
            <span className="detail-label">M-Pesa Number:</span>
            <span className="detail-value">{paymentMethod.mpesa_number}</span>
          </div>
        )}
        
        {/* Paybill method - show paybill and account number */}
        {paymentMethod.default_method === 'paybill' && (
          <>
            {paymentMethod.paybill && (
              <div className="payment-detail">
                <span className="detail-label">Paybill:</span>
                <span className="detail-value">{paymentMethod.paybill}</span>
              </div>
            )}
            {paymentMethod.account_no && (
              <div className="payment-detail">
                <span className="detail-label">Account Number:</span>
                <span className="detail-value">{paymentMethod.account_no}</span>
              </div>
            )}
          </>
        )}
        
        {/* Bank method - show bank account number and bank ID */}
        {paymentMethod.default_method === 'bank' && (
          <>
            {paymentMethod.bank_account_number && (
              <div className="payment-detail">
                <span className="detail-label">Bank Account:</span>
                <span className="detail-value">{paymentMethod.bank_account_number}</span>
              </div>
            )}
            {paymentMethod.bank_id && (
              <div className="payment-detail">
                <span className="detail-label">Bank ID:</span>
                <span className="detail-value">{paymentMethod.bank_id}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="payment-method-actions">
        <button
          className="action-btn edit"
          onClick={() => handleEditPaymentMethod(paymentMethod)}
          title="Edit payment method"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="action-btn delete"
          onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
          title="Delete payment method"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </motion.div>
  );

  if (!isAuthenticated || !isProvider()) {
    return (
      <div className="provider-loading">
        <div className="spinner large"></div>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation
            className="provider-left-nav"
            orientation="vertical"
          />
          <div className="provider-main-content">
            <div className="wallet-loading">
              <div className="spinner large"></div>
              <p>Loading wallet...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation
            className="provider-left-nav"
            orientation="vertical"
          />
          <div className="provider-main-content">
            <div className="error-state">
              <div className="error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="error-title">Failed to Load Wallet</h3>
              <p className="error-description">{error}</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
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
            <div className="wallet-header">
              <h1 className="page-title">Wallet & Payments</h1>
              <p className="page-subtitle">
                Manage your earnings and payment settings
              </p>
            </div>

            {/* Balance Card */}
            <motion.div
              className="balance-cards wallet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="balance-content">
                <div className="balance-label">Available Balance</div>
                <div className="balance-amounts">{formatCurrency(walletData.wallet.balance)}</div>
                <div className="balance-updated">
                  Last updated: {formatDate(walletData.wallet.updated_at)}
                </div>
              </div>
              <button className="withdraw-button">
                Withdraw
              </button>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              className="wallet-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="section-header">
                <h2 className="section-title">Payment Methods</h2>
                {walletData.payment_methods.length === 0 && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleAddPaymentMethod}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add Method
                  </button>
                )}
              </div>
              
              <div className="payment-methods-grid">
                {walletData.payment_methods.length > 0 ? (
                  walletData.payment_methods.map((method) => (
                    <PaymentMethodCard key={method.id} paymentMethod={method} />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17H21V21H3V17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="empty-title">No payment method added</h3>
                    <p className="empty-description">
                      Add a payment method to receive your earnings.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Settlements */}
            <motion.div
              className="wallet-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="section-header">
                <h2 className="section-title">Recent Settlements</h2>
                <button className="btn btn-secondary btn-sm">
                  View All
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div className="settlements-list">
                {walletData.settlements.length > 0 ? (
                  walletData.settlements.map((settlement) => (
                    <SettlementCard key={settlement.id} settlement={settlement} />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="empty-title">No settlements yet</h3>
                    <p className="empty-description">
                      Your settlements will appear here once you start earning.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Refunds */}
            <motion.div
              className="wallet-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="section-header">
                <h2 className="section-title">Refund Requests</h2>
                <button className="btn btn-secondary btn-sm">
                  View All
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div className="refunds-list">
                {walletData.refunds.length > 0 ? (
                  walletData.refunds.map((refund) => (
                    <RefundCard key={refund.id} refund={refund} />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="empty-title">No refund requests</h3>
                    <p className="empty-description">
                      Refund requests will appear here when customers request them.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.main>
      </div>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editingMethod={editingMethod}
      />
    </div>
  );
}