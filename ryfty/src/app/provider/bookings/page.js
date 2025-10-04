"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperiences, fetchExperienceSlots, fetchSlotReservations } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/manage-experience.css';
import '@/styles/reservations.css';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('experiences');
  const [experiences, setExperiences] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('experiences'); // 'experiences', 'slots', 'reservations'
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (!isAuthenticated || !isProvider()) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, isProvider, router]);

  // Fetch experiences data
  useEffect(() => {
    const fetchExperiencesData = async () => {
      if (!isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchProviderExperiences();
        
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

    fetchExperiencesData();
  }, [isAuthenticated, isProvider]);

  // Fetch slots when experience is selected
  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!selectedExperience) return;
      
      try {
        const response = await fetchExperienceSlots(selectedExperience.id);
        
        if (response && response.slots) {
          setSlots(response.slots);
          setCurrentView('slots');
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setSlots([]);
      }
    };

    fetchSlotsData();
  }, [selectedExperience]);

  // Fetch reservations when slot is selected
  useEffect(() => {
    const fetchReservationsData = async () => {
      if (!selectedExperience || !selectedSlot) return;
      
      try {
        const response = await fetchSlotReservations(selectedExperience.id, selectedSlot.id);
        
        if (response && response.reservations) {
          setReservations(response.reservations);
          setCurrentView('reservations');
        } else {
          setReservations([]);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setReservations([]);
      }
    };

    fetchReservationsData();
  }, [selectedExperience, selectedSlot]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const handleExperienceSelect = (experience) => {
    setSelectedExperience(experience);
    setSelectedSlot(null);
    setReservations([]);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBackToExperiences = () => {
    setSelectedExperience(null);
    setSelectedSlot(null);
    setReservations([]);
    setCurrentView('experiences');
  };

  const handleBackToSlots = () => {
    setSelectedSlot(null);
    setReservations([]);
    setCurrentView('slots');
  };

  if (!isAuthenticated || !isProvider()) {
    return (
      <div className="provider-loading">
        <div className="spinner large"></div>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation
            className="provider-left-nav"
            orientation="vertical"
          />
          <div className="provider-main-content">
            <div className="experiences-loading">
              <div className="spinner large"></div>
              <p>Loading bookings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation
            className="provider-left-nav"
            orientation="vertical"
          />
          <div className="provider-main-content">
            <div className="error-state">
              <div className="error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="error-title">Failed to Load Bookings</h3>
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

  const ExperienceCard = ({ experience }) => (
    <motion.div
      className="experience-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => handleExperienceSelect(experience)}
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
            <div className="metric-label">Duration</div>
            <div className="metric-value">
              <span className="duration">
                {experience.start_date && experience.end_date
                  ? `${new Date(experience.start_date).toLocaleDateString()} - ${new Date(experience.end_date).toLocaleDateString()}`
                  : 'No dates set'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="experience-actions">
          <button className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View Bookings
          </button>
        </div>
      </div>
    </motion.div>
  );

  const SlotCard = ({ slot }) => (
    <motion.div
      key={slot.id}
      className={`slot-card ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
      onClick={() => handleSlotSelect(slot)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="slot-header">
        <h4 className="slot-name">{slot.name}</h4>
        <div className="slot-price">{formatCurrency(slot.price)}</div>
      </div>
      
      <div className="slot-details">
        <div className="slot-detail">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{formatDate(slot.date)}</span>
        </div>
        <div className="slot-detail">
          <span className="detail-label">Time:</span>
          <span className="detail-value">{slot.start_time} - {slot.end_time}</span>
        </div>
        <div className="slot-detail">
          <span className="detail-label">Capacity:</span>
          <span className="detail-value">{slot.booked}/{slot.capacity}</span>
        </div>
        <div className="slot-detail">
          <span className="detail-label">Available:</span>
          <span className="detail-value">{slot.capacity - slot.booked}</span>
        </div>
      </div>
    </motion.div>
  );

  const ReservationRow = ({ reservation }) => (
    <motion.tr
      className="reservation-row"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <td className="user-cell">
        <div className="user-info">
          <div className="user-avatar">
            {reservation.user.avatar_url ? (
              <img src={reservation.user.avatar_url} alt={reservation.user.name} />
            ) : (
              <div className="avatar-placeholder">
                {reservation.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{reservation.user.name}</div>
            <div className="user-email">{reservation.user.email}</div>
            {reservation.user.phone && (
              <div className="user-phone">{reservation.user.phone}</div>
            )}
          </div>
        </div>
      </td>
      
      <td className="people-cell">
        <div className="people-count">
          {reservation.num_people} {reservation.num_people === 1 ? 'person' : 'people'}
        </div>
      </td>
      
      <td className="price-cell">
        <div className="price-info">
          <div className="total-price">{formatCurrency(reservation.total_price)}</div>
          <div className="amount-paid">{formatCurrency(reservation.amount_paid)}</div>
        </div>
      </td>
      
      <td className="status-cell">
        <div className={`reservation-status status-${reservation.status.toLowerCase()}`}>
          <div className="status-dot"></div>
          <span>{reservation.status}</span>
        </div>
      </td>
      
      <td className="date-cell">
        <div className="booking-date">
          {formatDate(reservation.created_at)}
        </div>
      </td>
    </motion.tr>
  );

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
            {/* Header */}
            <div className="manage-header">
              <div className="header-left">
                {currentView !== 'experiences' && (
                  <button 
                    className="btn btn-secondary back-btn"
                    onClick={currentView === 'slots' ? handleBackToExperiences : handleBackToSlots}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                  </button>
                )}
                <div className="page-title-section">
                  <h1 className="page-title">Bookings Management</h1>
                  <p className="page-subtitle">
                    {currentView === 'experiences' && 'Select an experience to view bookings'}
                    {currentView === 'slots' && selectedExperience && `Select a slot for "${selectedExperience.title}"`}
                    {currentView === 'reservations' && selectedSlot && `Reservations for "${selectedSlot.name}"`}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="manage-tabs">
              <div className="tab-buttons">
                <button
                  className={`tab-button ${activeTab === 'experiences' ? 'active' : ''}`}
                  onClick={() => setActiveTab('experiences')}
                >
                  <span className="tab-label">Experiences</span>
                  <span className="tab-count">{experiences.length}</span>
                </button>
                <button
                  className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
                  onClick={() => setActiveTab('services')}
                >
                  <span className="tab-label">Services</span>
                  <span className="tab-count">0</span>
                </button>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'experiences' && (
              <>
                {currentView === 'experiences' && (
                  <div className="experiences-grid">
                    {experiences.length > 0 ? (
                      experiences.map((experience) => (
                        <ExperienceCard key={experience.id} experience={experience} />
                      ))
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="empty-title">No experiences yet</h3>
                        <p className="empty-description">
                          Create your first experience to start accepting bookings
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => router.push('/provider/listings/create')}
                        >
                          Create Your First Experience
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentView === 'slots' && selectedExperience && (
                  <div className="slots-section">
                    <div className="slots-header">
                      <h3 className="section-title">Available Slots</h3>
                      <p className="section-subtitle">Select a slot to view reservations</p>
                    </div>

                    {slots.length > 0 ? (
                      <div className="slots-grid">
                        {slots.map((slot) => (
                          <SlotCard key={slot.id} slot={slot} />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="empty-title">No slots available</h3>
                        <p className="empty-description">
                          This experience doesn't have any slots created yet.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => router.push(`/provider/listings/manage/${selectedExperience.id}`)}
                        >
                          Manage Experience & Create Slots
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentView === 'reservations' && selectedSlot && (
                  <div className="reservations-content">
                    {reservations.length > 0 ? (
                      <div className="reservations-table-container">
                        <table className="reservations-table">
                          <thead>
                            <tr>
                              <th className="user-header">Guest</th>
                              <th className="people-header">People</th>
                              <th className="price-header">Price</th>
                              <th className="status-header">Status</th>
                              <th className="date-header">Booked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservations.map((reservation) => (
                              <ReservationRow key={reservation.id} reservation={reservation} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="empty-title">No reservations found</h3>
                        <p className="empty-description">
                          No reservations have been made for this slot yet.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'services' && (
              <div className="services-coming-soon">
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
              </div>
            )}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
