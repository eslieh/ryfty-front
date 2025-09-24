"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import '../../styles/provider.css';

export default function ProviderPage() {
  const [activeTab, setActiveTab] = useState('today');
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (!isAuthenticated || !isProvider()) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, isProvider, router]);

  const tabs = [
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'listings', label: 'Listings', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'wallet', label: 'Wallet & Payment', icon: '💳' }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    
    // Navigate to specific pages based on tab
    switch (tabId) {
      case 'today':
        router.push('/provider/dashboard');
        break;
      case 'listings':
        router.push('/provider/experiences');
        break;
      case 'profile':
        router.push('/provider/profile');
        break;
      case 'wallet':
        router.push('/provider/wallet');
        break;
      default:
        break;
    }
  };

  if (!isAuthenticated || !isProvider()) {
    return (
      <div className="provider-loading">
        <div className="spinner large"></div>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="provider-main-page">
      {/* Header with Logo */}
      <motion.header 
        className="provider-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="provider-logo-section">
          <img src="/main.png" alt="Ryfty Logo" className="provider-main-logo" />
          <div className="provider-brand">
            <h1 className="provider-title">Ryfty Provider</h1>
            <p className="provider-subtitle">Manage your experiences</p>
          </div>
        </div>
        
        <div className="provider-user-info">
          <div className="user-avatar">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name || 'User'} 
                className="avatar-image"
              />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'Provider'}</div>
            <div className="user-role">Provider</div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <motion.nav 
        className="provider-tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="tabs-container">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <motion.main 
        className="provider-content-area"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="content-wrapper">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || 'Provider'}!</h2>
            <p className="welcome-description">
              Choose a section above to manage your experiences, bookings, and account.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">12</div>
                <div className="stat-label">Active Experiences</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">156</div>
                <div className="stat-label">Total Bookings</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">KSh 245K</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="action-cards">
            <motion.div 
              className="action-card"
              onClick={() => handleTabClick('today')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="action-title">Today&apos;s Overview</h3>
              <p className="action-description">View your daily bookings and activities</p>
            </motion.div>

            <motion.div 
              className="action-card"
              onClick={() => handleTabClick('listings')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="action-title">Manage Listings</h3>
              <p className="action-description">Create and edit your experiences</p>
            </motion.div>

            <motion.div 
              className="action-card"
              onClick={() => handleTabClick('profile')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="action-title">Profile Settings</h3>
              <p className="action-description">Update your profile and preferences</p>
            </motion.div>

            <motion.div 
              className="action-card"
              onClick={() => handleTabClick('wallet')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="action-title">Wallet & Payments</h3>
              <p className="action-description">Manage your earnings and payments</p>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
