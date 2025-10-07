"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function TabNavigation({ 
  className = "",
  orientation = "vertical" // "vertical" or "horizontal"
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Define all provider tabs with their routes and icons
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Today', 
      route: '/provider',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'experiences', 
      label: 'Listings', 
      route: '/provider/listings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'bookings', 
      label: 'Bookings', 
      route: '/provider/bookings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'wallet', 
      label: 'Wallet', 
      route: '/provider/wallet',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      route: '/provider/profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
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
    <nav 
      className={`tab-navigation fixed ${isMobile ? 'mobile' : orientation} ${className}`}
    >
      <div className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <div className="tab-icon">
              {tab.icon}
            </div>
            <span className="tab-label">{tab.label}</span>
            {tab.badge && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
