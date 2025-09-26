"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

export default function TabNavigation({ 
  className = "",
  orientation = "vertical" // "vertical" or "horizontal"
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Define all provider tabs with their routes and icons
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Today', 
      route: '/provider'
    },
    { 
      id: 'experiences', 
      label: 'Listings', 
      route: '/provider/listings'
    },
    { 
      id: 'bookings', 
      label: 'Bookings', 
      route: '/provider/bookings'
    },
    { 
      id: 'wallet', 
      label: 'Wallet & Payouts', 
      route: '/provider/wallet'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      route: '/provider/profile'
    },
  ];

  // Determine active tab based on current pathname
  useEffect(() => {
    const currentTab = tabs.find(tab => pathname === tab.route);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (pathname === '/provider') {
      setActiveTab('dashboard');
    }
  }, [pathname, tabs]);

  const handleTabClick = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTab(tabId);
      router.push(tab.route);
    }
  };

  return (
    <motion.nav 
      className={`tab-navigation ${orientation} ${className}`}
      initial={{ opacity: 0, x: orientation === "vertical" ? -20 : 0, y: orientation === "horizontal" ? -20 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="nav-tabs">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.badge && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.nav>
  );
}
