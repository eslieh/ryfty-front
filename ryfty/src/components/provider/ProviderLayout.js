"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import TabNavigation from './TabNavigation';
import ProviderHeader from './ProviderHeader';
import '../../styles/provider.css';

export default function ProviderLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user, isProvider, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getPageTitle = () => {
    const titleMap = {
      '/provider': 'Today',
      '/provider/listings': 'Listings',
      '/provider/bookings': 'Bookings',
      '/provider/profile': 'Profile',
      '/provider/wallet & Payouts': 'Wallet',
    };
    return titleMap[pathname] || 'Provider Dashboard';
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
    <div className="provider-layout">
      {/* Sidebar */}
      <motion.aside 
        className={`provider-sidebar ${sidebarOpen ? 'open' : ''}`}
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <div className="provider-logo">
            <img src="/main.png" alt="Ryfty" className="logo" />
            <span className="logo-text">Provider</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <TabNavigation
            className="provider-sidebar-nav"
            orientation="vertical"
          />
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
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
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="provider-main">
        {/* Top Bar */}
        <ProviderHeader 
          variant="topbar"
          title={getPageTitle()}
          showSidebarToggle={true}
          onSidebarToggle={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="provider-content">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <motion.div 
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
