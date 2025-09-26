"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProviderHeader({ 
  variant = "main", // "main" or "topbar"
  title = "",
  showSidebarToggle = false,
  onSidebarToggle = null,
  className = ""
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSwitchToCustomer = () => {
    router.push('/');
  };

  // Main header variant (for dashboard/landing page)
  if (variant === "main") {
    return (
      <motion.header 
        className={`provider-header ${className}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="provider-logo-section">
          <img src="/main.png" alt="Ryfty Logo" className="provider-main-logo" />
          <div className="provider-brand">
            <h1 className="provider-title">Provider</h1>
          </div>
        </div>
        
        <div className="provider-user-info">
          <button 
            className="switch-to-customer"
            onClick={handleSwitchToCustomer}
          >
            Switch to traveling
          </button>
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
        </div>
      </motion.header>
    );
  }

  // Topbar variant (for other provider pages)
  return (
    <header className={`provider-topbar ${className}`}>
      <div className="topbar-left">
        {showSidebarToggle && (
          <button 
            className="sidebar-toggle"
            onClick={onSidebarToggle}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <h1 className="page-title">
          {title}
        </h1>
      </div>
      
      <div className="topbar-right">
        <button 
          className="switch-role-button"
          onClick={handleSwitchToCustomer}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Switch to Customer
        </button>
        
        <div className="user-menu-container">
          <button 
            className="user-menu-trigger"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar-small">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name || 'User'} 
                  className="avatar-image-small"
                />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </button>
          
          {showUserMenu && (
            <motion.div 
              className="user-menu-dropdown topbar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="user-info-header">
                <div className="user-name">{user?.name || 'Provider'}</div>
                <div className="user-email">{user?.email}</div>
              </div>
              <div className="user-menu-divider"></div>
              <div className="user-menu-item" onClick={() => router.push('/provider/profile')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Profile
              </div>
              <div className="user-menu-item" onClick={() => router.push('/provider/wallet')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Wallet
              </div>
              <div className="user-menu-divider"></div>
              <div className="user-menu-item logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
