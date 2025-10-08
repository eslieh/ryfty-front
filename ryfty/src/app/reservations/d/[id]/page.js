"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { fetchReservationDetail } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";
import PaymentModal from "@/components/PaymentModal";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import "@/styles/reservation-detail.css";

export default function ReservationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const reservationId = params?.id;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Fetch reservation details
  useEffect(() => {
    const loadReservation = async () => {
      if (!isAuthenticated || !reservationId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchReservationDetail(reservationId);
        console.log('Reservation detail response:', response);
        
        if (response.reservations) {
          setReservation(response.reservations);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching reservation:', err);
        setError(err.message || 'Failed to load reservation details');
      } finally {
        setLoading(false);
      }
    };

    loadReservation();
  }, [isAuthenticated, reservationId]);

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

  // Calculate outstanding balance
  const getOutstandingBalance = () => {
    if (!reservation) return 0;
    return Math.max(0, reservation.total_price - reservation.amount_paid);
  };

  const handlePaymentSuccess = () => {
    // Refresh reservation data after successful payment
    const loadReservation = async () => {
      try {
        const response = await fetchReservationDetail(reservationId);
        if (response.reservations) {
          setReservation(response.reservations);
        }
      } catch (err) {
        console.error('Error refreshing reservation:', err);
      }
    };
    loadReservation();
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {!isMobile && <Header />}
        <div className="reservation-detail-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading reservation details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {!isMobile && <Header />}
        <div className="reservation-detail-container">
          <div className="error-container">
            <h2>Error Loading Reservation</h2>
            <p>{error}</p>
            <button 
              onClick={() => router.push('/reservations')} 
              className="retry-button"
            >
              Back to Reservations
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-white">
        {!isMobile && <Header />}
        <div className="reservation-detail-container">
          <div className="not-found-container">
            <h2>Reservation Not Found</h2>
            <p>The reservation you're looking for doesn't exist.</p>
            <button 
              onClick={() => router.push('/reservations')} 
              className="retry-button"
            >
              Back to Reservations
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {!isMobile && <Header />}
      
      <div className="reservation-detail-container">
        {/* Back Button */}
        <motion.button
          className="back-button"
          onClick={() => router.push('/reservations')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Reservations
        </motion.button>

        {/* QR Code Section - Only show when balance is fully paid */}
        {getOutstandingBalance() === 0 ? (
          <motion.div 
            className="qr-code-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <QRCodeGenerator reservationId={`ryfty_reservation_{${reservationId}}`} size={250} />
          </motion.div>
        ) : (
          <motion.div 
            className="qr-code-pending-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="qr-code-pending-container">
              <div className="qr-code-pending-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="qr-code-pending-title">QR Code Available After Payment</h3>
              <p className="qr-code-pending-description">
                Complete your payment to access your reservation QR code for check-in.
              </p>
              <div className="qr-code-pending-balance">
                <span className="balance-label">Outstanding Balance:</span>
                <span className="balance-amount">{formatPrice(getOutstandingBalance())}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reservation Header */}
        <motion.div 
          className="reservation-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="header-content">
            <div className="title-section">
              <h1 className="reservation-title">{reservation.experience.title}</h1>
              <div className="reservation-meta">
                <span className="slot-name">{reservation.slot?.name || 'Standard'}</span>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(reservation.status) }}
                >
                  {getStatusIcon(reservation.status)}
                  <span>{reservation.status}</span>
                </div>
              </div>
            </div>
            
            {reservation.checked_in && (
              <div className="checked-in-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Checked In</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* View Details Button */}
        <motion.div 
          className="details-toggle-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button 
            className="view-details-button"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>View Reservation Details</span>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              className={`details-arrow ${showDetails ? 'expanded' : ''}`}
            >
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>

        {/* Collapsible Details Content */}
        <motion.div
          className={`details-content ${showDetails ? 'expanded' : 'collapsed'}`}
          initial={false}
          animate={{ 
            height: showDetails ? 'auto' : 0,
            opacity: showDetails ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="reservation-content">
            {/* Experience Image */}
            <motion.div 
              className="experience-image-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showDetails ? 1 : 0, y: showDetails ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="image-container">
                <Image
                  src={reservation.experience.poster_image_url || '/placeholder-image.jpg'}
                  alt={reservation.experience.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="experience-image"
                />
              </div>
            </motion.div>

            {/* Reservation Details */}
            <motion.div 
              className="reservation-details-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showDetails ? 1 : 0, y: showDetails ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            {/* Basic Info */}
            <div className="detail-card">
              <h3 className="card-title">Reservation Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Reservation ID</span>
                  <span className="info-value">{reservation.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date</span>
                  <span className="info-value">{formatDate(reservation.slot?.date)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Time</span>
                  <span className="info-value">{formatTime(reservation.slot?.start_time)} - {formatTime(reservation.slot?.end_time)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Guests</span>
                  <span className="info-value">{reservation.quantity} guest{reservation.quantity !== 1 ? 's' : ''}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Price</span>
                  <span className="info-value price">{formatPrice(reservation.total_price)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Amount Paid</span>
                  <span className="info-value paid">{formatPrice(reservation.amount_paid)}</span>
                </div>
                {getOutstandingBalance() > 0 && (
                  <div className="info-item outstanding-balance">
                    <span className="info-label">Outstanding Balance</span>
                    <span className="info-value balance">{formatPrice(getOutstandingBalance())}</span>
                  </div>
                )}
              </div>
              
              {/* Payment Button for Outstanding Balance */}
              {getOutstandingBalance() > 0 && (
                <div className="payment-section">
                  <button 
                    className="pay-balance-button"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Pay Outstanding Balance
                  </button>
                </div>
              )}
            </div>

            {/* Meeting Point */}
            <div className="detail-card">
              <h3 className="card-title">Meeting Point</h3>
              <div className="meeting-info">
                <h4 className="meeting-name">{reservation.experience.meeting_point.name}</h4>
                <p className="meeting-address">{reservation.experience.meeting_point.address}</p>
                <p className="meeting-instructions">{reservation.experience.meeting_point.instructions}</p>
                
                {reservation.experience.meeting_point.coordinates && (
                  <div className="map-container">
                    <iframe
                      src={`https://www.google.com/maps?q=${reservation.experience.meeting_point.coordinates.latitude},${reservation.experience.meeting_point.coordinates.longitude}&hl=en&z=15&output=embed`}
                      width="100%"
                      height="300"
                      style={{ border: 0, borderRadius: '12px' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map showing ${reservation.experience.meeting_point.name}`}
                    ></iframe>
                  </div>
                )}
              </div>
            </div>

            {/* Experience Details */}
            <div className="detail-card">
              <h3 className="card-title">Experience Details</h3>
              <div className="experience-content">
                <p className="description">{reservation.experience.description}</p>
                
                {reservation.experience.destinations && reservation.experience.destinations.length > 0 && (
                  <div className="detail-section">
                    <h4 className="section-title">Destinations</h4>
                    <div className="tags">
                      {reservation.experience.destinations.map((destination, index) => (
                        <span key={index} className="tag">{destination}</span>
                      ))}
                    </div>
                  </div>
                )}

                {reservation.experience.activities && reservation.experience.activities.length > 0 && (
                  <div className="detail-section">
                    <h4 className="section-title">Activities</h4>
                    <ul className="activity-list">
                      {reservation.experience.activities.map((activity, index) => (
                        <li key={index} className="activity-item">{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reservation.experience.inclusions && reservation.experience.inclusions.length > 0 && (
                  <div className="detail-section">
                    <h4 className="section-title">What's Included</h4>
                    <ul className="inclusion-list">
                      {reservation.experience.inclusions.map((inclusion, index) => (
                        <li key={index} className="inclusion-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {inclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reservation.experience.exclusions && reservation.experience.exclusions.length > 0 && (
                  <div className="detail-section">
                    <h4 className="section-title">What's Not Included</h4>
                    <ul className="exclusion-list">
                      {reservation.experience.exclusions.map((exclusion, index) => (
                        <li key={index} className="exclusion-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {exclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        reservationId={reservationId}
        balanceAmount={getOutstandingBalance()}
        experienceTitle={reservation?.experience?.title}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <Footer />
    </div>
  );
}
