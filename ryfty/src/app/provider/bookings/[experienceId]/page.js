"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchExperienceSlots, fetchProviderExperience } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/bookings-redesign.css';

export default function BookingsLedgerPage({ params }) {
  const { experienceId } = params;
  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();

  // Data states
  const [experience, setExperience] = useState(null);
  const [slots, setSlots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  
  const [loadingContext, setLoadingContext] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);


  // 1. Fetch Experience Context
  useEffect(() => {
    const loadContext = async () => {
      if (!isAuthenticated || !isProvider() || !experienceId) return;
      try {
        setLoadingContext(true);
        const res = await fetchProviderExperience(experienceId);
        if (res?.experience) setExperience(res.experience);
      } catch (err) {
        console.error("Failed to load experience", err);
        setError("Could not load the operations context for this experience.");
      } finally {
         setLoadingContext(false);
      }
    };
    loadContext();
  }, [isAuthenticated, isProvider, experienceId]);

  // 2. Fetch Slots
  const loadSlots = useCallback(async () => {
    if (!experienceId) return;
    try {
      setLoadingSlots(true);
      // Fetch upcoming slots
      const res = await fetchExperienceSlots(experienceId, currentPage, { sort: 'asc' }, 20);
      if (res?.slots) {
        setSlots(res.slots);
        setPagination(res.pagination || { page: 1, per_page: 20, total: 0, pages: 0 });
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error("Failed to load slots", err);
    } finally {
      setLoadingSlots(false);
    }
  }, [experienceId, currentPage]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Formatting Utilities
  const formatCurrency = (amount) => `KSh ${amount?.toLocaleString() || '0'}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`;
  };

  // UI Components
  if (loadingContext) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="provider-loading"><div className="spinner large"></div></div>
          </div>
        </div>
      </div>
    );
  }

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
               style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}
            >
               <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', padding: '0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--lr-gray-600)'}} onClick={() => router.push('/provider/bookings')}>
                  ← Back to High-Level Index
               </button>
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h1 className="br-title">{experience?.title || "Slots Ledger"}</h1>
                    <span className="br-status-pill confirmed" style={{ background: 'var(--lr-gray-900)', color: 'var(--lr-white)', fontSize: '0.7rem' }}>LIVE OPS</span>
                  </div>
                  <p className="br-subtitle">
                     Select an upcoming slot to manage its check-ins and authorize scanning devices.
                  </p>
               </div>
            </motion.div>

            {error && (
              <div className="error-state" style={{ marginBottom: '2rem' }}>
                <p>{error}</p>
              </div>
            )}

            {/* Timeline Container */}
            <motion.div 
               className="br-timeline"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
            >
              {loadingSlots ? (
                 <div className="provider-loading" style={{ minHeight: '300px' }}>
                    <div className="spinner"></div>
                 </div>
              ) : slots.length > 0 ? (
                 slots.map((slot) => {
                    const d = new Date(slot.date);
                    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayOfMonth = d.getDate();
                    
                    return (
                       <div key={slot.id} className="br-timeline-item">
                          {/* Left Column: Date & Line */}
                          <div className="br-timeline-left">
                             <div className="br-timeline-day">{dayOfWeek}</div>
                             <div className="br-date-badge">{dayOfMonth}</div>
                          </div>
                          
                          {/* Right Column: Card */}
                          <div className="br-timeline-right">
                             <div 
                                className="br-timeline-card"
                                onClick={() => router.push(`/provider/bookings/slot/${experienceId}/${slot.id}`)}
                             >
                                <div className="br-timeline-icon">
                                   <span style={{ fontSize: '1.5rem' }}>🎫</span>
                                </div>
                                <div className="br-timeline-content">
                                   <h4 className="br-timeline-title">Check in starting at {formatTime(slot.start_time)}</h4>
                                   <p className="br-timeline-subtitle">
                                      {slot.booked || 0} booked · {Math.max(0, slot.capacity - slot.booked)} spots left
                                   </p>
                                </div>
                                <div className="br-timeline-actions">
                                   <div className="br-cell right-align">
                                      <span className="br-text-main" style={{ whiteSpace: 'nowrap' }}>{formatCurrency(slot.price)}</span>
                                   </div>
                                   <button className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--lr-radius-pill)'}}>
                                      Manage
                                   </button>
                                </div>
                             </div>
                          </div>
                       </div>
                    );
                 })
              ) : (
                 <div className="br-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--lr-gray-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                       <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3 className="br-title" style={{ fontSize: '1.25rem' }}>No slots scheduled</h3>
                    <p className="br-subtitle">You have no upcoming slots for this experience.</p>
                 </div>
              )}
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
