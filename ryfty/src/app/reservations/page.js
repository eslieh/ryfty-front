"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { fetchUserReservations } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";
import "@/styles/reservations.css";

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, router]);

  // Fetch reservations
  useEffect(() => {
    const loadReservations = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchUserReservations(currentPage, 10);
        console.log('Reservations response:', response);
        
        if (response.reservations) {
          setReservations(response.reservations);
          setPagination(response.pagination);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError(err.message || 'Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [isAuthenticated, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'TBD';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
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
      default:
        return null;
    }
  };

  // Group reservations by status and sort by slot date
  const groupReservations = (reservations) => {
    const now = new Date();
    
    const groups = {
      upcoming: [],
      checkedIn: [],
      passed: []
    };

    reservations.forEach(reservation => {
      const reservationDate = new Date(reservation.slot?.date);
      
      if (reservation.checked_in) {
        groups.checkedIn.push(reservation);
      } else if (reservationDate < now) {
        groups.passed.push(reservation);
      } else {
        groups.upcoming.push(reservation);
      }
    });

    // Sort each group by slot date
    const sortByDate = (a, b) => {
      const dateA = new Date(a.slot?.date || 0);
      const dateB = new Date(b.slot?.date || 0);
      return dateA - dateB; // Ascending order (earliest first)
    };

    groups.upcoming.sort(sortByDate);
    groups.checkedIn.sort(sortByDate);
    groups.passed.sort(sortByDate);

    return groups;
  };

  // Helper function to check if a reservation is passed
  const isPassedReservation = (reservation) => {
    const now = new Date();
    const reservationDate = new Date(reservation.slot?.date);
    return reservationDate < now && !reservation.checked_in;
  };

  const groupedReservations = groupReservations(reservations);

  // Component to render a group of reservations
  const ReservationGroup = ({ title, reservations }) => {
    if (reservations.length === 0) return null;

    return (
      <motion.div 
        className={"reservation-group"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="group-header">
          <div className="group-title">
            <h2>{title}</h2>
          </div>
        </div>
        
        <div className="group-reservations">
          {reservations.map((reservation, index) => (
            <motion.div
              key={reservation.id}
              className={`reservation-card ${reservation.checked_in ? 'checked-in' : ''} ${isPassedReservation(reservation) ? 'passed' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Experience Image */}
              <div className="reservation-image">
                <Image
                  src={reservation.experience.poster_image_url || '/placeholder-image.jpg'}
                  alt={reservation.experience.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className={`experience-image ${title.toLowerCase()}`}
                />
              </div>

              {/* Reservation Details */}
              <div className={`reservation-details ${title.toLowerCase()}`}>
                <div className="reservation-header">
                  <div className="title-section">
                    <h3 className="experience-title">{reservation.experience.title}</h3>
                    {reservation.slot?.name && (
                      <span className="slot-name">{reservation.slot.name}</span>
                    )}
                  </div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(reservation.status) }}
                  >
                    {getStatusIcon(reservation.status)}
                    <span>{reservation.status}</span>
                  </div>
                </div>

                <p className="experience-description">
                  {reservation.experience.description}
                </p>

                <div className="reservation-info">
                  <div className="info-items">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{reservation.quantity} guest{reservation.quantity !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="info-items">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17.657 16.657L13.414 20.9C13.039 21.2749 12.5301 21.4852 12 21.4852C11.4699 21.4852 10.961 21.2749 10.586 20.9L6.343 16.657C5.22422 15.5382 4.46234 14.1127 4.15369 12.5609C3.84503 11.009 4.00351 9.40051 4.60901 7.93868C5.21451 6.47684 6.2399 5.22749 7.55548 4.34847C8.87107 3.46945 10.4178 3.00026 12 3.00026C13.5822 3.00026 15.1289 3.46945 16.4445 4.34847C17.7601 5.22749 18.7855 6.47684 19.391 7.93868C19.9965 9.40051 20.155 11.009 19.8463 12.5609C19.5377 14.1127 18.7758 15.5382 17.657 16.657Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{reservation.experience.meeting_point.name}</span>
                  </div>

                  <div className="info-items">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{formatDate(reservation.slot?.date)}</span>
                  </div>
                  
                  <div className="info-items">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{formatTime(reservation.slot?.start_time)} - {formatTime(reservation.slot?.end_time)}</span>
                  </div>
                  
                  <div className="info-items">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M7 7H17M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H5C3.89543 7 3 7.89543 3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V9C21 7.89543 20.1046 7 19 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{reservation.slot?.name || 'Standard'}</span>
                  </div>
                </div>

                <div className="reservation-footer">
                  <div className="price-info">
                    <span className="total-price">{formatPrice(reservation.total_price)}</span>
                    <span className="amount-paid">Paid: {formatPrice(reservation.amount_paid)}</span>
                  </div>
                  
                  <div className="reservation-actions">
                    <button 
                      className="action-button secondary"
                      onClick={() => router.push(`/reservations/d/${reservation.id}`)}
                    >
                      View Details
                    </button>
                    {reservation.checked_in && (
                      <div className="checked-in-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Checked In</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="reservations-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your reservations...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="reservations-container">
          <div className="error-container">
            <h2>Error Loading Reservations</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="reservations-container">
        {/* Header */}
        <motion.div 
          className="reservations-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="reservations-title">My Reservations</h1>
          <p className="reservations-subtitle">
            {pagination.total_count > 0 
              ? `${pagination.total_count} reservation${pagination.total_count !== 1 ? 's' : ''} found`
              : 'No reservations found'
            }
          </p>
        </motion.div>

        {/* Grouped Reservations */}
        {reservations.length > 0 ? (
          <div className="reservations-groups">
            <ReservationGroup
              title="Upcoming Reservations"
              reservations={groupedReservations.upcoming}
            />
            
            <ReservationGroup
              title="Checked In"
              reservations={groupedReservations.checkedIn}
            />
            
            <ReservationGroup
              title="Past Reservations"
              reservations={groupedReservations.passed}
            />
          </div>
        ) : (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="empty-title">No reservations yet</h3>
            <p className="empty-description">
              Start exploring amazing experiences and make your first reservation!
            </p>
            <button 
              className="explore-button"
              onClick={() => router.push('/')}
            >
              Explore Experiences
            </button>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <motion.div 
            className="pagination"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button 
              className="pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.has_prev}
            >
              Previous
            </button>
            
            <div className="pagination-info">
              Page {pagination.page} of {pagination.total_pages}
            </div>
            
            <button 
              className="pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.has_next}
            >
              Next
            </button>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
