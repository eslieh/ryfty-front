"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchSlotDetails, apiCall, fetchExperienceSlots } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/manage-experience.css';
import '@/styles/reservations.css';

export default function SlotDetailPage({ params }) {
  const { experienceId, slotId } = params;
  const [slot, setSlot] = useState(null);
  const [experience, setExperience] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [revenue, setRevenue] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalReservations, setTotalReservations] = useState(0);
  
  // Infinite scroll refs
  const observerRef = useRef();
  const loadingRef = useRef();
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
 

  // Fetch slot and experience data
  useEffect(() => {
    const fetchSlotData = async () => {
      if (!experienceId || !slotId || !isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching slot details for experience:', experienceId, 'slot:', slotId);
        
        // First, set the experience data from the URL parameter
        setExperience({
          id: experienceId,
          title: 'Loading...' // We'll update this when we get slot data
        });
        
        // Try to get slot details directly first
        let slotData = null;
        
        try {
          const slotResponse = await fetchSlotDetails(slotId);
          console.log('Direct slot response:', slotResponse);
          
          if (slotResponse && slotResponse.slot) {
            slotData = slotResponse.slot;
          }
        } catch (slotError) {
          console.log('Direct slot fetch failed, trying experience slots approach:', slotError);
        }
        
        // If direct slot fetch failed, try to get slot from experience slots
        if (!slotData) {
          console.log('Fetching slot from experience slots...');
          try {
            const slotsResponse = await fetchExperienceSlots(experienceId, 1, {}, 100);
            console.log('Experience slots response:', slotsResponse);
            
            if (slotsResponse && slotsResponse.slots) {
              const foundSlot = slotsResponse.slots.find(s => s.id === slotId);
              if (foundSlot) {
                slotData = foundSlot;
                console.log('Found slot in experience slots:', slotData);
              }
            }
          } catch (slotsError) {
            console.log('Experience slots fetch failed:', slotsError);
          }
        }
        
        if (slotData) {
          console.log('Setting slot data:', slotData);
          setSlot(slotData);
          
          // Update experience data if we have it from slot data
          if (slotData.experience) {
            setExperience(slotData.experience);
          } else if (slotData.experience_id) {
            setExperience({
              id: slotData.experience_id,
              title: slotData.experience_title || 'Unknown Experience'
            });
          }
        } else {
          console.error('No slot data found');
          throw new Error('Slot not found');
        }
      } catch (err) {
        console.error('Error fetching slot:', err);
        setError(err.message || 'Failed to fetch slot');
      } finally {
        setLoading(false);
      }
    };

    fetchSlotData();
  }, [experienceId, slotId, isAuthenticated, isProvider]);

  // Load more reservations function
  const loadMoreReservations = useCallback(async () => {
    if (loadingMore || !hasMore || !experienceId || !slotId) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      
      console.log('Loading more reservations, page:', nextPage);
      const response = await apiCall(`/provider/reservations/${experienceId}/${slotId}?page=${nextPage}&per_page=10`);
      console.log('More reservations response:', response);
      
      if (response && response.reservations && response.reservations.length > 0) {
        setReservations(prev => [...prev, ...response.reservations]);
        setCurrentPage(nextPage);
        setHasMore(response.pagination ? response.pagination.page < response.pagination.pages : false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more reservations:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, experienceId, slotId]);

  // Intersection Observer for infinite scroll
  const lastReservationElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreReservations();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, loadMoreReservations]);

  // Fetch reservations for the slot
  useEffect(() => {
    const fetchReservationsData = async () => {
      if (!experienceId || !slotId) return;
      
      try {
        setReservationsLoading(true);
        setCurrentPage(1);
        setHasMore(true);
        setTotalReservations(0);
        
        // Use the correct API endpoint: /provider/reservations/{experienceId}/{slotId}
        console.log('Fetching reservations for experience:', experienceId, 'slot:', slotId);
        const response = await apiCall(`/provider/reservations/${experienceId}/${slotId}?page=1&per_page=10`);
        console.log('Reservations response:', response);
        
        if (response && response.reservations) {
          console.log('Setting reservations:', response.reservations);
          setReservations(response.reservations);
          setRevenue(response.total_revenue);
          setTotalReservations(response.pagination?.total || response.reservations.length);
          setHasMore(response.pagination ? response.pagination.page < response.pagination.pages : false);
        } else {
          console.log('No reservations found in response');
          setReservations([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setReservations([]);
        setHasMore(false);
      } finally {
        setReservationsLoading(false);
      }
    };

    fetchReservationsData();
  }, [experienceId, slotId]);

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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'pending':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'cancelled':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading slot details...</p>
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
            <div className="error-container">
              <h2>Error Loading Slot</h2>
              <p>{error}</p>
              <button 
                onClick={() => window.history.back()} 
                className="btn btn-primary"
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No slot found
  if (!slot) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="not-found-container">
              <h2>Slot Not Found</h2>
              <p>The slot you're looking for doesn't exist.</p>
              <button 
                onClick={() => router.push('/provider/bookings')} 
                className="btn btn-primary"
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const occupancyRate = slot.capacity > 0 ? (slot.booked / slot.capacity) * 100 : 0;
  const isFullyBooked = slot.booked >= slot.capacity;
  const isNearlyFull = occupancyRate >= 80;

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
                <button 
                  className="btn btn-secondary back-btn"
                  onClick={() => router.push('/provider/bookings')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Calendar
                </button>
                <div className="page-title-section">
                  <h1 className="page-title">Slot Details</h1>
                  <p className="page-subtitle">
                    {slot.name} - {experience?.title}
                  </p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push(`/provider/bookings/slot/${experienceId}/${slotId}/devices`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Manage Devices
                </button>
              </div>
            </div>

            {/* Slot Details Section */}
            <div className="slot-details-section">
              <motion.div 
                className="slot-detail-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="slot-detail-header">
                  <div className="slot-detail-title-section">
                    <h2 className="slot-detail-name">{slot.name}</h2>
                    <div className="slot-status-badge">
                      {isFullyBooked ? (
                        <span className="status-badge status-full">Fully Booked</span>
                      ) : isNearlyFull ? (
                        <span className="status-badge status-warning">Nearly Full</span>
                      ) : (
                        <span className="status-badge status-available">Available</span>
                      )}
                    </div>
                  </div>
                  <div className="slot-detail-price">{formatCurrency(slot.price)}</div>
                </div>
                
                <div className="slot-detail-info">
                  <div className="slot-info-grid">
                    <div className="slot-info-item">
                      <span className="info-label">Date:</span>
                      <span className="info-value">{formatDate(slot.date)}</span>
                    </div>
                    <div className="slot-info-item">
                      <span className="info-label">Time:</span>
                      <span className="info-value">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                    </div>
                    <div className="slot-info-item">
                      <span className="info-label">Capacity:</span>
                      <span className="info-value">{slot.booked}/{slot.capacity}</span>
                    </div>
                    <div className="slot-info-item">
                      <span className="info-label">Available:</span>
                      <span className="info-value">{slot.capacity - slot.booked}</span>
                    </div>
                    <div className="slot-info-item">
                      <span className="info-label">Experience:</span>
                      <span className="info-value">{experience?.title}</span>
                    </div>
                    <div className="slot-info-item">
                      <span className="info-label">Revenue:</span>
                      <span className="info-value">{formatCurrency(revenue)}</span>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="occupancy-bar">
                    <div className="occupancy-track">
                      <div 
                        className={`occupancy-fill ${isFullyBooked ? 'full' : isNearlyFull ? 'warning' : 'normal'}`}
                        style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="occupancy-percentage">{Math.round(occupancyRate)}%</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Reservations Section */}
            <div className="reservations-section">
              <motion.div 
                className="reservations-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="section-title">Reservations ({reservations.length})</h2>
                <p className="section-subtitle">All bookings for this slot</p>
              </motion.div>

              {/* Reservations Summary */}
              {reservations.length > 0 && (
                <motion.div 
                  className="reservations-summary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="summary-card">
                    <div className="summary-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="summary-content">
                      <div className="summary-label">Total Reservations</div>
                      <div className="summary-value">{reservations.length}</div>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5C7 8.88071 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5C17 13.8807 15.8807 15 14.5 15H7M17 5H14.5C13.1193 5 12 6.11929 12 7.5C12 8.88071 13.1193 10 14.5 10H9.5C8.11929 10 7 11.1193 7 12.5C7 13.8807 8.11929 15 9.5 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="summary-content">
                      <div className="summary-label">Total Revenue</div>
                      <div className="summary-value">{formatCurrency(revenue)}</div>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="summary-content">
                      <div className="summary-label">Confirmed</div>
                      <div className="summary-value">{reservations.filter(res => res.status?.toLowerCase() === 'confirmed').length}</div>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="summary-content">
                      <div className="summary-label">Pending</div>
                      <div className="summary-value">{reservations.filter(res => res.status?.toLowerCase() === 'pending').length}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Reservations Table */}
              {reservationsLoading ? (
                <div className="reservations-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading reservations...</p>
                </div>
              ) : reservations.length > 0 ? (
                <motion.div 
                  className="reservations-table-container"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="reservations-table">
                    <div className="reservations-table-header">
                      <div className="reservation-header-cell">Customer</div>
                      <div className="reservation-header-cell">People</div>
                      <div className="reservation-header-cell">Amount</div>
                      <div className="reservation-header-cell">Status</div>
                      <div className="reservation-header-cell">Check-in</div>
                      <div className="reservation-header-cell">Booked</div>
                    </div>
                    
                    <div className="reservations-table-body">
                      {reservations.map((reservation, index) => (
                        <motion.div
                          key={reservation.id}
                          className="reservation-row"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          ref={index === reservations.length - 1 ? lastReservationElementRef : null}
                        >
                          <div className="customer-cell">
                            <div className="customer-info">
                              <div className="customer-name">{reservation.user?.name || 'Unknown Customer'}</div>
                              <div className="customer-contact">
                                {reservation.user?.email || 'No email'} • {reservation.user?.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="people-cell">
                            <div className="people-info">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>{reservation.num_people}</span>
                            </div>
                          </div>
                          
                          <div className="price-cell">
                            <div className="price-info-reservations">
                              <div className="total-price">{formatCurrency(reservation.total_price)}</div>
                              {reservation.amount_paid > 0 && (
                                <div className="amount-paid">Paid: {formatCurrency(reservation.amount_paid)}</div>
                              )}
                              {reservation.total_price !== reservation.amount_paid && (
                                <div className="amount-pending">
                                  Pending: {formatCurrency(reservation.total_price - reservation.amount_paid)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="status-cell">
                            <div className={`reservation-status-reservations ${getStatusColor(reservation.status)}`}>
                              <div className="status-icon">
                                {getStatusIcon(reservation.status)}
                              </div>
                              <span className="status-text">{reservation.status}</span>
                            </div>
                          </div>
                          
                          <div className="checkin-cell">
                            {reservation.checked_in ? (
                              <div className="checked-in-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            ) : (
                              <div className="not-checked-in">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 8V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Not Checked In</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="date-cell">
                            <div className="booking-date-reservations">
                              <div className="booking-date">{formatDate(reservation.created_at)}</div>
                              <div className="booking-time">
                                {new Date(reservation.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="loading-more-container" ref={loadingRef}>
                      <div className="loading-spinner"></div>
                      <p>Loading more reservations...</p>
                    </div>
                  )}
                  
                  {/* End of results indicator */}
                  {!hasMore && reservations.length > 0 && (
                    <div className="end-of-results">
                      <p>No more reservations to load</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  className="empty-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="empty-title">No reservations yet</h3>
                  <p className="empty-description">
                    This slot doesn't have any reservations yet.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
