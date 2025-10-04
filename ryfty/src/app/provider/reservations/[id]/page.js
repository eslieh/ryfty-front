"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchSlotReservations, fetchProviderExperience, fetchExperienceSlots } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/manage-experience.css';
import '@/styles/reservations.css';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [experience, setExperience] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();
  const params = useParams();

  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (!isAuthenticated || !isProvider()) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, isProvider, router]);

  // Fetch experience data
  useEffect(() => {
    const fetchExperienceData = async () => {
      if (!params?.id || !isAuthenticated || !isProvider()) return;
      
      try {
        const response = await fetchProviderExperience(params.id);
        if (response && response.experience) {
          setExperience(response.experience);
        }
      } catch (err) {
        console.error('Error fetching experience:', err);
      }
    };

    fetchExperienceData();
  }, [params?.id, isAuthenticated, isProvider]);

  // Fetch slots data
  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!params?.id || !isAuthenticated || !isProvider()) return;
      
      try {
        const response = await fetchExperienceSlots(params.id);
        
        if (response && response.slots) {
          setSlots(response.slots);
          // Auto-select first slot if available
          if (response.slots.length > 0 && !selectedSlot) {
            setSelectedSlot(response.slots[0]);
          }
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setSlots([]);
      }
    };

    fetchSlotsData();
  }, [params?.id, isAuthenticated, isProvider, selectedSlot]);

  // Fetch reservations data for selected slot
  useEffect(() => {
    const fetchReservationsData = async () => {
      if (!params?.id || !selectedSlot || !isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchSlotReservations(params.id, selectedSlot.id, currentPage, perPage);
        
        if (response && response.reservations) {
          setReservations(response.reservations);
          setPagination(response.pagination);
        } else {
          setReservations([]);
          setPagination({ page: 1, per_page: 10, total: 0, pages: 0 });
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError(err.message || 'Failed to fetch reservations');
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationsData();
  }, [params?.id, selectedSlot, currentPage, perPage, isAuthenticated, isProvider]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  const handleSlotChange = (slot) => {
    setSelectedSlot(slot);
    setCurrentPage(1); // Reset to first page when changing slot
  };

  const filteredReservations = reservations.filter(reservation => {
    if (activeTab === 'all') return true;
    return reservation.status.toLowerCase() === activeTab;
  });

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
              <p>Loading reservations...</p>
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
              <h3 className="error-title">Failed to Load Reservations</h3>
              <p className="error-description">{error}</p>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/provider/listings')}
              >
                Back to Listings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'All Reservations', count: pagination.total },
    { id: 'confirmed', label: 'Confirmed', count: reservations.filter(r => r.status === 'confirmed').length },
    { id: 'pending', label: 'Pending', count: reservations.filter(r => r.status === 'pending').length },
    { id: 'cancelled', label: 'Cancelled', count: reservations.filter(r => r.status === 'cancelled').length },
    { id: 'completed', label: 'Completed', count: reservations.filter(r => r.status === 'completed').length }
  ];

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
      
      <td className="slot-cell">
        <div className="slot-info">
          <div className="slot-name">{reservation.slot.name}</div>
          <div className="slot-time">{reservation.slot.start_time} - {reservation.slot.end_time}</div>
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
        <div className={`reservation-status ${getStatusColor(reservation.status)}`}>
          <div className="status-dot"></div>
          <span>{reservation.status}</span>
        </div>
      </td>
      
      <td className="date-cell">
        <div className="booking-date">
          {formatDate(reservation.created_at)}
        </div>
      </td>
      
      <td className="actions-cell">
        <div className="reservation-actions">
          <button className="btn btn-secondary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View
          </button>
          <button className="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Manage
          </button>
        </div>
      </td>
    </motion.tr>
  );

  const Pagination = () => {
    const totalPages = pagination.pages;
    const currentPageNum = pagination.page;
    
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPageNum <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPageNum >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPageNum - 1; i <= currentPageNum + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="pagination">
        <div className="pagination-info">
          <span>
            Showing {((currentPageNum - 1) * perPage) + 1} to {Math.min(currentPageNum * perPage, pagination.total)} of {pagination.total} reservations
          </span>
        </div>
        
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPageNum - 1)}
            disabled={currentPageNum === 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Previous
          </button>

          <div className="pagination-numbers">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                className={`pagination-number ${page === currentPageNum ? 'active' : ''}`}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPageNum + 1)}
            disabled={currentPageNum === totalPages}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="pagination-per-page">
          <label htmlFor="per-page">Per page:</label>
          <select
            id="per-page"
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="per-page-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    );
  };

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
                  onClick={() => router.push(`/provider/listings/manage/${params.id}`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Manage
                </button>
                <div className="page-title-section">
                  <h1 className="page-title">Reservations Management</h1>
                  <p className="page-subtitle">
                    {experience ? `Manage bookings for "${experience.title}"` : 'Manage experience bookings'}
                  </p>
                </div>
              </div>
              
              <div className="header-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => router.push(`/provider/listings/edit/${params.id}`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit Experience
                </button>
              </div>
            </div>

            {/* Slot Selector */}
            {slots.length > 0 ? (
              <div className="slot-selector">
                <h3 className="selector-title">Select Slot to View Reservations</h3>
                <div className="slots-grid">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`slot-card ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                      onClick={() => handleSlotChange(slot)}
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
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-slots-state">
                <div className="no-slots-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="no-slots-title">No Slots Available</h3>
                <p className="no-slots-description">
                  This experience doesn't have any slots created yet. Create slots to start accepting reservations.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => router.push(`/provider/listings/manage/${params.id}`)}
                >
                  Manage Experience & Create Slots
                </button>
              </div>
            )}

            {/* Stats Cards */}
            {selectedSlot && (
              <div className="reservations-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-number">{pagination.total}</div>
                  <div className="stat-label">Total Reservations</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-number">{reservations.filter(r => r.status === 'confirmed').length}</div>
                  <div className="stat-label">Confirmed</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9.5C15 10.3 14.3 11 13.5 11H10.5C9.7 11 9 10.3 9 9.5V7.5L3 7V9C3 10.1 3.9 11 5 11V20C5 21.1 5.9 22 7 22H9C10.1 22 11 21.1 11 20V16H13V20C13 21.1 13.9 22 15 22H17C18.1 22 19 21.1 19 20V11C20.1 11 21 10.1 21 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-number">
                    {reservations.reduce((sum, r) => sum + r.num_people, 0)}
                  </div>
                  <div className="stat-label">Total Guests</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 11.6312 16.9749 10.9749C17.6312 10.3185 18 9.42826 18 8.5C18 7.57174 17.6312 6.6815 16.9749 6.02513C16.3185 5.36875 15.4283 5 14.5 5H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-number">
                    {formatCurrency(reservations.reduce((sum, r) => sum + r.amount_paid, 0))}
                  </div>
                  <div className="stat-label">Total Revenue</div>
                </div>
              </div>
            </div>
            )}

            {/* Tab Navigation */}
            {selectedSlot && (
              <div className="manage-tabs">
                <div className="tab-buttons">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="tab-label">{tab.label}</span>
                      <span className="tab-count">{tab.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reservations Table */}
            {selectedSlot && (
              <div className="reservations-content">
              {filteredReservations.length > 0 ? (
                <div className="reservations-table-container">
                  <table className="reservations-table">
                    <thead>
                      <tr>
                        <th className="user-header">Guest</th>
                        <th className="slot-header">Slot & Time</th>
                        <th className="people-header">People</th>
                        <th className="price-header">Price</th>
                        <th className="status-header">Status</th>
                        <th className="date-header">Booked</th>
                        <th className="actions-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.map((reservation) => (
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
                    {activeTab === 'all' 
                      ? 'No reservations have been made for this experience yet.'
                      : `No ${activeTab} reservations found.`
                    }
                  </p>
                </div>
              )}
              </div>
            )}

            {/* Pagination */}
            {selectedSlot && <Pagination />}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
