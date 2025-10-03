"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import '../../styles/provider.css';

export default function ProviderPage() {
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();


  return (
    <div className="provider-main-page">
      {/* Header with Logo */}
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        {/* Left Navigation */}
        <TabNavigation
          className="provider-left-nav"
          orientation="vertical"
        />

        {/* Main Content Area */}
        <motion.main 
          className="provider-main-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
        <div className="content-wrapper">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || 'Provider'}!</h2>
            <p className="welcome-description">
              Choose a section from the left to manage your experiences, bookings, and account.
            </p>
          </div>

          
        </div>
        </motion.main>
      </div>
    </div>
  );
}
