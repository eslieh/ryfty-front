"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchSlotDetails, fetchExperienceSlots, fetchSlotReservations } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/bookings-redesign.css';

export default function SlotCheckinPage({ params }) {
  const { experienceId, slotId } = params;
  const [slot, setSlot] = useState(null);
  const [experience, setExperience] = useState(null);
  const [reservations, setReservations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [resLoading, setResLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [revenue, setRevenue] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();

  // 1. Fetch Slot Details
  useEffect(() => {
    const fetchSlotData = async () => {
      if (!experienceId || !slotId || !isAuthenticated || !isProvider()) return;
      setLoading(true);
      setError(null);
      try {
        let slotData = null;
        try {
          const slotResponse = await fetchSlotDetails(slotId);
          if (slotResponse?.slot) slotData = slotResponse.slot;
        } catch (e) { console.log('Direct slot fetch failed', e); }
        
        // Fallback to searching experience slots
        if (!slotData) {
          const slotsRes = await fetchExperienceSlots(experienceId, 1, {}, 100);
          if (slotsRes?.slots) {
            slotData = slotsRes.slots.find(s => s.id === slotId);
          }
        }
        
        if (slotData) {
          setSlot(slotData);
          if (slotData.experience) setExperience(slotData.experience);
          else if (slotData.experience_id) setExperience({ id: slotData.experience_id, title: slotData.experience_title || 'Experience' });
        } else {
          throw new Error('Slot not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch slot details');
      } finally {
        setLoading(false);
      }
    };
    fetchSlotData();
  }, [experienceId, slotId, isAuthenticated, isProvider]);

  // 2. Fetch Reservations for this Slot
  useEffect(() => {
    const loadReservations = async () => {
      if (!experienceId || !slotId) return;
      setResLoading(true);
      try {
        const response = await fetchSlotReservations(experienceId, slotId, currentPage, 20);
        if (response && response.reservations) {
          setReservations(response.reservations);
          setRevenue(response.total_revenue || 0);
          setPagination(response.pagination || { page: 1, per_page: 20, total: 0, pages: 0 });
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
      } finally {
        setResLoading(false);
      }
    };
    loadReservations();
  }, [experienceId, slotId, currentPage]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    return `${parseInt(h) % 12 || 12}:${m}${parseInt(h) >= 12 ? 'pm' : 'am'}`;
  };
  const formatCurrency = (amt) => `KSh ${amt?.toLocaleString() || '0'}`;

  // Error States
  if (loading) {
     return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-loading"><div className="spinner large"></div></div>
        </div>
      </div>
    );
  }

  if (error || !slot) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
             <div className="br-empty-state" style={{ marginTop: '2rem' }}>
                <h3 className="br-title" style={{ fontSize: '1.25rem', color: 'var(--lr-red-600)' }}>404 Not Found</h3>
                <p className="br-subtitle">The slot or experience you are trying to view cannot be found.</p>
                <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => router.push('/provider/bookings')}>
                  Go back to Bookings
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  const occupancyRate = slot.capacity > 0 ? (slot.booked / slot.capacity) * 100 : 0;
  const isFullyBooked = slot.booked >= slot.capacity;

  return (
    <div className="br-bookings-page">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation className="provider-left-nav" orientation="vertical" />

        <main className="provider-main-content">
          <div className="content-wrapper">
             {/* Header */}
            <motion.div 
              className="br-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div>
                <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem', border: 'none', background: 'transparent', padding: '0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--lr-gray-600)'}} onClick={() => router.push('/provider/bookings')}>
                  ← Back to Ledger
                </button>
                <h1 className="br-title">Slot Operations</h1>
                <p className="br-subtitle">
                  {experience?.title} — {formatDate(slot.date)} @ {formatTime(slot.start_time)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push(`/provider/bookings/slot/${experienceId}/${slotId}/devices`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--lr-radius-pill)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                  Connect Check-in Scanner
                </button>
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <motion.div
               style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
            >
               <div className="br-ledger-container" style={{ padding: '1.25rem', marginBottom: '0' }}>
                  <p className="br-text-sub" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupancy</p>
                  <h3 className="br-title">{slot.booked} / {slot.capacity}</h3>
                  <div style={{ height: '4px', background: 'var(--lr-gray-200)', borderRadius: '2px', marginTop: '0.5rem' }}>
                     <div style={{ height: '100%', borderRadius: '2px', background: isFullyBooked ? 'var(--lr-red-500)' : 'var(--lr-green-500)', width: `${Math.min(occupancyRate, 100)}%` }}></div>
                  </div>
               </div>
               <div className="br-ledger-container" style={{ padding: '1.25rem', marginBottom: '0' }}>
                  <p className="br-text-sub" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slot Revenue</p>
                  <h3 className="br-title" style={{ color: 'var(--lr-gray-900)' }}>{formatCurrency(revenue)}</h3>
               </div>
               <div className="br-ledger-container" style={{ padding: '1.25rem', marginBottom: '0' }}>
                  <p className="br-text-sub" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirmed Bookings</p>
                  <h3 className="br-title">{reservations.filter(r => r.status === 'confirmed').length}</h3>
               </div>
            </motion.div>

            {/* Ledger Container */}
            <motion.div 
               className="br-ledger-container"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
            >
               <div className="br-ledger-header" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1.5fr' }}>
                  <div className="br-header-cell">Attendee</div>
                  <div className="br-header-cell">Party</div>
                  <div className="br-header-cell right-align">Amount</div>
                  <div className="br-header-cell right-align">Ticket Status</div>
                  <div className="br-header-cell right-align">Check-in</div>
               </div>

               <div className="br-ledger-body">
                  {resLoading ? (
                     <div className="provider-loading" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
                  ) : reservations.length > 0 ? (
                     reservations.map((res) => (
                        <div key={res.id} className="br-ledger-row" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1.5fr' }}>
                           {/* 1. Guest */}
                           <div className="br-cell" data-label="Attendee">
                              <h4 className="br-customer-name">{res.user?.name || 'Guest'}</h4>
                              <p className="br-customer-email">{res.user?.email}</p>
                           </div>

                           {/* 2. Party Size */}
                           <div className="br-cell" data-label="Party">
                              <span className="br-text-main">{res.num_people}</span>
                              <span className="br-text-sub">PAX</span>
                           </div>

                           {/* 3. Earnings */}
                           <div className="br-cell right-align" data-label="Amount">
                              <span className="br-text-main">{formatCurrency(res.total_price)}</span>
                              {res.amount_paid > 0 && <span className="br-text-sub">Paid: {formatCurrency(res.amount_paid)}</span>}
                           </div>

                           {/* 4. Ticket Status */}
                           <div className="br-cell right-align" data-label="Ticket Status">
                              <span className={`br-status-pill ${res.status?.toLowerCase()}`}>
                                 {res.status}
                              </span>
                           </div>

                           {/* 5. Check-in Status */}
                           <div className="br-cell right-align" data-label="Check-in">
                              {(res.checked_in || res.status === 'completed') ? (
                                 <span className="br-status-pill completed" style={{ background: 'var(--lr-green-100)', color: 'var(--lr-green-700)'}}>✓ Checked-in</span>
                              ) : (
                                 <span className="br-status-pill pending" style={{ background: 'var(--lr-gray-100)', color: 'var(--lr-gray-600)'}}>Awaiting</span>
                              )}
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="br-empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--lr-gray-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                           <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h3 className="br-title" style={{ fontSize: '1.25rem' }}>No reservations for this slot</h3>
                     </div>
                  )}
               </div>
            </motion.div>

            {/* Pagination */}
            {pagination.pages > 1 && (
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
               <button 
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
               >
                  Previous
               </button>
               <button 
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= pagination.pages}
                  onClick={() => setCurrentPage(p => p + 1)}
               >
                  Next
               </button>
               </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
