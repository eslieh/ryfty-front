"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SkeletonLoader, { ExperienceDetailSkeleton } from "@/components/SkeletonLoader";
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
    customerPhone: '',
    isBNPL: false,
    partialAmount: 0,
    remainingAmount: 0
  });
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [paymentTimeout, setPaymentTimeout] = useState(null);

  // Payment timeout configuration (in milliseconds)
  const PAYMENT_TIMEOUT_DURATION = 300000; // 5 minutes (300 seconds)

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 1,
    per_page: 5,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  // Sticky booking card states
  const [isBookingCardSticky, setIsBookingCardSticky] = useState(false);
  const [bookingCardRef, setBookingCardRef] = useState(null);
  const [reviewsEndRef, setReviewsEndRef] = useState(null);

  // Mobile bottom bar states
  const [showMobileSlots, setShowMobileSlots] = useState(false);

  // Mobile image slider states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
  }, []);

  // Fetch slots separately - only if authenticated
  useEffect(() => {
    const fetchSlots = async () => {
      if (!experience?.id) return;
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        setSlotsLoading(false);
        setSlotsError('Authentication required');
        setSlots([]);
        setAllMonthSlots([]);
        return;
      }
      
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
        
        // Get current month start and end dates, but start from today if we're in the current month
        const today = new Date();
        const startDate = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()
          ? today
          : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
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
          // Filter out past dates on the client side as well
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
          
          const upcomingSlots = data.slots.filter(slot => {
            const slotDate = new Date(slot.date);
            slotDate.setHours(0, 0, 0, 0); // Reset time to start of day
            return slotDate >= today;
          });
          
          console.log('Filtered upcoming slots:', upcomingSlots);
          
          setAllMonthSlots(upcomingSlots);
          // Show first 4 slots initially
          setSlots(upcomingSlots.slice(0, slotsPerPage));
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
              // Filter out past dates from soonest slots as well
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcomingSoonestSlots = soonestData.slots.filter(slot => {
                const slotDate = new Date(slot.date);
                slotDate.setHours(0, 0, 0, 0);
                return slotDate >= today;
              });
              
              console.log('Filtered upcoming soonest slots:', upcomingSoonestSlots);
              
              if (upcomingSoonestSlots.length > 0) {
                setAllMonthSlots(upcomingSoonestSlots);
                setSlots(upcomingSoonestSlots.slice(0, slotsPerPage));
                setCurrentSlotPage(0);
                // Update current month to the month of the soonest upcoming slot
                const soonestSlotDate = new Date(upcomingSoonestSlots[0].date);
                setCurrentMonth(soonestSlotDate);
              } else {
                setAllMonthSlots([]);
                setSlots([]);
              }
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
  }, [experience?.id, currentMonth, isAuthenticated]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!experience?.id) return;
      
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('Fetching reviews for experience:', experience.id);
        const response = await fetch(`${config.api.baseUrl}/experiences/${experience.id}/reviews?page=1&per_page=5`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Reviews data:', data);
        
        if (data.reviews) {
          setReviews(data.reviews);
          setReviewsPagination(data.pagination);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviewsError(err.message);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [experience?.id]);

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
  
  // Cookie management functions
  const setExperienceRedirectCookie = (experienceId) => {
    const cookieValue = JSON.stringify({
      experienceId: experienceId,
      timestamp: Date.now()
    });
    document.cookie = `experience_redirect=${cookieValue}; path=/; max-age=3600; samesite=strict`; // 1 hour expiry
  };

  const getExperienceRedirectCookie = () => {
    const cookies = document.cookie.split(';');
    const redirectCookie = cookies.find(cookie => cookie.trim().startsWith('experience_redirect='));
    if (redirectCookie) {
      try {
        const cookieValue = redirectCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch (err) {
        console.error('Error parsing redirect cookie:', err);
        return null;
      }
    }
    return null;
  };

  const clearExperienceRedirectCookie = () => {
    document.cookie = 'experience_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // Check for redirect cookie on authentication change
  useEffect(() => {
    if (isAuthenticated && experience?.id) {
      const redirectData = getExperienceRedirectCookie();
      if (redirectData && redirectData.experienceId === experience.id) {
        // Clear the cookie since we're now on the correct page
        clearExperienceRedirectCookie();
      }
    }
  }, [isAuthenticated, experience?.id]);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const slotDate = new Date(dateStr);
    slotDate.setHours(0, 0, 0, 0);
    
    // Only return slots for upcoming dates
    if (slotDate < today) {
      return [];
    }
    
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

  // Auto-navigate to next month if current month has no upcoming slots
  useEffect(() => {
    if (allMonthSlots.length === 0 && !slotsLoading && !slotsError) {
      const today = new Date();
      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      // If we're in the current month and it has no upcoming slots, navigate to next month
      if (currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()) {
        console.log('No upcoming slots in current month, navigating to next month');
        navigateMonth(1);
      }
    }
  }, [allMonthSlots, slotsLoading, slotsError, currentMonth]);

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

  // Intersection Observer for sticky booking card
  useEffect(() => {
    if (!bookingCardRef || !reviewsEndRef) return;

    const bookingCardObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // When booking card enters viewport, make it sticky
        if (entry.isIntersecting) {
          setIsBookingCardSticky(true);
        }
      },
      { 
        threshold: 0,
        rootMargin: '0px 0px 0px 0px'
      }
    );

    const reviewsEndObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // When reviews end enters viewport, unstick the booking card
        if (entry.isIntersecting) {
          setIsBookingCardSticky(false);
        }
      },
      { 
        threshold: 0,
        rootMargin: '0px 0px 0px 0px'
      }
    );

    bookingCardObserver.observe(bookingCardRef);
    reviewsEndObserver.observe(reviewsEndRef);

    return () => {
      bookingCardObserver.disconnect();
      reviewsEndObserver.disconnect();
    };
  }, [bookingCardRef, reviewsEndRef]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      // Store experience ID in cookie for redirect after login
      setExperienceRedirectCookie(experience?.id);
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
      const totalAmount = selectedSlot.price * initialPeople;
      setReservationData({
        numberOfPeople: initialPeople,
        totalAmount: totalAmount,
        mpesaNumber: '',
        customerName: user?.name || '',
        customerEmail: user?.email || '',
        customerPhone: user?.phone || '',
        isBNPL: false,
        partialAmount: totalAmount,
        remainingAmount: 0
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

  // Load more reviews function
  const loadMoreReviews = async () => {
    if (!reviewsPagination.has_next || loadingMoreReviews) return;
    
    try {
      setLoadingMoreReviews(true);
      
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const nextPage = reviewsPagination.page + 1;
      console.log('Loading more reviews, page:', nextPage);
      
      const response = await fetch(`${config.api.baseUrl}/experiences/${experience.id}/reviews?page=${nextPage}&per_page=${reviewsPagination.per_page}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more reviews: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('More reviews data:', data);
      
      if (data.reviews) {
        setReviews(prevReviews => [...prevReviews, ...data.reviews]);
        setReviewsPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error loading more reviews:', err);
      alert('Failed to load more reviews. Please try again.');
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  // Mobile image navigation functions
  const nextImage = () => {
    const allImages = [experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    const allImages = [experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean);
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Reservation helper functions
  const updateNumberOfPeople = (count) => {
    const maxPeople = (selectedSlot?.capacity || 1) - (selectedSlot?.booked || 0);
    const newCount = Math.max(1, Math.min(count, maxPeople));
    const newTotal = selectedSlot.price * newCount;
    setReservationData(prev => ({
      ...prev,
      numberOfPeople: newCount,
      totalAmount: newTotal,
      partialAmount: prev.isBNPL ? prev.partialAmount : newTotal,
      remainingAmount: prev.isBNPL ? newTotal - prev.partialAmount : 0
    }));
  };

  const handleReservationInputChange = (field, value) => {
    setReservationData(prev => {
      const updated = { ...prev, [field]: value };
      
      // If BNPL is toggled or partial amount changes, recalculate remaining amount
      if (field === 'isBNPL' || field === 'partialAmount') {
        if (field === 'isBNPL') {
          updated.partialAmount = value ? Math.floor(updated.totalAmount * 0.5) : updated.totalAmount;
        }
        updated.remainingAmount = updated.totalAmount - updated.partialAmount;
      }
      
      return updated;
    });
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
    // Clear payment timeout if it exists
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }
    setShowReservation(false);
    setReservationStep(1);
    setIsWaitingForPayment(false);
    setPaymentStatus('');
    setRedirectCountdown(0);
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
        amount: reservationData.isBNPL ? reservationData.partialAmount.toString() : reservationData.totalAmount.toString(),
        total_amount: reservationData.totalAmount.toString(),
        num_people: reservationData.numberOfPeople.toString(),
        mpesa_number: reservationData.mpesaNumber,
        is_bnpl: reservationData.isBNPL,
        remaining_amount: reservationData.isBNPL ? reservationData.remainingAmount.toString() : '0'
      };
      const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
      const newEventSource = new EventSource(`${baseUrl}/events/${user?.id || 'anonymous'}`);
      setEventSource(newEventSource);

      console.log('Creating reservation request:', reservationPayload);

      const response = await fetch(`${baseUrl}/public/reservations_request`, {
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

      // Set up timeout for payment response
      const timeoutId = setTimeout(() => {
        console.log('Payment timeout reached');
        setPaymentStatus("⏰ Payment Timeout - Please check your phone or try again");
        // Close EventSource on timeout
        if (newEventSource) {
          newEventSource.close();
          setEventSource(null);
        }
      }, PAYMENT_TIMEOUT_DURATION);
      
      setPaymentTimeout(timeoutId);

      // Set up EventSource for payment status updates AFTER successful API call
      newEventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("Payment event:", data);

        // Clear timeout when we receive any payment status update
        if (paymentTimeout) {
          clearTimeout(paymentTimeout);
          setPaymentTimeout(null);
        }

        if (data.data?.state === "pending_confirmation") {
          setPaymentStatus("Processing payment...");
        }
        if (data.data?.state === "success") {
          setPaymentStatus("✅ Payment Successful!");
          
          // Update slot availability locally to reflect the new booking
          if (selectedSlot) {
            const updatedSlots = slots.map(slot => {
              if (slot.id === selectedSlot.id) {
                return {
                  ...slot,
                  booked: (slot.booked || 0) + reservationData.numberOfPeople
                };
              }
              return slot;
            });
            setSlots(updatedSlots);
            
            // Also update the allMonthSlots to keep consistency
            const updatedAllMonthSlots = allMonthSlots.map(slot => {
              if (slot.id === selectedSlot.id) {
                return {
                  ...slot,
                  booked: (slot.booked || 0) + reservationData.numberOfPeople
                };
              }
              return slot;
            });
            setAllMonthSlots(updatedAllMonthSlots);
            
            // Update selectedSlot to reflect new availability
            setSelectedSlot(prev => ({
              ...prev,
              booked: (prev.booked || 0) + reservationData.numberOfPeople
            }));
          }
          
          // Start countdown for redirect
          setRedirectCountdown(3);
          const countdownInterval = setInterval(() => {
            setRedirectCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                router.push('/reservations');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        if (data.data?.state === "failed") {
          setPaymentStatus("❌ Payment Failed!");
          // Don't close EventSource or reset states - let user decide when to close
        }
      };

      newEventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setPaymentStatus("❌ Connection Error");
        // Clear timeout on error
        if (paymentTimeout) {
          clearTimeout(paymentTimeout);
          setPaymentTimeout(null);
        }
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
      // Clear timeout on error
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
        setPaymentTimeout(null);
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

        {/* Title and Favorite - Desktop Only */}
        {!isMobile && (
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
          </motion.div>
        )}

        {/* Image Gallery */}
        <motion.div 
          className={`image-gallery ${!experience?.images || experience.images.length === 0 ? 'single-image' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Mobile Header Overlay */}
          {isMobile && (
            <div className="mobile-image-header">
              <button 
                className="mobile-back-btn"
                onClick={() => router.push('/')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="mobile-share-btn"
                onClick={handleShare}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 1 1 5.367-2.684 3 3 0 0 1-5.367 2.684zm0 9.316a3 3 0 1 1 5.367-2.684 3 3 0 0 1-5.367 2.684z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* Mobile Image Slider */}
          {isMobile ? (
            <div className="mobile-image-slider">
              <div className="mobile-slider-container">
                <div 
                  className="mobile-slider-track"
                  style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                >
                  {[experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean).map((img, index) => (
                    <div key={index} className="mobile-slider-slide">
                      <Image
                        src={img?.url || img || '/placeholder-image.jpg'}
                        alt={`${experience?.title || 'Experience'} ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="mobile-slider-image"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Navigation Arrows */}
                {[experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean).length > 1 && (
                  <>
                    <button 
                      className="mobile-slider-arrow mobile-slider-arrow-left"
                      onClick={prevImage}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button 
                      className="mobile-slider-arrow mobile-slider-arrow-right"
                      onClick={nextImage}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Image Counter */}
              {[experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean).length > 1 && (
                <div className="mobile-image-counter">
                  {currentImageIndex + 1}/{[experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean).length}
                </div>
              )}
              
              {/* Image Dots */}
              {[experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean).length > 1 && (
                <div className="mobile-image-dots">
                  {[experience?.poster_image_url, ...(experience?.images || [])].filter(Boolean).map((_, index) => (
                    <button
                      key={index}
                      className={`mobile-image-dot ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => goToImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Desktop Image Gallery */
            <>
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
            </>
          )}
        </motion.div>

        {/* Mobile Experience Header - After Images */}
        {isMobile && (
          <motion.div 
            className="mobile-experience-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mobile-experience-title-section">
              <h1 className="mobile-experience-title">{experience?.title || 'Experience'}</h1>
              <div className="mobile-experience-meta">
                <span className="mobile-location-text">{experience?.destinations?.join(', ') || 'Location not specified'}</span>
              </div>
            </div>
          </motion.div>
        )}

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
              {experience?.meeting_point?.coordinates?.latitude && experience?.meeting_point?.coordinates?.longitude && (
                <div className="map-container">
                  <div className="map-header">
                    <h3 className="map-title">Meeting Location</h3>
                    <div className="map-actions">
                      <button
                        className="directions-btn"
                        onClick={() => {
                          const lat = experience.meeting_point.coordinates.latitude;
                          const lng = experience.meeting_point.coordinates.longitude;
                          const address = encodeURIComponent(experience.meeting_point.address || '');
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${address}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Get Directions
                      </button>
                      <button
                        className="map-expand-btn"
                        onClick={() => {
                          const lat = experience.meeting_point.coordinates.latitude;
                          const lng = experience.meeting_point.coordinates.longitude;
                          const url = `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15`;
                          window.open(url, '_blank');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Open in Maps
                      </button>
                    </div>
                  </div>
                  <div className="map-iframe-container">
                    <iframe
                      src={`https://www.google.com/maps?q=${experience.meeting_point.coordinates.latitude},${experience.meeting_point.coordinates.longitude}&hl=en&z=15&output=embed`}
                      width="100%"
                      height="300"
                      style={{ border: 0, borderRadius: '8px' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map showing ${experience.meeting_point.name}`}
                    ></iframe>
                  </div>
                  <div className="map-footer">
                    <p className="map-note">
                      📍 Click "Get Directions" to navigate to this location using your preferred maps app
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Reviews Section */}
            <motion.div 
              className="reviews-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="section-title">Reviews</h2>
              
              {reviewsLoading ? (
                <div className="reviews-skeleton">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="review-skeleton-item">
                      <div className="review-skeleton-header">
                        <div className="review-skeleton-user">
                          <SkeletonLoader variant="circular" width="40px" height="40px" />
                          <div className="review-skeleton-user-info">
                            <SkeletonLoader width="120px" height="16px" borderRadius="4px" />
                            <SkeletonLoader width="80px" height="12px" borderRadius="4px" style={{ marginTop: '4px' }} />
                          </div>
                        </div>
                        <div className="review-skeleton-rating">
                          <SkeletonLoader width="80px" height="16px" borderRadius="4px" />
                        </div>
                      </div>
                      <div className="review-skeleton-content">
                        <SkeletonLoader width="100%" height="16px" borderRadius="4px" />
                        <SkeletonLoader width="100%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                        <SkeletonLoader width="75%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviewsError ? (
                <div className="reviews-error">
                  <p>Error loading reviews: {reviewsError}</p>
                  <button onClick={() => window.location.reload()} className="retry-btn">
                    Retry
                  </button>
                </div>
              ) : reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      className="review-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="review-header">
                        <div className="review-user">
                          <div className="review-avatar">
                            <Image
                              src={review.user?.avatar_url || config.defaultAvatar}
                              alt={review.user?.name || 'User'}
                              width={40}
                              height={40}
                              className="review-avatar-image"
                            />
                          </div>
                          <div className="review-user-info">
                            <h4 className="review-user-name">{review.user?.name || 'Anonymous'}</h4>
                            <p className="review-date">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`star ${i < review.rating ? 'filled' : 'empty'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="review-content">
                        <p className="review-comment">{review.comment}</p>
                        
                        {review.images && review.images.length > 0 && (
                          <div className="review-images">
                            <div className="review-image-group">
                              {review.images.map((imageUrl, imageIndex) => (
                                <div key={imageIndex} className="review-image-item">
                                  <Image
                                    src={imageUrl}
                                    alt={`Review image ${imageIndex + 1}`}
                                    width={120}
                                    height={120}
                                    className="review-image"
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Load More Reviews Button */}
                  {reviewsPagination.has_next && (
                    <div className="reviews-load-more">
                      <button
                        onClick={loadMoreReviews}
                        disabled={loadingMoreReviews}
                        className="load-more-reviews-btn"
                      >
                        {loadingMoreReviews ? (
                          <>
                            <span className="loading-spinner"></span>
                            Loading more reviews...
                          </>
                        ) : (
                          `Load More Reviews (${reviewsPagination.total_count - reviews.length} remaining)`
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Reviews Summary */}
                  <div className="reviews-summary">
                    <p className="reviews-count">
                      Showing {reviews.length} of {reviewsPagination.total_count} reviews
                    </p>
                  </div>
                  
                  {/* Reviews End Marker */}
                  <div ref={setReviewsEndRef} className="reviews-end-marker"></div>
                </div>
              ) : (
                <div className="no-reviews">
                  <div className="no-reviews-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="no-reviews-title">No reviews yet</h4>
                  <p className="no-reviews-message">
                    Be the first to share your experience!
                  </p>
                  {/* Reviews End Marker for no reviews */}
                  <div ref={setReviewsEndRef} className="reviews-end-marker"></div>
                </div>
              )}
            </motion.div>

          </div>

          {/* Booking Card */}
          <motion.div 
            ref={setBookingCardRef}
            className={`booking-card ${isBookingCardSticky ? 'sticky' : ''} ${isMobile ? 'mobile-hidden' : ''}`}
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
                  onClick={() => {
                    if (!isAuthenticated) {
                      setExperienceRedirectCookie(experience?.id);
                      router.push('/auth');
                    } else {
                      openFullscreenCalendar();
                    }
                  }}
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
              ) : slotsError === 'Authentication required' ? (
                <div className="slots-auth-required">
                  <div className="auth-required-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="auth-required-title">Login Required</h4>
                  <p className="auth-required-message">
                    Please log in to view available time slots and make a reservation.
                  </p>
                  <button 
                    onClick={() => {
                      setExperienceRedirectCookie(experience?.id);
                      router.push('/auth');
                    }}
                    className="auth-required-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Login to Continue
                  </button>
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
                  <p>No upcoming time slots available for this month.</p>
                  <button 
                    onClick={() => {
                      if (!isAuthenticated) {
                        setExperienceRedirectCookie(experience?.id);
                        router.push('/auth');
                      } else {
                        navigateMonth(1);
                      }
                    }} 
                    className="next-month-btn"
                  >
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

      {/* Mobile Bottom Bar */}
      {isMobile && (
        <motion.div 
          className="mobile-bottom-bar"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mobile-bottom-content">
            <div className="mobile-price-info">
              <span className="mobile-price-range">
                From KSh {experience?.min_price?.toLocaleString() || '0'} to KSh {experience?.max_price?.toLocaleString() || '0'}
              </span>
            </div>
            <button 
              className="mobile-view-dates-btn"
              onClick={() => setShowMobileSlots(!showMobileSlots)}
            >
              {showMobileSlots ? 'Hide Dates' : 'View Dates'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Mobile Slots Modal */}
      {isMobile && showMobileSlots && (
        <motion.div
          className="mobile-slots-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowMobileSlots(false)}
        >
          <motion.div
            className="mobile-slots-content"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-slots-header">
              <h3 className="mobile-slots-title">Select a time slot</h3>
              <div className="mobile-slots-header-actions">
                <button 
                  className="mobile-calendar-btn"
                  onClick={() => {
                    setShowMobileSlots(false);
                    openFullscreenCalendar();
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 13H8.01M12 13H12.01M16 13H16.01M8 17H8.01M12 17H12.01M16 17H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Calendar
                </button>
                <button 
                  className="mobile-slots-close"
                  onClick={() => setShowMobileSlots(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="mobile-slots-body">
              {slotsLoading ? (
                <div className="mobile-slots-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading available slots...</p>
                </div>
              ) : slotsError === 'Authentication required' ? (
                <div className="mobile-slots-auth-required">
                  <div className="auth-required-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="auth-required-title">Login Required</h4>
                  <p className="auth-required-message">
                    Please log in to view available time slots and make a reservation.
                  </p>
                  <button 
                    onClick={() => {
                      setExperienceRedirectCookie(experience?.id);
                      router.push('/auth');
                    }}
                    className="auth-required-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Login to Continue
                  </button>
                </div>
              ) : slotsError ? (
                <div className="mobile-slots-error">
                  <p>Error loading slots: {slotsError}</p>
                  <button onClick={() => window.location.reload()} className="retry-btn">
                    Retry
                  </button>
                </div>
              ) : slots.length > 0 ? (
                <div className="mobile-slots-list">
                  {slots.map((slot) => (
                    <motion.div
                      key={slot.id}
                      className={`mobile-slot-item ${selectedSlot?.id === slot.id ? 'selected' : ''} ${(slot?.booked || 0) >= (slot?.capacity || 0) ? 'unavailable' : ''}`}
                      onClick={() => (slot?.booked || 0) < (slot?.capacity || 0) && handleSlotSelect(slot)}
                      whileHover={(slot?.booked || 0) < (slot?.capacity || 0) ? { scale: 1.02 } : {}}
                      whileTap={(slot?.booked || 0) < (slot?.capacity || 0) ? { scale: 0.98 } : {}}
                    >
                      <div className="mobile-slot-header">
                        <span className="mobile-slot-name">{slot?.name || 'Unnamed Slot'}</span>
                        <span className="mobile-slot-price">KSh {slot?.price?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="mobile-slot-details">
                        <span className="mobile-slot-date">{slot?.date ? formatDate(slot.date) : 'Date TBD'}</span>
                        <span className="mobile-slot-time">
                          {slot?.start_time && slot?.end_time 
                            ? `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
                            : 'Time TBD'
                          }
                        </span>
                      </div>
                      <div className="mobile-slot-availability">
                        {(slot?.booked || 0) < (slot?.capacity || 0) ? (
                          <span className="available-text">{(slot?.capacity || 0) - (slot?.booked || 0)} spots left</span>
                        ) : (
                          <span className="unavailable-text">Fully booked</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Load More Slots */}
                  {hasMoreSlots() && (
                    <div className="mobile-load-more-slots">
                      <button
                        onClick={loadMoreSlots}
                        disabled={slotsLoading}
                        className="mobile-load-more-btn"
                      >
                        {slotsLoading ? 'Loading...' : 'Load More Slots'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mobile-no-slots">
                  <p>No upcoming time slots available for this month.</p>
                  <button 
                    onClick={() => {
                      if (!isAuthenticated) {
                        setExperienceRedirectCookie(experience?.id);
                        router.push('/auth');
                      } else {
                        navigateMonth(1);
                      }
                    }} 
                    className="mobile-next-month-btn"
                  >
                    Check Next Month
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Book Button */}
            {selectedSlot && (
              <div className="mobile-book-section">
                <button 
                  className="mobile-book-button"
                  onClick={() => {
                    setShowMobileSlots(false);
                    handleBooking();
                  }}
                >
                  Book {selectedSlot?.name || 'Selected Slot'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

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

                        {/* BNPL Option */}
                        <div className="reservation-form-group">
                          <div className="reservation-bnpl-option">
                            <label className="reservation-checkbox-label">
                              <input
                                type="checkbox"
                                checked={reservationData.isBNPL}
                                onChange={(e) => handleReservationInputChange('isBNPL', e.target.checked)}
                                className="reservation-checkbox"
                              />
                              <span className="reservation-checkbox-text">
                                Pay Later (BNPL) - Pay partial amount now, remaining later
                              </span>
                            </label>
                            {reservationData.isBNPL && (
                              <div className="reservation-bnpl-details">
                                <div className="reservation-form-group">
                                  <label className="reservation-form-label">
                                    Amount to Pay Now
                                  </label>
                                  <input
                                    type="number"
                                    value={reservationData.partialAmount}
                                    onChange={(e) => handleReservationInputChange('partialAmount', parseInt(e.target.value) || 0)}
                                    className="reservation-form-input"
                                    min="1"
                                    max={reservationData.totalAmount}
                                    placeholder="Enter amount to pay now"
                                  />
                                  <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
                                    Minimum: KSh 1, Maximum: KSh {reservationData.totalAmount.toLocaleString()}
                                  </p>
                                </div>
                                <div className="reservation-bnpl-summary">
                                  <div className="reservation-bnpl-row">
                                    <span className="reservation-bnpl-label">Amount to Pay Now:</span>
                                    <span className="reservation-bnpl-amount">KSh {reservationData.partialAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="reservation-bnpl-row">
                                    <span className="reservation-bnpl-label">Remaining Amount:</span>
                                    <span className="reservation-bnpl-amount">KSh {reservationData.remainingAmount.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={nextReservationStep}
                          disabled={!reservationData.customerName || !reservationData.customerEmail || !reservationData.customerPhone || (reservationData.isBNPL && (reservationData.partialAmount <= 0 || reservationData.partialAmount > reservationData.totalAmount))}
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
                          
                          {reservationData.isBNPL && (
                            <div className="reservation-confirmation-bnpl">
                              <div className="reservation-confirmation-row">
                                <span className="reservation-confirmation-label">Payment Method:</span>
                                <span className="reservation-confirmation-value">Buy Now Pay Later (BNPL)</span>
                              </div>
                              <div className="reservation-confirmation-row">
                                <span className="reservation-confirmation-label">Amount to Pay Now:</span>
                                <span className="reservation-confirmation-value">KSh {reservationData.partialAmount.toLocaleString()}</span>
                              </div>
                              <div className="reservation-confirmation-row">
                                <span className="reservation-confirmation-label">Remaining Amount:</span>
                                <span className="reservation-confirmation-value">KSh {reservationData.remainingAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
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
                              KSh {reservationData.isBNPL ? reservationData.partialAmount.toLocaleString() : reservationData.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          {reservationData.isBNPL && (
                            <div className="reservation-payment-bnpl-info">
                              <div className="reservation-payment-row">
                                <span className="reservation-payment-label">Total Experience Cost:</span>
                                <span className="reservation-payment-amount">KSh {reservationData.totalAmount.toLocaleString()}</span>
                              </div>
                              <div className="reservation-payment-row">
                                <span className="reservation-payment-label">Remaining Amount:</span>
                                <span className="reservation-payment-amount">KSh {reservationData.remainingAmount.toLocaleString()}</span>
                              </div>
                              <p className="reservation-payment-bnpl-note">
                                💡 You'll pay the remaining amount later. Payment details will be sent to your email.
                              </p>
                            </div>
                          )}
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
                            {reservationData.isBNPL && (
                              <li>📧 Payment details for the remaining amount will be sent to your email</li>
                            )}
                          </ol>
                          {reservationData.isBNPL && (
                            <div className="reservation-bnpl-instructions">
                              <h5 className="reservation-bnpl-title">About Buy Now Pay Later:</h5>
                              <ul className="reservation-bnpl-list">
                                <li>You're paying KSh {reservationData.partialAmount.toLocaleString()} now</li>
                                <li>Remaining KSh {reservationData.remainingAmount.toLocaleString()} will be due later</li>
                                <li>You'll receive payment instructions via email</li>
                                <li>Your reservation is confirmed once this payment is successful</li>
                              </ul>
                            </div>
                          )}
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
                            ) : paymentStatus.includes('⏰') ? (
                              <div className="status-timeout">⏰</div>
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
                                ? `Your reservation has been confirmed! You will receive a confirmation email shortly.${reservationData.isBNPL ? ` Payment details for the remaining KSh ${reservationData.remainingAmount.toLocaleString()} will be sent to your email.` : ''}`
                                : paymentStatus.includes('❌')
                                ? 'Payment failed. Please try again or contact support.'
                                : paymentStatus.includes('⏰')
                                ? 'Payment request timed out. Please check your phone for M-Pesa prompts or try again.'
                                : 'Please check your phone for the M-Pesa prompt and complete the payment.'
                              }
                            </p>
                            {reservationData.isBNPL && paymentStatus.includes('✅') && (
                              <div className="payment-bnpl-summary">
                                <h5 className="payment-bnpl-title">Payment Summary:</h5>
                                <div className="payment-bnpl-details">
                                  <div className="payment-bnpl-row">
                                    <span className="payment-bnpl-label">Paid Now:</span>
                                    <span className="payment-bnpl-amount">KSh {reservationData.partialAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="payment-bnpl-row">
                                    <span className="payment-bnpl-label">Remaining:</span>
                                    <span className="payment-bnpl-amount">KSh {reservationData.remainingAmount.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="reservation-btn-group">
                        {paymentStatus.includes('✅') ? (
                          <>
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
                                router.push('/reservations');
                              }}
                              className="reservation-btn reservation-btn-success"
                            >
                              View My Reservations
                            </button>
                            <p className="redirect-notice">
                              {redirectCountdown > 0 
                                ? `Redirecting to your reservations in ${redirectCountdown} second${redirectCountdown !== 1 ? 's' : ''}...`
                                : 'Redirecting now...'
                              }
                            </p>
                          </>
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
                        ) : paymentStatus.includes('⏰') ? (
                          <>
                            <button
                              onClick={() => {
                                // Close EventSource and go back to payment step
                                if (eventSource) {
                                  eventSource.close();
                                }
                                // Clear timeout if it exists
                                if (paymentTimeout) {
                                  clearTimeout(paymentTimeout);
                                  setPaymentTimeout(null);
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
                                // Clear timeout if it exists
                                if (paymentTimeout) {
                                  clearTimeout(paymentTimeout);
                                  setPaymentTimeout(null);
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
        {showFullscreenCalendar && isAuthenticated && (
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
