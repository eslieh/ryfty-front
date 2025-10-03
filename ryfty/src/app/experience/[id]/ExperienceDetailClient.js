"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ExperienceDetailSkeleton } from "@/components/SkeletonLoader";
import "@/styles/experience-detail.css";
import "@/styles/reservation-modal.css";
import config from "@/config";
import { getAuthToken } from "@/utils/authStorage";
import { useAuth } from "@/contexts/AuthContext";
export default function ExperienceDetailClient({ id }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Experience states
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reservation states
  const [showReservation, setShowReservation] = useState(false);
  const [reservationStep, setReservationStep] = useState(1);
  const [reservationData, setReservationData] = useState({
    numberOfPeople: 1,
    totalAmount: 0,
    mpesaNumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Only add auth header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('Fetching experience:', id);
        const response = await fetch(`${config.api.baseUrl}/public/experiences/${id}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch experience: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Experience data:', data);
        
        if (data.experience) {
          setExperience(data.experience);
        } else {
          throw new Error('Experience not found');
        }
      } catch (err) {
        console.error('Error fetching experience:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchExperience();
    }
  }, [id]);
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

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    
    if (selectedSlot && experience) {
      console.log('Starting reservation process:', { 
        experienceId: experience.id, 
        slotId: selectedSlot.id 
      });
      
      // Initialize reservation data
      const maxPeople = selectedSlot.available || 1;
      const initialPeople = Math.min(1, maxPeople);
      setReservationData({
        numberOfPeople: initialPeople,
        totalAmount: selectedSlot.price * initialPeople,
        mpesaNumber: '',
        customerName: user?.name || '',
        customerEmail: user?.email || '',
        customerPhone: user?.phone || ''
      });
      
      setShowReservation(true);
      setReservationStep(1);
    } else {
      alert('Please select a time slot first');
    }
  };

  // useEffect(() => {
  //   // Check if favorited (in real app, this would come from user preferences)
  //   const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  //   setIsFavorited(favorites.includes(experience.id));
  // }, [experience.id]);

  const toggleFavorite = () => {
    if (!experience?.id) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = favorites.filter(favId => favId !== experience.id);
    } else {
      newFavorites = [...favorites, experience.id];
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  // Reservation helper functions
  const updateNumberOfPeople = (count) => {
    const maxPeople = selectedSlot?.available || 1;
    const newCount = Math.max(1, Math.min(count, maxPeople));
    const newTotal = selectedSlot.price * newCount;
    setReservationData(prev => ({
      ...prev,
      numberOfPeople: newCount,
      totalAmount: newTotal
    }));
  };

  const handleReservationInputChange = (field, value) => {
    setReservationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextReservationStep = () => {
    if (reservationStep < 3) {
      setReservationStep(reservationStep + 1);
    }
  };

  const prevReservationStep = () => {
    if (reservationStep > 1) {
      setReservationStep(reservationStep - 1);
    }
  };

  const closeReservation = () => {
    setShowReservation(false);
    setReservationStep(1);
  };

  const handleReservationSubmit = async () => {
    try {
      setLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please login to make a reservation');
      }

      const reservationPayload = {
        experience_id: experience.id,
        slot_id: selectedSlot.id,
        number_of_people: reservationData.numberOfPeople,
        total_amount: reservationData.totalAmount,
        mpesa_number: reservationData.mpesaNumber,
        customer_name: reservationData.customerName,
        customer_email: reservationData.customerEmail,
        customer_phone: reservationData.customerPhone
      };

      console.log('Creating reservation:', reservationPayload);

      const response = await fetch(`${config.api.baseUrl}/reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reservation');
      }

      const result = await response.json();
      console.log('Reservation created:', result);

      // Show success message and close reservation
      alert('Reservation created successfully! You will receive payment instructions shortly.');
      setShowReservation(false);
      setReservationStep(1);
      
    } catch (err) {
      console.error('Reservation error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return <ExperienceDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="experience-detail-container">
          <div className="error-container" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'center'
          }}>
            <h2>Error Loading Experience</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // No experience found
  if (!experience) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="experience-detail-container">
          <div className="not-found-container" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'center'
          }}>
            <h2>Experience Not Found</h2>
            <p>The experience you&apos;re looking for doesn&apos;t exist.</p>
            <button 
              onClick={() => router.push('/')} 
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Back to Experiences
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
      
      <div className="experience-detail-container">
        {/* Back Button */}
        <motion.button
          className="back-button"
          onClick={() => router.push('/')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to experiences
        </motion.button>

        {/* Title and Favorite */}
        <motion.div 
          className="experience-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="experience-title-section">
            <h1 className="experience-detail-title">{experience?.title || 'Experience'}</h1>
            <div className="experience-meta">
              <span className="location-text">{experience?.destinations?.join(', ') || 'Location not specified'}</span>
              <span className="status-text">{experience?.status || 'Available'}</span>
            </div>
          </div>
          
          <motion.button
            className={`experience-detail-heart ${isFavorited ? 'favorited' : ''}`}
            onClick={toggleFavorite}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={isFavorited ? "currentColor" : "none"}
              />
            </svg>
          </motion.button>
        </motion.div>

        {/* Image Gallery */}
        <motion.div 
          className="image-gallery"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="main-image">
            <Image
              src={experience?.poster_image_url || '/placeholder-image.jpg'}
              alt={experience?.title || 'Experience'}
              fill
              style={{ objectFit: 'cover' }}
              className="gallery-image"
            />
          </div>
          {experience?.images && experience.images.length > 0 && (
          <div className="gallery-grid">
              {experience.images.slice(0, 2).map((img, index) => (
              <div key={index} className="gallery-item">
                <Image
                    src={img?.url || img || '/placeholder-image.jpg'}
                  alt={`${experience?.title || 'Experience'} ${index + 2}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="gallery-image"
                />
              </div>
            ))}
          </div>
          )}
        </motion.div>

        {/* Content Section */}
        <div className="experience-content-section">
          <div className="main-content">
            {/* Provider Info */}
            <motion.div 
              className="host-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="host-avatar">
                <Image
                  src={experience?.provider?.avatar_url || config.defaultAvatar}
                  alt={experience?.provider?.name || 'Host'}
                  width={56}
                  height={56}
                  className="host-image"
                />
              </div>
              <div className="host-info">
                <h3 className="host-name">Hosted by {experience?.provider?.name || 'Unknown Host'}</h3>
                <p className="host-experience">{experience?.provider?.bio || 'No bio available'}</p>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div 
              className="description-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="section-title">About this experience</h2>
              <p className="description-text">{experience?.description || 'No description available'}</p>
            </motion.div>

            {/* Activities */}
            <motion.div 
              className="highlights-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="section-title">Activities</h2>
              <ul className="highlights-list">
                {experience?.activities?.length > 0 ? (
                  experience.activities.map((activity, index) => (
                    <li key={index} className="highlight-item">{activity}</li>
                  ))
                ) : (
                  <li className="highlight-item">No activities listed</li>
                )}
              </ul>
            </motion.div>

            {/* Where we'll meet */}
            <motion.div 
              className="meeting-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="section-title">Where we&apos;ll meet</h2>
              <div className="meeting-info">
                <p className="meeting-point">{experience?.meeting_point?.name || 'Meeting point not specified'}</p>
                <p className="meeting-details">{experience?.meeting_point?.address || 'Address not provided'}</p>
                <p className="meeting-instructions">{experience?.meeting_point?.instructions || 'No special instructions'}</p>
              </div>
              
              {/* Map Container */}
              {experience?.meeting_point?.coordinates?.lat && experience?.meeting_point?.coordinates?.lng && (
                <div className="map-container">
                  <iframe
                    src={`https://www.google.com/maps?q=${experience.meeting_point.coordinates.lat},${experience.meeting_point.coordinates.lng}&hl=en&z=15&output=embed`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map showing ${experience.meeting_point.name}`}
                  ></iframe>
                </div>
              )}
            </motion.div>

          </div>

          {/* Booking Card */}
          <motion.div 
            className="booking-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="price-section">
              <span className="price-amount">From KSh {experience?.min_price?.toLocaleString() || '0'}</span>
              <span className="price-per">to KSh {experience?.max_price?.toLocaleString() || '0'}</span>
            </div>
            
            <div className="slots-section">
              <h3 className="slots-title">Select a time slot</h3>
              <div className="slots-list">
                {experience?.slots?.length > 0 ? experience.slots.map((slot) => (
                  <motion.div
                    key={slot.id}
                    className={`slot-item ${selectedSlot?.id === slot.id ? 'selected' : ''} ${slot.available === 0 ? 'unavailable' : ''}`}
                    onClick={() => slot.available > 0 && handleSlotSelect(slot)}
                    whileHover={slot.available > 0 ? { scale: 1.02 } : {}}
                    whileTap={slot.available > 0 ? { scale: 0.98 } : {}}
                  >
                    <div className="slot-header">
                      <span className="slot-name">{slot?.name || 'Unnamed Slot'}</span>
                      <span className="slot-price">KSh {slot?.price?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="slot-details">
                      <span className="slot-date">{slot?.date ? formatDate(slot.date) : 'Date TBD'}</span>
                      <span className="slot-time">
                        {slot?.start_time && slot?.end_time 
                          ? `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
                          : 'Time TBD'
                        }
                      </span>
                    </div>
                    <div className="slot-availability">
                      {(slot?.available || 0) > 0 ? (
                        <span className="available-text">{slot.available} spots left</span>
                      ) : (
                        <span className="unavailable-text">Fully booked</span>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="no-slots">
                    <p>No time slots available at the moment.</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              className={`book-button ${!selectedSlot ? 'disabled' : ''}`}
              onClick={handleBooking}
              disabled={!selectedSlot}
            >
              {selectedSlot ? `Book ${selectedSlot?.name || 'Selected Slot'}` : 'Select a time slot'}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {showReservation && (
          <motion.div
            className="reservation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeReservation}
          >
            <motion.div
              className="reservation-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="reservation-modal-content">
                {/* Modal Header */}
                <div className="reservation-modal-header">
                  <h2 className="reservation-modal-title">
                    Make Reservation
                  </h2>
                  <button
                    onClick={closeReservation}
                    className="reservation-modal-close"
                  >
                    ×
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="reservation-progress">
                  <div className="reservation-steps">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="reservation-step">
                        <div className={`reservation-step-circle ${
                          reservationStep > step ? 'completed' : 
                          reservationStep === step ? 'active' : 'pending'
                        }`}>
                          {step}
                        </div>
                        <span className={`reservation-step-label ${
                          reservationStep > step ? 'completed' : 
                          reservationStep === step ? 'active' : 'pending'
                        }`}>
                          {step === 1 && 'Details'}
                          {step === 2 && 'Confirm'}
                          {step === 3 && 'Payment'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Summary */}
                <div className="reservation-experience-summary">
                  <div className="reservation-experience-card">
                    <div className="reservation-experience-image">
                      <Image
                        src={experience?.poster_image_url || '/placeholder-image.jpg'}
                        alt={experience?.title || 'Experience'}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="reservation-experience-details">
                      <h4 className="reservation-experience-title">
                        {experience?.title}
                      </h4>
                      <p className="reservation-experience-slot">
                        {selectedSlot?.name} - {selectedSlot?.date ? formatDate(selectedSlot.date) : 'Date TBD'}
                      </p>
                      <p className="reservation-experience-time">
                        {selectedSlot?.start_time && selectedSlot?.end_time 
                          ? `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`
                          : 'Time TBD'
                        }
                      </p>
                    </div>
                    <div className="reservation-experience-price">
                      <p className="reservation-price-amount">
                        KSh {selectedSlot?.price?.toLocaleString() || '0'}
                      </p>
                      <p className="reservation-price-per">per person</p>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '12px', 
                        color: selectedSlot?.available <= 3 ? '#dc3545' : '#28a745',
                        fontWeight: '600'
                      }}>
                        {selectedSlot?.available || 0} spots left
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step Content */}
                <div className="reservation-step-content">
                  <AnimatePresence mode="wait">
                    {reservationStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="reservation-step-title">
                          Reservation Details
                        </h3>
                      
                        {/* Number of People */}
                        <div className="reservation-form-group">
                          <label className="reservation-form-label">
                            Number of People
                          </label>
                          <div className="reservation-number-selector">
                            <button
                              onClick={() => updateNumberOfPeople(reservationData.numberOfPeople - 1)}
                              className="reservation-number-btn"
                              disabled={reservationData.numberOfPeople <= 1}
                            >
                              -
                            </button>
                            <span className="reservation-number-display">
                              {reservationData.numberOfPeople}
                            </span>
                            <button
                              onClick={() => updateNumberOfPeople(reservationData.numberOfPeople + 1)}
                              className="reservation-number-btn primary"
                              disabled={reservationData.numberOfPeople >= (selectedSlot?.available || 1)}
                            >
                              +
                            </button>
                          </div>
                          <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '14px', textAlign: 'center' }}>
                            Maximum {selectedSlot?.available || 0} people available for this slot
                          </p>
                        </div>

                        {/* Customer Information */}
                        <div className="reservation-form-group">
                          <label className="reservation-form-label">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={reservationData.customerName}
                            onChange={(e) => handleReservationInputChange('customerName', e.target.value)}
                            className="reservation-form-input"
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div className="reservation-form-group">
                          <label className="reservation-form-label">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={reservationData.customerEmail}
                            onChange={(e) => handleReservationInputChange('customerEmail', e.target.value)}
                            className="reservation-form-input"
                            placeholder="Enter your email address"
                          />
                        </div>

                        <div className="reservation-form-group">
                          <label className="reservation-form-label">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={reservationData.customerPhone}
                            onChange={(e) => handleReservationInputChange('customerPhone', e.target.value)}
                            className="reservation-form-input"
                            placeholder="Enter your phone number"
                          />
                        </div>

                        {/* Total Amount */}
                        <div className="reservation-total-card">
                          <div className="reservation-total-row">
                            <span className="reservation-total-label">Total Amount:</span>
                            <span className="reservation-total-amount">
                              KSh {reservationData.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <p className="reservation-total-breakdown">
                            {reservationData.numberOfPeople} person(s) × KSh {selectedSlot?.price?.toLocaleString() || '0'}
                          </p>
                        </div>

                        <button
                          onClick={nextReservationStep}
                          disabled={!reservationData.customerName || !reservationData.customerEmail || !reservationData.customerPhone}
                          className="reservation-btn reservation-btn-primary reservation-btn-full"
                        >
                          Continue to Confirmation
                        </button>
                    </motion.div>
                  )}

                    {reservationStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="reservation-step-title">
                          Confirm Your Reservation
                        </h3>
                      
                        {/* Confirmation Details */}
                        <div className="reservation-confirmation">
                          <div className="reservation-confirmation-section">
                            <div className="reservation-confirmation-row">
                              <span className="reservation-confirmation-label">Experience:</span>
                              <span className="reservation-confirmation-value">{experience?.title}</span>
                            </div>
                            <div className="reservation-confirmation-row">
                              <span className="reservation-confirmation-label">Date:</span>
                              <span className="reservation-confirmation-value">{selectedSlot?.date ? formatDate(selectedSlot.date) : 'Date TBD'}</span>
                            </div>
                            <div className="reservation-confirmation-row">
                              <span className="reservation-confirmation-label">Time:</span>
                              <span className="reservation-confirmation-value">
                                {selectedSlot?.start_time && selectedSlot?.end_time 
                                  ? `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`
                                  : 'Time TBD'
                                }
                              </span>
                            </div>
                            <div className="reservation-confirmation-row">
                              <span className="reservation-confirmation-label">Number of People:</span>
                              <span className="reservation-confirmation-value">{reservationData.numberOfPeople}</span>
                            </div>
                          </div>

                          <div className="reservation-confirmation-section">
                            <div className="reservation-confirmation-row">
                              <span className="reservation-confirmation-label">Name:</span>
                              <span className="reservation-confirmation-value">{reservationData.customerName}</span>
                            </div>
                            <div className="reservation-confirmation-row">
                              <span className="reservation-confirmation-label">Email:</span>
                              <span className="reservation-confirmation-value">{reservationData.customerEmail}</span>
                            </div>
                            <div className="reservation-confirmation-row">
                              <span className="reservation-confirmation-label">Phone:</span>
                              <span className="reservation-confirmation-value">{reservationData.customerPhone}</span>
                            </div>
                          </div>

                          <div className="reservation-confirmation-total">
                            <span className="reservation-confirmation-label">Total Amount:</span>
                            <span className="reservation-confirmation-value">KSh {reservationData.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="reservation-btn-group">
                          <button
                            onClick={prevReservationStep}
                            className="reservation-btn reservation-btn-secondary"
                          >
                            Back
                          </button>
                          <button
                            onClick={nextReservationStep}
                            className="reservation-btn reservation-btn-primary"
                          >
                            Proceed to Payment
                          </button>
                        </div>
                    </motion.div>
                  )}

                    {reservationStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="reservation-step-title">
                          Payment Details
                        </h3>
                      
                        {/* Payment Summary */}
                        <div className="reservation-payment-summary">
                          <div className="reservation-payment-amount-row">
                            <span className="reservation-payment-label">Amount to Pay:</span>
                            <span className="reservation-payment-amount">
                              KSh {reservationData.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <p className="reservation-payment-method">
                            Payment will be processed via M-Pesa
                          </p>
                        </div>

                        {/* M-Pesa Number */}
                        <div className="reservation-form-group">
                          <label className="reservation-form-label">
                            M-Pesa Phone Number
                          </label>
                          <input
                            type="tel"
                            value={reservationData.mpesaNumber}
                            onChange={(e) => handleReservationInputChange('mpesaNumber', e.target.value)}
                            className="reservation-form-input"
                            placeholder="e.g., 254712345678"
                          />
                          <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
                            Enter the phone number registered with M-Pesa
                          </p>
                        </div>

                        {/* Payment Instructions */}
                        <div className="reservation-payment-instructions">
                          <h4 className="reservation-instructions-title">Payment Instructions:</h4>
                          <ol className="reservation-instructions-list">
                            <li>Click &quot;Complete Reservation&quot; below</li>
                            <li>You will receive an M-Pesa prompt on your phone</li>
                            <li>Enter your M-Pesa PIN to complete payment</li>
                            <li>You will receive a confirmation SMS and email</li>
                          </ol>
                        </div>

                        <div className="reservation-btn-group">
                          <button
                            onClick={prevReservationStep}
                            className="reservation-btn reservation-btn-secondary"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleReservationSubmit}
                            disabled={!reservationData.mpesaNumber || loading}
                            className="reservation-btn reservation-btn-success"
                          >
                            {loading ? (
                              <>
                                <span className="reservation-spinner"></span>
                                Processing...
                              </>
                            ) : (
                              'Complete Reservation'
                            )}
                          </button>
                        </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
