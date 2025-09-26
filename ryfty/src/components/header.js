"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import "../styles/header.css";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { isAuthenticated, user, logout, isProvider, isCustomer } = useAuth();
  const router = useRouter();
  console.log(user);
  

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
    if (isProvider()) {
      router.push('/');
    } else {
      router.push('/provider/dashboard');
    }
  };

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

  console.log(user);
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
          <img src="/main.png" alt="Ryfty Logo" className="logo" />
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
              Switch to Customer
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
                    src={user.avatar_url} 
                    alt={user.name || 'User'} 
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
                        onClick={() => handleAuthNavigation('/bookings')}
                        whileHover={{ backgroundColor: "#f7f7f7", x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        My Bookings
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
    </motion.header>
  );
}