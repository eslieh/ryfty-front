"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProviderLayout from '@/components/provider/ProviderLayout';

export default function ProviderWallet() {
  const [walletData, setWalletData] = useState({
    balance: 0,
    pendingAmount: 0,
    totalEarnings: 0,
    lastPayout: null
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch wallet data
    const fetchWalletData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API calls
      setWalletData({
        balance: 45000,
        pendingAmount: 12500,
        totalEarnings: 245000,
        lastPayout: '2024-01-10'
      });

      setTransactions([
        {
          id: 1,
          type: 'earning',
          amount: 15000,
          description: 'Nairobi National Park Safari',
          date: '2024-01-15',
          status: 'completed'
        },
        {
          id: 2,
          type: 'earning',
          amount: 8500,
          description: 'Cultural Village Tour',
          date: '2024-01-14',
          status: 'pending'
        },
        {
          id: 3,
          type: 'payout',
          amount: -30000,
          description: 'Bank Transfer',
          date: '2024-01-10',
          status: 'completed'
        },
        {
          id: 4,
          type: 'earning',
          amount: 12000,
          description: 'Mountain Hiking Adventure',
          date: '2024-01-12',
          status: 'completed'
        }
      ]);

      setLoading(false);
    };

    fetchWalletData();
  }, []);

  const TransactionCard = ({ transaction }) => (
    <motion.div
      className="transaction-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="transaction-icon">
        {transaction.type === 'earning' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17H21V21H3V17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      
      <div className="transaction-details">
        <div className="transaction-description">{transaction.description}</div>
        <div className="transaction-date">{transaction.date}</div>
      </div>
      
      <div className={`transaction-amount ${transaction.type}`}>
        {transaction.type === 'earning' ? '+' : ''}KSh {Math.abs(transaction.amount).toLocaleString()}
      </div>
      
      <div className={`transaction-status transaction-status-${transaction.status}`}>
        {transaction.status}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <ProviderLayout>
        <div className="wallet-loading">
          <div className="spinner large"></div>
          <p>Loading wallet...</p>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="provider-wallet">
        {/* Header */}
        <motion.div
          className="wallet-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="page-title">Wallet & Payments</h1>
          <p className="page-subtitle">
            Manage your earnings and payment settings
          </p>
        </motion.div>

        {/* Balance Cards */}
        <div className="balance-cards">
          <motion.div
            className="balance-card primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="balance-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="balance-content">
              <div className="balance-label">Available Balance</div>
              <div className="balance-amount">KSh {walletData.balance.toLocaleString()}</div>
            </div>
            <button className="withdraw-button">
              Withdraw
            </button>
          </motion.div>

          <motion.div
            className="balance-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="balance-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="balance-content">
              <div className="balance-label">Pending Amount</div>
              <div className="balance-amount">KSh {walletData.pendingAmount.toLocaleString()}</div>
            </div>
          </motion.div>

          <motion.div
            className="balance-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="balance-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="balance-content">
              <div className="balance-label">Total Earnings</div>
              <div className="balance-amount">KSh {walletData.totalEarnings.toLocaleString()}</div>
            </div>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div
          className="transaction-history"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="section-header">
            <h2 className="section-title">Transaction History</h2>
            <button className="view-all-button">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </motion.div>

        {/* Payment Settings */}
        <motion.div
          className="payment-settings"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="section-title">Payment Settings</h2>
          <div className="settings-grid">
            <div className="setting-card">
              <div className="setting-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H21V21H3V17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="setting-content">
                <h3 className="setting-title">Bank Account</h3>
                <p className="setting-description">Manage your bank account details</p>
              </div>
              <button className="setting-button">Manage</button>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="setting-content">
                <h3 className="setting-title">Payout Schedule</h3>
                <p className="setting-description">Set your preferred payout frequency</p>
              </div>
              <button className="setting-button">Configure</button>
            </div>

            <div className="setting-card">
              <div className="setting-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="setting-content">
                <h3 className="setting-title">Tax Information</h3>
                <p className="setting-description">Update your tax details</p>
              </div>
              <button className="setting-button">Update</button>
            </div>
          </div>
        </motion.div>
      </div>
    </ProviderLayout>
  );
}
