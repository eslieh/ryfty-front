"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProviderLayout from '@/components/provider/ProviderLayout';

export default function ProviderDashboard() {
  const [stats, setStats] = useState({
    totalExperiences: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API calls
      setStats({
        totalExperiences: 12,
        totalBookings: 156,
        totalRevenue: 24500,
        averageRating: 4.8
      });

      setRecentBookings([
        {
          id: 1,
          experience: 'Nairobi National Park Safari',
          customer: 'John Doe',
          date: '2024-01-15',
          time: '6:00 AM',
          status: 'confirmed',
          amount: 15000
        },
        {
          id: 2,
          experience: 'Cultural Village Tour',
          customer: 'Jane Smith',
          date: '2024-01-16',
          time: '2:00 PM',
          status: 'pending',
          amount: 8500
        },
        {
          id: 3,
          experience: 'Mountain Hiking Adventure',
          customer: 'Mike Johnson',
          date: '2024-01-17',
          time: '8:00 AM',
          status: 'confirmed',
          amount: 12000
        }
      ]);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <motion.div
      className={`stat-card stat-card-${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
      </div>
    </motion.div>
  );

  const BookingCard = ({ booking }) => (
    <motion.div
      className="booking-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="booking-header">
        <h3 className="booking-experience">{booking.experience}</h3>
        <span className={`booking-status booking-status-${booking.status}`}>
          {booking.status}
        </span>
      </div>
      <div className="booking-details">
        <div className="booking-customer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {booking.customer}
        </div>
        <div className="booking-date">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {booking.date} at {booking.time}
        </div>
        <div className="booking-amount">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          KSh {booking.amount.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <ProviderLayout>
        <div className="dashboard-loading">
          <div className="spinner large"></div>
          <p>Loading dashboard...</p>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="provider-dashboard">
        {/* Welcome Section */}
        <motion.div
          className="dashboard-welcome"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="welcome-title">Welcome back!</h1>
          <p className="welcome-subtitle">
            Here&apos;s what&apos;s happening with your experiences today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Experiences"
            value={stats.totalExperiences}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            color="green"
          />
          <StatCard
            title="Total Revenue"
            value={`KSh ${stats.totalRevenue.toLocaleString()}`}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            color="purple"
          />
          <StatCard
            title="Average Rating"
            value={`${stats.averageRating}/5`}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            color="orange"
          />
        </div>

        {/* Recent Bookings */}
        <motion.div
          className="recent-bookings"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="section-header">
            <h2 className="section-title">Recent Bookings</h2>
            <a href="/provider/bookings" className="view-all-link">
              View all bookings
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          
          <div className="bookings-grid">
            {recentBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <motion.a
              href="/provider/experiences/new"
              className="action-card"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="action-title">Create New Experience</h3>
              <p className="action-description">Add a new experience to your portfolio</p>
            </motion.a>
            
            <motion.a
              href="/provider/experiences"
              className="action-card"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="action-title">Manage Experiences</h3>
              <p className="action-description">Edit and update your existing experiences</p>
            </motion.a>
            
            <motion.a
              href="/provider/bookings"
              className="action-card"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="action-title">View Bookings</h3>
              <p className="action-description">Check and manage your bookings</p>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </ProviderLayout>
  );
}
