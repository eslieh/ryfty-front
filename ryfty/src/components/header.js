"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import "../styles/header.css";
import config from "@/config";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const menuRef = useRef(null);
  const lastScrollY = useRef(0);
  const { isAuthenticated, user, logout, isProvider, isCustomer } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // console.log(user);
  

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  const handleAuthNavigation = (path) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  const handleSwitchRole = () => {
    setIsMenuOpen(false);
    router.push('/provider');
  };

  const handleBottomNavClick = (path) => {
    router.push(path);
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  // Helper function to check if a tab is active
  const isTabActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll detection for mobile bottom nav
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY.current ? 'down' : 'up';
      
      setIsScrolled(scrollY > 50);
      setScrollDirection(direction);
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manage body class for mobile navigation
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-nav-active');
    } else {
      document.body.classList.remove('mobile-nav-active');
    }

    return () => {
      document.body.classList.remove('mobile-nav-active');
    };
  }, [isMobile]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <motion.header 
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="header-container">
        {/* Logo Section */}
        <motion.div 
          className="logo-container"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img src="/main.png" alt="Ryfty Logo" onClick={() => handleLogoClick()} className="logo" />
        </motion.div>

        

        {/* Right Section */}
        <div className="right-section">
          {isAuthenticated && isProvider() && (
            <motion.button 
              className="host-button"
              onClick={handleSwitchRole}
              whileHover={{ scale: 1.05, backgroundColor: "#f7f7f7" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Switch to Provider
            </motion.button>
          )}
          
          {/* User Menu */}
          <div className="user-menu" ref={menuRef}>
            <motion.button 
              className="menu-button" 
              onClick={toggleMenu}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="hamburger-icon">
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="avatar">
                {isAuthenticated && user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={user?.avatar_url || config.defaultAvatar} 
                    alt={user?.name || 'User'} 
                    className="user-avatar"
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  className="dropdown-menu"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    duration: 0.2 
                  }}
                >
                  {isAuthenticated ? (
                    <>
                      {/* User Info Section */}
                      <div className="user-info-section">
                        <div className="user-name">{user?.name || 'User'}</div>
                        <div className="user-email">{user?.email}</div>
                        <div className="user-role">{isProvider() ? 'Provider' : 'Customer'}</div>
                      </div>
                      <div className="dropdown-divider"></div>
                      
                      {/* Authenticated Menu Items */}
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/profile')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Profile
                      </motion.div>
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/reservations')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        My Reservations
                      </motion.div>
                      {isProvider() && (
                        <motion.div 
                          className="dropdown-item"
                          onClick={() => handleAuthNavigation('/provider/dashboard')}
                          whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          Provider Dashboard
                        </motion.div>
                      )}
                      <div className="dropdown-divider"></div>
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/help')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Help Center
                      </motion.div>
                      <motion.div 
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Log out
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Guest Menu Items */}
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/auth?mode=signup')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Sign up
                      </motion.div>
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/auth?mode=login')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Log in
                      </motion.div>
                      <div className="dropdown-divider"></div>
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/gift-cards')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Gift cards
                      </motion.div>
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/host')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Ryfty your home
                      </motion.div>
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/host-experience')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Host an experience
                      </motion.div>
                      <motion.div 
                        className="dropdown-item"
                        onClick={() => handleAuthNavigation('/help')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        Help Center
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <motion.div 
          className={`mobile-bottom-nav ${isScrolled && scrollDirection === 'down' ? 'scrolled-down' : ''} ${isScrolled && scrollDirection === 'up' ? 'scrolled-up' : ''}`}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {isAuthenticated ? (
            // Authenticated user tabs
            <>
              <motion.button 
                className={`bottom-nav-item ${isTabActive('/') ? 'active' : ''}`}
                onClick={() => handleBottomNavClick('/')}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Explore</span>
              </motion.button>
              
              <motion.button 
                className={`bottom-nav-item ${isTabActive('/reservations') ? 'active' : ''}`}
                onClick={() => handleBottomNavClick('/reservations')}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Reservations</span>
              </motion.button>
              
              <motion.button 
                className={`bottom-nav-item ${isTabActive('/profile') ? 'active' : ''}`}
                onClick={() => handleBottomNavClick('/profile')}
                whileTap={{ scale: 0.95 }}
              >
                <div className="profile-icon">
                  {user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={user?.avatar_url || config.defaultAvatar} 
                      alt={user?.name || 'User'} 
                      className="profile-avatar"
                    />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span>Profile</span>
              </motion.button>
            </>
          ) : (
            // Guest user tabs
            <>
              <motion.button 
                className={`bottom-nav-item ${isTabActive('/') ? 'active' : ''}`}
                onClick={() => handleBottomNavClick('/')}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Search</span>
              </motion.button>
              
              <motion.button 
                className={`bottom-nav-item ${isTabActive('/auth') ? 'active' : ''}`}
                onClick={() => handleBottomNavClick('/auth?mode=login')}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15M10 17L15 12L10 7M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Log in</span>
              </motion.button>
            </>
          )}
        </motion.div>
      )}
    </motion.header>
  );
}