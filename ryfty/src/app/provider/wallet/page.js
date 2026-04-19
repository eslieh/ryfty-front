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
import WithdrawalModal from '@/components/WithdrawalModal';
import config from '@/config';
import { AnimatePresence } from 'framer-motion';
// Helper function to get the correct API base URL
const getApiBaseUrl = () => {
  return config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
};

/**
 * Provider Wallet Page Component
 * 
 * Features:
 * - Display wallet balance and payment methods
 * - Initiate withdrawals with real-time status updates
 * - EventSource connection for live withdrawal status updates
 * - Handle withdrawal API responses and errors
 * - Manage payment methods (add, edit, delete)
 * 
 * Withdrawal Flow:
 * 1. User clicks "Withdraw" button
 * 2. WithdrawalModal opens for amount input
 * 3. API call to /api/payment/initiate
 * 4. EventSource listens for status updates
 * 5. Real-time UI updates based on withdrawal status
 */
export default function ProviderWallet() {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [eventSourceStatus, setEventSourceStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected'
  // Pagination state
  const [settlementPage, setSettlementPage] = useState(1);
  const [settlementPerPage, setSettlementPerPage] = useState(5);
  const [refundPage, setRefundPage] = useState(1);
  const [refundPerPage, setRefundPerPage] = useState(5);
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
 

  // Fetch wallet data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchWalletData({
          settlementPage,
          settlementPerPage,
          refundPage,
          refundPerPage,
        });
        setWalletData(response);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError(err.message || 'Failed to fetch wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isProvider, settlementPage, settlementPerPage, refundPage, refundPerPage]);

  // Set up EventSource for real-time withdrawal updates
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const setupEventSource = () => {
      try {
        const eventSourceUrl = `${getApiBaseUrl()}/events/${user.id}`;
        const es = new EventSource(eventSourceUrl);
        
        es.onopen = () => {
          console.log('EventSource connected for withdrawal updates');
          setEventSourceStatus('connected');
        };

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received event:', data);

            // Handle withdrawal-related events
            if (data.state === 'pending_confirmation' || data.state === 'success' || data.state === 'failed') {
              setWithdrawalStatus(data);
              
              // Refresh wallet data on successful/failed withdrawal
              if (data.state === 'success' || data.state === 'failed') {
                fetchWalletData({
                  settlementPage,
                  settlementPerPage,
                  refundPage,
                  refundPerPage,
                }).then(setWalletData).catch(console.error);
              }
            }
          } catch (err) {
            console.error('Error parsing event data:', err);
          }
        };

        es.onerror = (error) => {
          console.error('EventSource error:', error);
          setEventSourceStatus('disconnected');
          // Only reconnect if the connection was closed
          if (es.readyState === EventSource.CLOSED) {
            console.log('EventSource connection closed, attempting to reconnect...');
            setTimeout(() => {
              setEventSourceStatus('connecting');
              setupEventSource();
            }, 5000);
          }
        };

        setEventSource(es);
      } catch (err) {
        console.error('Error setting up EventSource:', err);
      }
    };

    setupEventSource();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (eventSource) {
        console.log('Closing EventSource connection');
        eventSource.close();
        setEventSource(null);
        setEventSourceStatus('disconnected');
      }
    };
  }, [isAuthenticated, user?.id, settlementPage, settlementPerPage, refundPage, refundPerPage]);

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

  const formatTimelineDate = (dateString) => {
    if (!dateString) return { day: '?', dateNumber: '?' };
    const d = new Date(dateString);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNumber: d.getDate()
    };
  };

  const groupSettlementsByDate = (items) => {
    if (!items) return {};
    return items.reduce((groups, item) => {
      const date = new Date(item.date_done).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});
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
      const response = await fetchWalletData({
        settlementPage,
        settlementPerPage,
        refundPage,
        refundPerPage,
      });
      setWalletData(response);
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Failed to delete payment method');
    }
  };

  const handleModalSuccess = async () => {
    // Refresh wallet data after successful add/edit
    try {
      const response = await fetchWalletData({
        settlementPage,
        settlementPerPage,
        refundPage,
        refundPerPage,
      });
      setWalletData(response);
    } catch (err) {
      console.error('Error refreshing wallet data:', err);
    }
  };

  const handleWithdrawClick = () => {
    setIsWithdrawalModalOpen(true);
  };

  const handleWithdrawalSuccess = async (response) => {
    console.log('Withdrawal completed successfully:', response);
    
    // Update withdrawal status
    setWithdrawalStatus({
      type: 'disbursment.success',
      data: response
    });

    // Decrease the wallet balance by the withdrawn amount
    if (response.amount && walletData?.wallet?.balance) {
      const newBalance = parseFloat(walletData.wallet.balance) - parseFloat(response.amount);
      setWalletData(prevData => ({
        ...prevData,
        wallet: {
          ...prevData.wallet,
          balance: newBalance.toString()
        }
      }));
    }

    // Refresh wallet data to get the latest information
    try {
      const updatedWalletData = await fetchWalletData({
        settlementPage,
        settlementPerPage,
        refundPage,
        refundPerPage,
      });
      setWalletData(updatedWalletData);
    } catch (err) {
      console.error('Error refreshing wallet data after withdrawal:', err);
    }
  };

  const handleWithdrawalModalClose = () => {
    setIsWithdrawalModalOpen(false);
  };

  const SettlementItem = ({ settlement }) => (
    <motion.div 
      className="timeline-card-content"
      whileHover={{ x: 5 }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="settlement-icon-wrapper">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v10M17 7l-5 5-5-5M4 20h16" />
        </svg>
      </div>
      <div className="settlement-info">
        <div className="settlement-main-row">
          <div className="settlement-amount">{formatCurrency(settlement.amount)}</div>
          <div className="settlement-meta">
            <span className="settlement-time">
              {new Date(settlement.date_done).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="settlement-status-pill">Success</div>
          </div>
        </div>
        <div className="settlement-secondary-row">
          <span className="txn-id">Withdrawal • {settlement.txn_id}</span>
        </div>
      </div>
    </motion.div>
  );

  const SettlementGroup = ({ date, items }) => {
    const { day, dateNumber } = formatTimelineDate(items[0].date_done);
    return (
      <div className="timeline-item-group">
        <div className="timeline-marker">
          <div className="day-text">{day}</div>
          <div className="date-bubble">{dateNumber}</div>
          <div className="timeline-line"></div>
        </div>
        <div className="timeline-cards-stack">
          {items.map(item => (
            <SettlementItem key={item.id} settlement={item} />
          ))}
        </div>
      </div>
    );
  };

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

  const getPaymentMethodType = (pm) => {
    if (pm.bank_account_number || pm.bank_id) return 'Bank';
    if (pm.paybill || pm.account_no) return 'Paybill';
    if (pm.till_number) return 'Till';
    if (pm.mpesa_number) return 'M-Pesa';
    return 'Payment Method';
  };

  const PaymentMethodCard = ({ paymentMethod, index }) => {
    const isPrimary = index === 0; // Assuming the first one is the primary payout method
    
    return (
      <motion.div
        className={`payment-method-card ${isPrimary ? 'is-active' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="payment-method-header">
          <div className="payment-method-type">
            <div className="type-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h22" />
              </svg>
            </div>
            <span className="method-name">{getPaymentMethodType(paymentMethod)}</span>
          </div>
          {isPrimary && (
            <div className="payment-method-status primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17L4 12" />
              </svg>
              <span>Primary</span>
            </div>
          )}
        </div>
      
      <div className="payment-method-details">
        {paymentMethod.mpesa_number && (
          <div className="payment-detail">
            <span className="detail-label">M-Pesa Number:</span>
            <span className="detail-value">{paymentMethod.mpesa_number}</span>
          </div>
        )}
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
        {paymentMethod.till_number && (
          <div className="payment-detail">
            <span className="detail-label">Till Number:</span>
            <span className="detail-value">{paymentMethod.till_number}</span>
          </div>
        )}
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
  };

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
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="error-state glass-card">
              <div className="error-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Unable to load wallet</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const QuickActionCard = ({ title, subtitle, icon, onClick }) => (
    <motion.div 
      className="quick-action-card"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <div className="quick-action-icon">{icon}</div>
      <div className="quick-action-info">
        <div className="quick-action-title">{title}</div>
        <div className="quick-action-subtitle">{subtitle}</div>
      </div>
      <div className="quick-action-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );

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
            {/* Header & Balance */}
            <div className="wallet-header">
              <h1 className="page-title">Your Balance</h1>
              <motion.div 
                className="balance-amounts"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                {formatCurrency(walletData.wallet.balance)}
              </motion.div>
              
              <div className="event-source-status">
                <div className={`status-indicator ${eventSourceStatus}`}>
                  <span className="status-text">
                    {eventSourceStatus === 'connecting' && 'Syncing...'}
                    {eventSourceStatus === 'connected' && 'Live Updates Active'}
                    {eventSourceStatus === 'disconnected' && 'Live Updates Off'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-grid">
              <QuickActionCard 
                title="Withdraw"
                subtitle="Transfer to your account"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10M17 7l-5 5-5-5M4 20h16" /></svg>}
                onClick={handleWithdrawClick}
              />
              <QuickActionCard 
                title="Payments"
                subtitle="Manage payout methods"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h22" /></svg>}
                onClick={handleAddPaymentMethod}
              />
            </div>

            {/* Withdrawal Status Alert */}
            <AnimatePresence>
              {withdrawalStatus && (
                <motion.div
                  className={`withdrawal-status-card ${withdrawalStatus.type.includes('success') ? 'success' : 'info'}`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="status-content">
                    <div className="status-icon">
                      {withdrawalStatus.type.includes('success') ? '✅' : '⏳'}
                    </div>
                    <div className="status-text">
                      <h4>{withdrawalStatus.type.includes('success') ? 'Withdrawal Successful' : 'Withdrawal Processing'}</h4>
                      <p>{formatCurrency(withdrawalStatus.data?.amount || 0)} is on its way.</p>
                    </div>
                    <button className="status-close" onClick={() => setWithdrawalStatus(null)}>×</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  walletData.payment_methods.map((method, index) => (
                    <PaymentMethodCard key={method.id} paymentMethod={method} index={index} />
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
                {walletData.settlements?.items?.length > 0 ? (
                  Object.entries(groupSettlementsByDate(walletData.settlements.items)).map(([date, items]) => (
                    <SettlementGroup key={date} date={date} items={items} />
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
              {walletData.settlements && (
                <div className="pagination-controls">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={walletData.settlements.page <= 1}
                    onClick={() => setSettlementPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {walletData.settlements.page} of {walletData.settlements.pages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={walletData.settlements.page >= walletData.settlements.pages}
                    onClick={() => setSettlementPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
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
                {walletData.refunds?.items?.length > 0 ? (
                  walletData.refunds.items.map((refund) => (
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
              {walletData.refunds && (
                <div className="pagination-controls">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={walletData.refunds.page <= 1}
                    onClick={() => setRefundPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {walletData.refunds.page} of {walletData.refunds.pages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={walletData.refunds.page >= walletData.refunds.pages}
                    onClick={() => setRefundPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
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

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={handleWithdrawalModalClose}
        onSuccess={handleWithdrawalSuccess}
        walletBalance={walletData?.wallet?.balance || 0}
        walletData={walletData}
      />
    </div>
  );
}