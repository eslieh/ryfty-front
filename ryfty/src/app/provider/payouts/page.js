"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProviderLayout from '@/components/provider/ProviderLayout';

export default function ProviderPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch payouts data
    const fetchPayouts = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API calls
      setPayouts([
        {
          id: 1,
          amount: 45000,
          status: 'completed',
          date: '2024-01-15',
          method: 'Bank Transfer',
          reference: 'PAY-001-2024',
          description: 'Weekly payout for completed bookings'
        },
        {
          id: 2,
          amount: 32000,
          status: 'pending',
          date: '2024-01-22',
          method: 'Bank Transfer',
          reference: 'PAY-002-2024',
          description: 'Weekly payout for completed bookings'
        },
        {
          id: 3,
          amount: 28000,
          status: 'completed',
          date: '2024-01-08',
          method: 'Bank Transfer',
          reference: 'PAY-003-2024',
          description: 'Weekly payout for completed bookings'
        }
      ]);

      setLoading(false);
    };

    fetchPayouts();
  }, []);

  const PayoutCard = ({ payout }) => (
    <motion.div
      className="payout-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="payout-header">
        <div className="payout-amount">KSh {payout.amount.toLocaleString()}</div>
        <div className={`payout-status payout-status-${payout.status}`}>
          {payout.status}
        </div>
      </div>
      
      <div className="payout-details">
        <div className="detail-row">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{payout.date}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Method:</span>
          <span className="detail-value">{payout.method}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Reference:</span>
          <span className="detail-value">{payout.reference}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Description:</span>
          <span className="detail-value">{payout.description}</span>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <ProviderLayout>
        <div className="payouts-loading">
          <div className="spinner large"></div>
          <p>Loading payouts...</p>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="provider-payouts">
        {/* Header */}
        <motion.div
          className="payouts-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="page-title">Payouts</h1>
          <p className="page-subtitle">
            Track your earnings and payout history
          </p>
        </motion.div>

        {/* Payout Summary */}
        <div className="payout-summary">
          <motion.div
            className="summary-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="summary-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Paid Out</div>
              <div className="summary-value">KSh {payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
            </div>
          </motion.div>

          <motion.div
            className="summary-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="summary-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="summary-content">
              <div className="summary-label">Pending Payouts</div>
              <div className="summary-value">KSh {payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
            </div>
          </motion.div>

          <motion.div
            className="summary-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="summary-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Payouts</div>
              <div className="summary-value">{payouts.length}</div>
            </div>
          </motion.div>
        </div>

        {/* Payout History */}
        <motion.div
          className="payout-history"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="section-header">
            <h2 className="section-title">Payout History</h2>
            <button className="view-all-button">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="payouts-list">
            {payouts.length > 0 ? (
              payouts.map((payout) => (
                <PayoutCard key={payout.id} payout={payout} />
              ))
            ) : (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="empty-title">No payouts yet</h3>
                <p className="empty-description">
                  Your payout history will appear here once you start earning
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </ProviderLayout>
  );
}
