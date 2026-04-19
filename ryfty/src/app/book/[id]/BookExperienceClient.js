"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SkeletonLoader from "@/components/SkeletonLoader";
import config from "@/config";
import { getAuthToken } from "@/utils/authStorage";
import { useAuth } from "@/contexts/AuthContext";
import "@/styles/booking.css";

export default function BookExperienceClient({ id }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const slotId = searchParams.get("slotId");
  const initialGuests = parseInt(searchParams.get("guests")) || 1;

  const [experience, setExperience] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the booking flow
  const [guests, setGuests] = useState(initialGuests);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [isBNPL, setIsBNPL] = useState(false);
  const [partialAmount, setPartialAmount] = useState(0);
  
  // Payment Status / SSE State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [showStatusView, setShowStatusView] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [paymentTimeout, setPaymentTimeout] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const PAYMENT_TIMEOUT_DURATION = 300000; // 5 minutes

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch experience
        const expResponse = await fetch(`${config.api.baseUrl}/public/experiences/${id}`);
        if (!expResponse.ok) throw new Error("Failed to fetch experience");
        const expData = await expResponse.json();
        setExperience(expData.experience);

        // Fetch slots to find the selected one
        const slotsResponse = await fetch(`${config.api.baseUrl}/experiences/${id}/slots?per_page=100`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (slotsResponse.ok) {
            const slotsData = await slotsResponse.json();
            const slot = slotsData.slots?.find(s => s.id === slotId);
            if (slot) {
                setSelectedSlot(slot);
            }
        }
      } catch (err) {
        console.error("Error fetching booking data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, slotId]);

  // Auth check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/auth?redirect=/book/${id}?slotId=${slotId}&guests=${guests}`);
    }
  }, [loading, isAuthenticated, id, slotId, guests, router]);

  // Update partial amount when total price changes
  useEffect(() => {
    if (selectedSlot) {
      const total = selectedSlot.price * guests;
      setPartialAmount(Math.floor(total * 0.5));
    }
  }, [selectedSlot, guests]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const handleGuestChange = (delta) => {
    const maxCapacity = selectedSlot ? (selectedSlot.capacity - (selectedSlot.booked || 0)) : 10;
    const newCount = Math.max(1, Math.min(guests + delta, maxCapacity));
    setGuests(newCount);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
        setIsSubmitting(true);
        setShowStatusView(true);
        setPaymentStatus("Sending reservation request...");
        
        const token = getAuthToken();
        const totalAmount = selectedSlot.price * guests;
        
        const reservationPayload = {
            slot_id: selectedSlot.id,
            experience_id: experience.id,
            amount: isBNPL ? partialAmount.toString() : totalAmount.toString(),
            total_amount: totalAmount.toString(),
            num_people: guests.toString(),
            mpesa_number: mpesaNumber,
            is_bnpl: isBNPL,
            remaining_amount: isBNPL ? (totalAmount - partialAmount).toString() : '0'
        };

        const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
        
        // 1. Create the reservation request
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
            throw new Error(errorData.message || 'Failed to create reservation');
        }

        const result = await response.json();
        
        // 2. Start SSE listener
        setPaymentStatus("Wait for M-Pesa prompt on your phone...");
        setIsWaitingForPayment(true);
        
        const newEventSource = new EventSource(`${baseUrl}/events/${user?.id || 'anonymous'}`);
        setEventSource(newEventSource);

        // Timeout for payment
        const timeout = setTimeout(() => {
          if (isWaitingForPayment) {
            setPaymentStatus("⏰ Payment Request Timed Out. Please check your phone or try again.");
            setIsWaitingForPayment(false);
            if (newEventSource) newEventSource.close();
          }
        }, PAYMENT_TIMEOUT_DURATION);
        setPaymentTimeout(timeout);

        newEventSource.onmessage = (e) => {
          const data = JSON.parse(e.data);
          console.log("SSE Event:", data);

          if (data.data?.state === "pending_confirmation") {
            setPaymentStatus("Processing your payment...");
          } else if (data.data?.state === "success") {
            setPaymentStatus("✅ Payment Successful! Redirecting...");
            setIsWaitingForPayment(false);
            if (timeout) clearTimeout(timeout);
            newEventSource.close();
            setRedirectCountdown(3);
          } else if (data.data?.state === "failed") {
            setPaymentStatus(`❌ Payment Failed: ${data.data?.message || "Unknown error"}`);
            setIsWaitingForPayment(false);
            if (timeout) clearTimeout(timeout);
            newEventSource.close();
            setIsSubmitting(false);
          }
        };

        newEventSource.onerror = (err) => {
          console.error("SSE Error:", err);
          // Keep waiting, SSE might reconnect
        };

    } catch (err) {
        setPaymentStatus(`❌ Error: ${err.message}`);
        setIsSubmitting(false);
        if (eventSource) eventSource.close();
    }
  };

  // Redirect countdown effect
  useEffect(() => {
    let timer;
    if (redirectCountdown > 0) {
      timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
    } else if (redirectCountdown === 0 && paymentStatus.includes("✅")) {
      router.push('/reservations');
    }
    return () => timer && clearTimeout(timer);
  }, [redirectCountdown, paymentStatus, router]);

  if (loading) return <div className="booking-page"><Header /><div className="booking-container"><SkeletonLoader variant="rectangular" height="400px" /></div></div>;
  if (error) return <div className="booking-page"><Header /><div className="booking-container"><div className="error-view"><h2>Error</h2><p>{error}</p><button onClick={() => window.location.reload()} className="confirm-btn">Try Again</button></div></div></div>;
  if (!experience || !selectedSlot) return <div className="booking-page"><Header /><div className="booking-container">Not found</div></div>;

  const totalPrice = selectedSlot.price * guests;

  return (
    <div className="booking-page">
      <Header />
      
      <main className="booking-container">
        <header className="booking-header">
          <button className="back-btn" onClick={() => router.back()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="booking-title">Confirm and pay</h1>
        </header>

        <div className="booking-grid">
          {/* Left Column: Flow */}
          <section className="booking-flow">
            {showStatusView ? (
              <div className="payment-status-overlay">
                <div className="status-spinner"></div>
                <h2 style={{ marginBottom: '16px' }}>Payment Status</h2>
                <p style={{ fontSize: '18px', color: '#444' }}>{paymentStatus}</p>
                {(!isWaitingForPayment && !paymentStatus.includes("✅")) && (
                  <button 
                    className="confirm-btn" 
                    style={{ marginTop: '24px' }}
                    onClick={() => setShowStatusView(false)}
                  >
                    Go Back
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* BNPL Option Card */}
                <div 
                  className={`selection-card ${isBNPL ? 'active' : ''}`}
                  onClick={() => setIsBNPL(!isBNPL)}
                >
                  <div className="selection-info">
                    <h3 className="selection-title">Pay a partial amount now</h3>
                    <p className="selection-description">
                      Pay a portion today and the rest later. 
                      A flexible way to book your experience.
                    </p>
                    {isBNPL && (
                      <div className="partial-amount-input-group" onClick={(e) => e.stopPropagation()}>
                        <label style={{ display: 'block', margin: '16px 0 8px', fontSize: '14px', fontWeight: '600' }}>
                          How much would you like to pay today? (KES)
                        </label>
                        <input 
                          type="number"
                          className="partial-input"
                          value={partialAmount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setPartialAmount(val);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #dddddd',
                            fontSize: '16px'
                          }}
                        />
                        {(partialAmount < totalPrice * 0.1) && (
                          <p style={{ color: '#ff385c', fontSize: '12px', marginTop: '4px' }}>Min payment: KSh {(totalPrice * 0.1).toLocaleString()}</p>
                        )}
                        {(partialAmount >= totalPrice) && (
                          <p style={{ color: '#ff385c', fontSize: '12px', marginTop: '4px' }}>Must be less than total price</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="selection-checkbox">
                    {isBNPL && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="booking-section">
                  <div className="section-header">
                    <h2 className="section-title">Payment method</h2>
                  </div>
                  
                  <div className="payment-methods">
                    <div 
                      className={`payment-option ${paymentMethod === 'mpesa' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('mpesa')}
                    >
                      <div className="payment-info">
                        <img src="/mpesa-logo.png" alt="M-Pesa" style={{ height: '24px' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                        <span style={{ display: 'none', color: '#66aa33', fontWeight: 'bold' }}>M-PESA</span>
                        <span className="payment-name">M-PESA</span>
                      </div>
                      <div className="radio-circle"></div>
                    </div>
                  </div>

                  {paymentMethod === 'mpesa' && (
                    <div style={{ marginTop: '32px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>M-Pesa Number (254...)</label>
                      <input 
                        type="tel" 
                        placeholder="254712345678"
                        style={{ 
                          width: '100%', 
                          padding: '16px', 
                          borderRadius: '12px', 
                          border: '1px solid #b0b0b0',
                          fontSize: '16px'
                        }}
                        value={mpesaNumber}
                        onChange={(e) => setMpesaNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Review Section */}
                <div className="booking-section">
                  <p className="review-agreement">
                    By selecting the button below, I agree to the <a href="#">booking terms</a> and <a href="#">release and waiver</a>. View <a href="#">Privacy Policy</a>.
                  </p>
                  <button 
                      className="confirm-btn" 
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting || 
                        (paymentMethod === 'mpesa' && !mpesaNumber) ||
                        (isBNPL && (partialAmount < totalPrice * 0.1 || partialAmount >= totalPrice))
                      }
                  >
                    Confirm and pay
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Right Column: Summary Card */}
          <aside className="summary-card-container">
            <div className="summary-card-book">
              <div className="summary-header">
                <div className="summary-thumb">
                  <Image 
                    src={experience.poster_image_url || "/placeholder.jpg"} 
                    alt={experience.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="summary-title-col">
                  <h3 className="summary-exp-title">{experience.title}</h3>
                  <div className="summary-rating">
                    <span style={{ color: '#D70466' }}>★</span>
                    <span style={{ fontWeight: '600' }}>5.0</span>
                    <span style={{ color: '#717171' }}>(329)</span>
                  </div>
                </div>
              </div>

              <div className="summary-non-refundable">
                This reservation is non-refundable.
              </div>

              <div className="summary-detail-block">
                <div className="summary-row">
                  <div>
                    <div className="summary-row-label">Date</div>
                    <div className="summary-row-value">{formatDate(selectedSlot.date)}</div>
                    <div className="summary-row-value">{selectedSlot.start_time} — {selectedSlot.end_time}</div>
                  </div>
                  <button className="change-link" onClick={() => router.push(`/experience/${id}`)}>Change</button>
                </div>

                <div className="summary-row">
                  <div>
                    <div className="summary-row-label">Guests</div>
                    <div className="summary-row-value">{guests} adult{guests > 1 ? 's' : ''}</div>
                    <div className="guest-counter">
                      <button className="counter-btn" onClick={() => handleGuestChange(-1)} disabled={guests <= 1}>-</button>
                      <span style={{ minWidth: '20px', textAlign: 'center' }}>{guests}</span>
                      <button className="counter-btn" onClick={() => handleGuestChange(1)} disabled={selectedSlot && guests >= (selectedSlot.capacity - (selectedSlot.booked || 0))}>+</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="price-details-section">
                <h3 className="section-title" style={{ fontSize: '22px', marginBottom: '24px' }}>Price details</h3>
                <div className="price-item-row">
                  <span>KSh {selectedSlot.price.toLocaleString()} x {guests} adult{guests > 1 ? 's' : ''}</span>
                  <span>KSh {totalPrice.toLocaleString()}</span>
                </div>
                
                {isBNPL && (
                  <>
                    <div className="price-item-row" style={{ color: '#00915a', fontWeight: '500' }}>
                      <span>Partial payment today</span>
                      <span>-KSh {(totalPrice - partialAmount).toLocaleString()}</span>
                    </div>
                  </>
                )}

                <button className="coupon-link">Enter a coupon</button>
                
                <div className="total-row">
                  <span>Total (KES)</span>
                  <span>KSh {(isBNPL ? partialAmount : totalPrice).toLocaleString()}</span>
                </div>

                {isBNPL && (
                   <div style={{ marginTop: '16px', fontSize: '14px', color: '#717171', textAlign: 'right' }}>
                    Remaining balance: KSh {(totalPrice - partialAmount).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
