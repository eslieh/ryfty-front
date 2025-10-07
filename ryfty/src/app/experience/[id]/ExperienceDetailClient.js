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
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Slots states
  const [slots, setSlots] = useState([]);
  const [allMonthSlots, setAllMonthSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFullscreenCalendar, setShowFullscreenCalendar] = useState(false);
  
  // Pagination for slots display
  const [currentSlotPage, setCurrentSlotPage] = useState(0);
  const [slotsPerPage] = useState(4);
  const [slotsObserverRef, setSlotsObserverRef] = useState(null);
  
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
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);


  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
  }, []);

  // Fetch slots separately
  useEffect(() => {
    const fetchSlots = async () => {
      if (!experience?.id) return;
      
      try {
        setSlotsLoading(true);
        setSlotsError(null);
        
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Get current month start and end dates
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('Fetching slots for month:', { startDateStr, endDateStr });
        
        const response = await fetch(`${config.api.baseUrl}/experiences/${experience.id}/slots?start_date=${startDateStr}&end_date=${endDateStr}&sort=asc&per_page=100`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch slots: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Slots data:', data);
        
        if (data.slots && data.slots.length > 0) {
          setAllMonthSlots(data.slots);
          // Show first 4 slots initially
          setSlots(data.slots.slice(0, slotsPerPage));
          setCurrentSlotPage(0);
        } else {
          // If no slots in current month, try to fetch soonest available slots
          console.log('No slots in current month, fetching soonest available slots...');
          const soonestResponse = await fetch(`${config.api.baseUrl}/experiences/${experience.id}/slots?sort=asc&per_page=10`, {
            headers
          });
          
          if (soonestResponse.ok) {
            const soonestData = await soonestResponse.json();
            console.log('Soonest slots data:', soonestData);
            
            if (soonestData.slots && soonestData.slots.length > 0) {
              setAllMonthSlots(soonestData.slots);
              setSlots(soonestData.slots.slice(0, slotsPerPage));
              setCurrentSlotPage(0);
              // Update current month to the month of the soonest slot
              const soonestSlotDate = new Date(soonestData.slots[0].date);
              setCurrentMonth(soonestSlotDate);
            } else {
              setAllMonthSlots([]);
              setSlots([]);
            }
          } else {
            setAllMonthSlots([]);
            setSlots([]);
          }
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setSlotsError(err.message);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [experience?.id, currentMonth]);

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
    setCurrentSlotPage(0); // Reset pagination when changing months
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

  // Pagination functions
  const loadMoreSlots = () => {
    const nextPage = currentSlotPage + 1;
    const startIndex = nextPage * slotsPerPage;
    const endIndex = startIndex + slotsPerPage;
    
    if (startIndex < allMonthSlots.length) {
      setSlots(allMonthSlots.slice(0, endIndex));
      setCurrentSlotPage(nextPage);
    }
  };

  const loadPreviousSlots = () => {
    if (currentSlotPage > 0) {
      const prevPage = currentSlotPage - 1;
      const endIndex = (prevPage + 1) * slotsPerPage;
      
      setSlots(allMonthSlots.slice(0, endIndex));
      setCurrentSlotPage(prevPage);
    }
  };

  const hasMoreSlots = () => {
    return (currentSlotPage + 1) * slotsPerPage < allMonthSlots.length;
  };

  const hasPreviousSlots = () => {
    return currentSlotPage > 0;
  };

  // Calendar modal functions
  const openFullscreenCalendar = () => {
    setShowFullscreenCalendar(true);
  };

  const closeFullscreenCalendar = () => {
    setShowFullscreenCalendar(false);
  };

  // Intersection Observer for scroll-based pagination
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreSlots()) {
          loadMoreSlots();
        }
      },
      { threshold: 0.1 }
    );
    
    if (slotsObserverRef) {
      observer.observe(slotsObserverRef);
    }
    
    return () => {
      if (slotsObserverRef) {
        observer.unobserve(slotsObserverRef);
      }
    };
  }, [slotsObserverRef, hasMoreSlots, loadMoreSlots]);

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
      const maxPeople = (selectedSlot?.capacity || 1) - (selectedSlot?.booked || 0);
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

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: experience?.title || 'Experience',
      text: experience?.description || 'Check out this amazing experience!',
      url: currentUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        // Use native Web Share API if available
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(currentUrl);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Final fallback: show URL for manual copying
      alert(`Share this link: ${currentUrl}`);
    }
  };

  // Reservation helper functions
  const updateNumberOfPeople = (count) => {
    const maxPeople = (selectedSlot?.capacity || 1) - (selectedSlot?.booked || 0);
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
    // Close EventSource if it exists
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setShowReservation(false);
    setReservationStep(1);
    setIsWaitingForPayment(false);
    setPaymentStatus('');
  };

  const handleReservationSubmit = async () => {
    try {
      setReservationLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please login to make a reservation');
      }

      const reservationPayload = {
        slot_id: selectedSlot.id,
        experience_id: experience.id,
        amount: reservationData.totalAmount.toString(),
        num_people: reservationData.numberOfPeople.toString(),
        mpesa_number: reservationData.mpesaNumber
      };
      const newEventSource = new EventSource(`${config.api.baseUrl}/events/${user?.id || 'anonymous'}`);
      setEventSource(newEventSource);

      console.log('Creating reservation request:', reservationPayload);

      const response = await fetch(`${config.api.baseUrl}/public/reservations_request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationPayload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reservation request');
      }

      const result = await response.json();
      console.log('Reservation request created:', result);

      // Start waiting for payment confirmation
      setIsWaitingForPayment(true);
      setPaymentStatus('Waiting for payment...');
      setReservationStep(4); // Move to payment status step

      // Set up EventSource for payment status updates AFTER successful API call
      newEventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("Payment event:", data);

        if (data.data?.state === "pending_confirmation") {
          setPaymentStatus("Processing payment...");
        }
        if (data.data?.state === "success") {
          setPaymentStatus("✅ Payment Successful!");
          // Don't close EventSource or reset states - let user decide when to close
        }
        if (data.data?.state === "failed") {
          setPaymentStatus("❌ Payment Failed!");
          // Don't close EventSource or reset states - let user decide when to close
        }
      };

      newEventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setPaymentStatus("❌ Connection Error");
        // Don't automatically close - let user decide
      };
      
      // Keep the modal open and let EventSource handle status updates
      
    } catch (err) {
      console.error('Reservation error:', err);
      alert(err.message);
      // Close EventSource on error
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      setReservationLoading(false); // Only set loading false on error
    }
    // Don't set loading false on success - user should stay on payment status step
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
      {!isMobile && <Header />}
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
              {/* <span className="status-text">{experience?.status || 'Available'}</span> */}
            </div>
          </div>
          
          <motion.button
            className="experience-detail-share"
            onClick={handleShare}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Share this experience"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 1 1 5.367-2.684 3 3 0 0 1-5.367 2.684zm0 9.316a3 3 0 1 1 5.367-2.684 3 3 0 0 1-5.367 2.684z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </motion.div>

        {/* Image Gallery */}
        <motion.div 
          className={`image-gallery ${!experience?.images || experience.images.length === 0 ? 'single-image' : ''}`}
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
                <h3 className="host-name">Provided by {experience?.provider?.name || 'Unknown Host'}</h3>
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
            {experience?.activities && experience.activities.length > 0 && (
              <motion.div 
                className="highlights-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="section-title">Activities</h2>
                <ul className="highlights-list">
                  {experience.activities.map((activity, index) => (
                    <li key={index} className="highlight-item">{activity}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Destinations */}
            {experience?.destinations && experience.destinations.length > 0 && (
              <motion.div 
                className="highlights-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <h2 className="section-title">Destinations</h2>
                <ul className="highlights-list">
                  {experience.destinations.map((destination, index) => (
                    <li key={index} className="highlight-item">{destination}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Inclusions */}
            {experience?.inclusions && experience.inclusions.length > 0 && (
              <motion.div 
                className="highlights-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h2 className="section-title">What's Included</h2>
                <ul className="highlights-list">
                  {experience.inclusions.map((inclusion, index) => (
                    <li key={index} className="highlight-item">{inclusion}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Exclusions */}
            {experience?.exclusions && experience.exclusions.length > 0 && (
              <motion.div 
                className="highlights-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.52 }}
              >
                <h2 className="section-title">What's Not Included</h2>
                <ul className="highlights-list">
                  {experience.exclusions.map((exclusion, index) => (
                    <li key={index} className="highlight-item">{exclusion}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Where we'll meet */}
            <motion.div 
              className="meeting-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.57 }}
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
              
              {/* Calendar View Toggle */}
              <div className="slots-view-controls">
                <button
                  onClick={openFullscreenCalendar}
                  className="view-toggle-btn"
                >
                  Show Dates
                </button>
              </div>

              {/* List View */}
              {slotsLoading ? (
                <div className="slots-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading available slots...</p>
                </div>
              ) : slotsError ? (
                <div className="slots-error">
                  <p>Error loading slots: {slotsError}</p>
                  <button onClick={() => window.location.reload()} className="retry-btn">
                    Retry
                  </button>
                </div>
              ) : slots.length > 0 ? slots.map((slot) => (
                <motion.div
                  key={slot.id}
                  className={`slot-item ${selectedSlot?.id === slot.id ? 'selected' : ''} ${(slot?.booked || 0) >= (slot?.capacity || 0) ? 'unavailable' : ''}`}
                  onClick={() => (slot?.booked || 0) < (slot?.capacity || 0) && handleSlotSelect(slot)}
                  whileHover={(slot?.booked || 0) < (slot?.capacity || 0) ? { scale: 1.02 } : {}}
                  whileTap={(slot?.booked || 0) < (slot?.capacity || 0) ? { scale: 0.98 } : {}}
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
                    {(slot?.booked || 0) < (slot?.capacity || 0) ? (
                      <span className="available-text">{(slot?.capacity || 0) - (slot?.booked || 0)} spots left</span>
                    ) : (
                      <span className="unavailable-text">Fully booked</span>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div className="no-slots">
                  <p>No time slots available for this month.</p>
                  <button onClick={() => navigateMonth(1)} className="next-month-btn">
                    Check Next Month
                  </button>
                </div>
              )}
              
              {/* Scroll-based Loading */}
              {hasMoreSlots() && (
                <div ref={setSlotsObserverRef} className="slots-loading-trigger">
                  <div className="loading-spinner"></div>
                  <span>Loading more slots...</span>
                </div>
              )}
              
              {/* End indicator */}
              {!hasMoreSlots() && allMonthSlots.length > slotsPerPage && (
                <div className="slots-end-indicator">
                  All slots loaded ({allMonthSlots.length} total)
                </div>
              )}
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
                    {[1, 2, 3, 4].map((step) => (
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
                          {step === 4 && 'Status'}
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
                              disabled={reservationData.numberOfPeople >= ((selectedSlot?.capacity || 1) - (selectedSlot?.booked || 0))}
                            >
                              +
                            </button>
                          </div>
                          <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '14px', textAlign: 'center' }}>
                            Maximum {(selectedSlot?.capacity || 0) - (selectedSlot?.booked || 0)} people available for this slot
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
                            <li>Click &quot;Submit Reservation Request&quot; below</li>
                            <li>Your request will be processed by our backend</li>
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
                            disabled={!reservationData.mpesaNumber || reservationLoading}
                            className="reservation-btn reservation-btn-success"
                          >
                            {reservationLoading ? (
                              <>
                                <span className="reservation-spinner"></span>
                                Processing...
                              </>
                            ) : (
                              'Submit Reservation Request'
                            )}
                          </button>
                        </div>
                    </motion.div>
                  )}

                  {reservationStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="reservation-step-title">
                        Payment Status
                      </h3>
                      
                      <div className="reservation-payment-status">
                        <div className="payment-status-card">
                          <div className="payment-status-icon">
                            {paymentStatus.includes('✅') ? (
                              <div className="status-success">✅</div>
                            ) : paymentStatus.includes('❌') ? (
                              <div className="status-error">❌</div>
                            ) : (
                              <div className="status-loading">
                                <div className="payment-spinner"></div>
                              </div>
                            )}
                          </div>
                          <div className="payment-status-content">
                            <h4 className="payment-status-title">{paymentStatus}</h4>
                            <p className="payment-status-message">
                              {paymentStatus.includes('✅') 
                                ? 'Your reservation has been confirmed! You will receive a confirmation email shortly.'
                                : paymentStatus.includes('❌')
                                ? 'Payment failed. Please try again or contact support.'
                                : 'Please check your phone for the M-Pesa prompt and complete the payment.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="reservation-btn-group">
                        {paymentStatus.includes('✅') ? (
                          <button
                            onClick={() => {
                              // Close EventSource when user manually closes
                              if (eventSource) {
                                eventSource.close();
                                setEventSource(null);
                              }
                              setShowReservation(false);
                              setReservationStep(1);
                              setIsWaitingForPayment(false);
                              setPaymentStatus('');
                            }}
                            className="reservation-btn reservation-btn-success"
                          >
                            Close
                          </button>
                        ) : paymentStatus.includes('❌') ? (
                          <>
                            <button
                              onClick={() => {
                                // Close EventSource and go back to payment step
                                if (eventSource) {
                                  eventSource.close();
                                }
                                setReservationStep(3);
                                setIsWaitingForPayment(false);
                                setPaymentStatus('');
                              }}
                              className="reservation-btn reservation-btn-secondary"
                            >
                              Try Again
                            </button>
                            <button
                              onClick={() => {
                                // Close EventSource when user manually closes
                                if (eventSource) {
                                  eventSource.close();
                                }
                                setShowReservation(false);
                                setReservationStep(1);
                                setIsWaitingForPayment(false);
                                setPaymentStatus('');
                              }}
                              className="reservation-btn reservation-btn-primary"
                            >
                              Close
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              // Close EventSource when user manually closes
                              if (eventSource) {
                                eventSource.close();
                                setEventSource(null);
                              }
                              setShowReservation(false);
                              setReservationStep(1);
                              setIsWaitingForPayment(false);
                              setPaymentStatus('');
                            }}
                            className="reservation-btn reservation-btn-secondary"
                          >
                            Close (Payment in Progress)
                          </button>
                        )}
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

      {/* Calendar Modal */}
      <AnimatePresence>
        {showFullscreenCalendar && (
          <motion.div
            className="calendar-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFullscreenCalendar}
          >
            <motion.div
              className="calendar-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="calendar-modal-header">
                <h2 className="calendar-modal-title">
                  Select Your Date - {experience?.title}
                </h2>
                <button
                  onClick={closeFullscreenCalendar}
                  className="calendar-modal-close"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <div className="calendar-modal-content">
                {/* Calendar View */}
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
                      const dateStr = date.toISOString().split('T')[0];
                      const daySlots = getSlotsForDate(dateStr);
                      const hasSlots = daySlots.length > 0;
                      const isSelected = selectedDate === dateStr;
                      
                      return (
                        <div
                          key={day}
                          className={`calendar-day ${hasSlots ? 'has-slots' : ''} ${isToday(date) ? 'today' : ''} ${isPastDate(date) ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => hasSlots && !isPastDate(date) && setSelectedDate(dateStr)}
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
                            className={`slot-item ${selectedSlot?.id === slot.id ? 'selected' : ''} ${(slot?.booked || 0) >= (slot?.capacity || 0) ? 'unavailable' : ''}`}
                            onClick={() => (slot?.booked || 0) < (slot?.capacity || 0) && handleSlotSelect(slot)}
                            whileHover={(slot?.booked || 0) < (slot?.capacity || 0) ? { scale: 1.02 } : {}}
                            whileTap={(slot?.booked || 0) < (slot?.capacity || 0) ? { scale: 0.98 } : {}}
                          >
                            <div className="slot-header">
                              <span className="slot-name">{slot?.name || 'Unnamed Slot'}</span>
                              <span className="slot-price">KSh {slot?.price?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="slot-details">
                              <span className="slot-time">
                                {slot?.start_time && slot?.end_time 
                                  ? `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
                                  : 'Time TBD'
                                }
                              </span>
                            </div>
                            <div className="slot-availability">
                              {(slot?.booked || 0) < (slot?.capacity || 0) ? (
                                <span className="available-text">{(slot?.capacity || 0) - (slot?.booked || 0)} spots left</span>
                              ) : (
                                <span className="unavailable-text">Fully booked</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Continue to Book Button */}
                      {selectedSlot && (
                        <div className="calendar-continue-booking">
                          <button
                            onClick={() => {
                              closeFullscreenCalendar();
                              handleBooking();
                            }}
                            className="continue-book-btn"
                          >
                            Book {selectedSlot?.name || 'Selected Slot'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
