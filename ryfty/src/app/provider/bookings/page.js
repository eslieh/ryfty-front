"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperiences, fetchExperienceSlots } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/manage-experience.css';
import '@/styles/reservations.css';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('experiences');
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calendar view states
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [allMonthSlots, setAllMonthSlots] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
 

  // Fetch experiences
  useEffect(() => {
    const fetchExperiences = async () => {
      if (!isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchProviderExperiences(1, 20, {
          status: 'active',
          sort: 'created_at_desc'
        });
        
        if (response && response.experiences) {
          setExperiences(response.experiences);
        } else {
          setExperiences([]);
        }
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setError(err.message || 'Failed to fetch experiences');
        setExperiences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [isAuthenticated, isProvider]);

  // Fetch slots for calendar when experience is selected
  useEffect(() => {
    const fetchCalendarSlots = async () => {
      if (!selectedExperience) return;
      
      try {
        setCalendarLoading(true);
        setSlotsError(null);
        
        // Get current month start and end dates (using local timezone)
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Format dates as YYYY-MM-DD using local timezone to avoid timezone shifts
        const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        const response = await fetchExperienceSlots(selectedExperience.id, 1, {
          start_date: startDateStr,
          end_date: endDateStr,
          sort: 'asc'
        }, 100);
        
        if (response && response.slots) {
          setAllMonthSlots(response.slots);
        } else {
          setAllMonthSlots([]);
        }
      } catch (err) {
        console.error('Error fetching calendar slots:', err);
        setSlotsError(err.message || 'Failed to fetch slots');
        setAllMonthSlots([]);
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchCalendarSlots();
  }, [selectedExperience, currentMonth]);

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount?.toLocaleString() || '0'}`;
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSlotsForDate = (dateStr) => {
    return allMonthSlots.filter(slot => slot.date === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Navigation functions
  const openCalendar = (experience) => {
    setSelectedExperience(experience);
    setShowCalendar(true);
    setSelectedDate(null);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
    setSelectedExperience(null);
    setSelectedDate(null);
  };

  const handleSlotClick = (slot) => {
    // Allow clicking on all slots regardless of booking status or date
    router.push(`/provider/bookings/slot/${selectedExperience.id}/${slot.id}`);
  };

  // Experience Card Component
  const ExperienceCard = ({ experience }) => (
    <motion.div
      className="experience-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="experience-poster">
        <img 
          src={experience.poster_image_url || '/images/placeholder.jpg'} 
          alt={experience.title} 
          className="poster-image" 
        />
        <div className={`experience-status experience-status-${experience.status}`}>
          {experience.status}
        </div>
      </div>
      
      <div className="experience-content">
        <h3 className="experience-title">{experience.title}</h3>
        <p className="experience-description">{experience.description || 'No description available'}</p>
        
        <div className="experience-metrics">
          <div className="metric-item">
            <div className="metric-label">Created</div>
            <div className="metric-value">
              <span className="created-date">
                {new Date(experience.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="metric-item">
            <div className="metric-label">Price Range</div>
            <div className="metric-value">
              <span className="price-range">
                {experience.min_price && experience.max_price 
                  ? `KSh ${experience.min_price.toLocaleString()} - KSh ${experience.max_price.toLocaleString()}`
                  : 'Price not set'
                }
              </span>
            </div>
          </div>
        </div>
        
        <div className="experience-actions">
          <button 
            className="btn btn-primary"
            onClick={() => openCalendar(experience)}
          >
            View Bookings
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => router.push(`/provider/listings/manage/${experience.id}`)}
          >
            Manage
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="experiences-loading">
              <div className="spinner large"></div>
              <p>Loading experiences...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="error-state">
              <div className="error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="error-title">Failed to Load Experiences</h3>
              <p className="error-description">{error}</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-main-page">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation
          className="provider-left-nav"
          orientation="vertical"
        />

        <motion.main 
          className="provider-main-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="content-wrapper">
            <div className="provider-experiences">
              {/* Header */}
              <motion.div
                className="experiences-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="header-content">
                  <h1 className="page-title">Bookings</h1>
                  <p className="page-subtitle">Manage your experience bookings and reservations</p>
                </div>
              </motion.div>

              {/* Tab Navigation */}
              <motion.div
                className="listings-tabs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="tab-buttons">
                  <button
                    className={`tab-button ${activeTab === 'experiences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('experiences')}
                  >
                    Experiences
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
                    onClick={() => setActiveTab('services')}
                  >
                    Services
                  </button>
                </div>
              </motion.div>

              {/* Tab Content */}
              {activeTab === 'experiences' && (
                <>
                  {/* Experiences Grid */}
                  <motion.div 
                    className="experiences-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {experiences.length > 0 ? (
                      experiences.map((experience) => (
                        <ExperienceCard key={experience.id} experience={experience} />
                      ))
                    ) : (
                      <motion.div
                        className="empty-state"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="empty-icon">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="empty-title">No experiences yet</h3>
                        <p className="empty-description">
                          Create your first experience to start managing bookings
                        </p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => router.push('/provider/listings/create')}
                        >
                          Create Your First Experience
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                </>
              )}

              {activeTab === 'services' && (
                <motion.div
                  className="services-coming-soon"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="coming-soon-content">
                    <div className="coming-soon-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h2 className="coming-soon-title">Services Coming Soon</h2>
                    <p className="coming-soon-description">
                      We're working on bringing you a comprehensive services platform.
                      Soon you'll be able to manage bookings for various services like transportation,
                      photography, catering, and more.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.main>
      </div>

      {/* Calendar Modal */}
      {showCalendar && selectedExperience && (
        <div className="calendar-modal-overlay" onClick={closeCalendar}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2 className="calendar-modal-title">
                Booking Calendar - {selectedExperience.title}
              </h2>
              <button
                onClick={closeCalendar}
                className="calendar-modal-close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="calendar-modal-content">
              {calendarLoading ? (
                <div className="calendar-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading calendar slots...</p>
                </div>
              ) : slotsError ? (
                <div className="calendar-error">
                  <div className="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Error Loading Slots</h3>
                  <p>{slotsError}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="calendar-container">
                  <div className="calendar-header">
                    <button onClick={() => navigateMonth(-1)} className="calendar-nav-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <h3 className="calendar-month">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => navigateMonth(1)} className="calendar-nav-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                    
                    {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                      <div key={`empty-${i}`} className="calendar-day empty"></div>
                    ))}
                    
                    {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                      const day = i + 1;
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      // Format date as YYYY-MM-DD using local timezone to avoid timezone shifts
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const daySlots = getSlotsForDate(dateStr);
                      const hasSlots = daySlots.length > 0;
                      const isSelected = selectedDate === dateStr;
                      
                      return (
                        <div
                          key={day}
                          className={`calendar-day ${hasSlots ? 'has-slots' : ''} ${isToday(date) ? 'today' : ''} ${isPastDate(date) ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => hasSlots && setSelectedDate(dateStr)}
                        >
                          <span className="day-number">{day}</span>
                          {hasSlots && (
                            <div className="slots-indicator">
                              <span className="slots-count">{daySlots.length}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Selected Date Slots */}
                  {selectedDate && (
                    <div className="selected-date-slots">
                      <h4 className="selected-date-title">
                        Available Slots for {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <div className="date-slots-list">
                        {getSlotsForDate(selectedDate).map((slot) => (
                          <motion.div
                            key={slot.id}
                            className={`slot-item ${slot.booked >= slot.capacity ? 'fully-booked' : ''}`}
                            onClick={() => handleSlotClick(slot)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="slot-header">
                              <span className="slot-name">{slot.name}</span>
                              <span className="slot-price">{formatCurrency(slot.price)}</span>
                            </div>
                            <div className="slot-details">
                              <span className="slot-time">{slot.start_time} - {slot.end_time}</span>
                            </div>
                            <div className="slot-availability">
                              <span className="availability-text">
                                {slot.booked}/{slot.capacity} booked
                                {slot.booked < slot.capacity && (
                                  <span className="spots-left"> ({slot.capacity - slot.booked} spots left)</span>
                                )}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}