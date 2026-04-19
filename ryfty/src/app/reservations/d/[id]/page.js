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
import ReviewForm from "@/components/ReviewForm";
import "@/styles/reservation-detail.css";
import { AnimatePresence } from "framer-motion";

export default function ReservationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showQR, setShowQR] = useState(false);
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

  const handleReviewSubmitted = () => {
    // Show success message or refresh data
    alert('Thank you for your review!');
    setShowReviewForm(false);
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
      
      <div className="reservation-detail-wrapper">
        <div className="detail-top-bar">
          <button
            className="header-back-btn"
            onClick={() => router.push("/reservations")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 19L5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Back to Reservations</span>
          </button>
        </div>

        <div className="reservation-clean-layout">
          <div className="timeline-container">
            <div className="timeline-line"></div>

            {/* SECTION 1: SUMMARY CARD */}
            <section className="timeline-section">
              <div className="timeline-dot"></div>
              <motion.div 
                className="clean-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="summary-card-header">
                  <div className="summary-thumb-wrapper">
                    <Image
                      src={reservation.experience.poster_image_url || "/placeholder-image.jpg"}
                      alt={reservation.experience.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="summary-info">
                    <h2 className="summary-title">{reservation.experience.title}</h2>
                    <p className="summary-desc">
                      {reservation.experience.short_description || "Come and enjoy a premium experience with us."}
                    </p>
                    <p className="summary-date">{formatDate(reservation.slot?.date)}</p>
                  </div>
                  <div className={`status-badge-clean status-badge-${reservation.status.toLowerCase()}`}>
                    {reservation.status}
                  </div>
                  <div className="chevron-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* SECTION 2: MEETING POINT */}
            <section className="timeline-section">
              <div className="timeline-dot"></div>
              <motion.div 
                className="clean-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Meeting Point</h3>
                <div className="meeting-split-refined">
                  <div className="meeting-info-box">
                    <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{reservation.experience.meeting_point.name}</h4>
                    <p className="address-text" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{reservation.experience.meeting_point.address}</p>
                    <div className="instructions-card" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                      <p>{reservation.experience.meeting_point.instructions}</p>
                    </div>
                  </div>
                  {reservation.experience.meeting_point.coordinates && (
                    <div className="mini-map-frame" style={{ height: '140px' }}>
                      <iframe
                        src={`https://www.google.com/maps?q=${reservation.experience.meeting_point.coordinates.latitude},${reservation.experience.meeting_point.coordinates.longitude}&hl=en&z=15&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0, borderRadius: '14px' }}
                        allowFullScreen=""
                        loading="lazy"
                        title="Meeting location"
                      ></iframe>
                    </div>
                  )}
                </div>
              </motion.div>
            </section>

            {/* SECTION 3: EXPERIENCE DETAILS */}
            <section className="timeline-section">
              <div className="timeline-dot"></div>
              <motion.div 
                className="clean-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Experience Details</h3>
                
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Time</span>
                    <span className="info-value">{formatTime(reservation.slot?.start_time)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Guests</span>
                    <span className="info-value">{reservation.quantity} People</span>
                  </div>
                </div>

                <p className="desc-text-refined" style={{ fontSize: '0.9rem', marginTop: '1.5rem', lineHeight: '1.6' }}>
                  {reservation.experience.description}
                </p>
                
                <div className="logistics-grid" style={{ marginTop: '1.5rem', gap: '2rem' }}>
                  {reservation.experience.inclusions?.length > 0 && (
                    <div className="log-col">
                      <h4 className="log-title" style={{ fontSize: '0.75rem' }}>Included</h4>
                      <ul className="log-list inc" style={{ fontSize: '0.85rem', gap: '0.5rem' }}>
                        {reservation.experience.inclusions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {reservation.experience.exclusions?.length > 0 && (
                    <div className="log-col">
                      <h4 className="log-title" style={{ fontSize: '0.75rem' }}>Not Included</h4>
                      <ul className="log-list exc" style={{ fontSize: '0.85rem', gap: '0.5rem' }}>
                        {reservation.experience.exclusions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            </section>
          </div>
        </div>

        {/* Dynamic Floating Glass CTA */}
        {reservation && (
          <motion.div
            className="floating-pass-cta"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {(() => {
              const balance = getOutstandingBalance();
              const status = reservation.status?.toLowerCase() || 'pending';
              
              // Helper to check if the date is in the past
              const isPast = () => {
                if (!reservation.slot?.date) return false;
                const slotDate = new Date(reservation.slot.date);
                if (reservation.slot.start_time) {
                  const [hours, minutes] = reservation.slot.start_time.split(':');
                  slotDate.setHours(parseInt(hours), parseInt(minutes));
                }
                return slotDate < new Date();
              };

              const hasFinished = isPast() || status === 'completed' || status === 'checked_in';

              let config = {
                label: "Experience is ready",
                subtext: "Your access pass is available",
                btnLabel: "Show Pass",
                action: () => setShowQR(true),
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 5V7M15 11V13M15 17V19M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )
              };

              if (balance > 1) { // Greater than 1 KES to avoid float issues
                config = {
                  label: "Action Required",
                  subtext: `Balance due: ${formatPrice(balance)}`,
                  btnLabel: "Complete Payment",
                  action: () => setShowPaymentModal(true),
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )
                };
              } else if (hasFinished) {
                config = {
                  label: "Experience Highlight",
                  subtext: "How was your experience?",
                  btnLabel: "Leave Review",
                  action: () => setShowReviewForm(true),
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )
                };
              } else if (status === 'cancelled') {
                return null;
              }

              return (
                <div className="glass-cta-container">
                  <div className="cta-info">
                    <span className="cta-label">{config.label}</span>
                    <span className="cta-sub">{config.subtext}</span>
                  </div>
                  <button
                    className="show-pass-btn"
                    onClick={config.action}
                  >
                    {config.icon}
                    <span>{config.btnLabel}</span>
                  </button>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>

      <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              reservationId={reservationId}
              balanceAmount={getOutstandingBalance()}
              experienceTitle={reservation?.experience?.title}
              onPaymentSuccess={handlePaymentSuccess}
      />
       {/* Review Form Modal */}
       {showReviewForm && reservation && (
         <ReviewForm
           experienceId={reservation.experience.id}
           reservationId={reservationId}
           experienceTitle={reservation.experience.title}
           onReviewSubmitted={handleReviewSubmitted}
           onClose={() => setShowReviewForm(false)}
         />
       )}

       {/* RYFTY ACCESS PASS MODAL */}
       <AnimatePresence>
         {showQR && (
           <div className="pass-modal-overlay">
             <motion.div 
               className="pass-modal-content"
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
             >
               <button className="close-modal-btn" onClick={() => setShowQR(false)}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                   <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </button>
               
               <div className="ryfty-pass popup-variant">
                  <div className="pass-top">
                    <div className="pass-branding">
                      <span className="brand-logo">RYFTY</span>
                      <span className="brand-tagline">Official Access Pass</span>
                    </div>
                  </div>
                  <div className="pass-perforation">
                    <div className="dot"></div>
                    <div className="line"></div>
                    <div className="dot"></div>
                  </div>
                  <div className="pass-body">
                    <div className="qr-container-refined">
                      <QRCodeGenerator
                        reservationId={`ryfty_reservation_{${reservationId}}`}
                        size={200}
                      />
                    </div>
                    <div className="pass-footer">
                      <div className="footer-item">
                        <span className="f-label">HOLDER</span>
                        <span className="f-value">{user?.full_name || 'Guest Participant'}</span>
                      </div>
                      <div className="footer-item">
                        <span className="f-label">REF#</span>
                        <span className="f-value">RYF-{reservation.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="modal-instruction">Present this QR code during check-in</p>
             </motion.div>
             <div className="modal-backdrop-blur" onClick={() => setShowQR(false)}></div>
           </div>
         )}
       </AnimatePresence>

       <Footer />
     </div>
   );
 }
