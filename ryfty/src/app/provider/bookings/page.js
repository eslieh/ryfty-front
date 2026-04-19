"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperiences, fetchExperienceSlots } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/bookings-redesign.css';

export default function BookingsLedgerPage() {
  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();

  // Data states
  const [experiences, setExperiences] = useState([]);
  const [selectedExpId, setSelectedExpId] = useState(null);
  
  const [slots, setSlots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  
  const [loadingExps, setLoadingExps] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);



  // 1. Fetch Experiences on Mount
  useEffect(() => {
    const loadExperiences = async () => {
      if (!isAuthenticated || !isProvider()) return;
      try {
        setLoadingExps(true);
        const res = await fetchProviderExperiences(1, 50, { status: 'active', sort: 'created_at_desc' });
        if (res?.experiences?.length > 0) {
          setExperiences(res.experiences);
          setSelectedExpId(res.experiences[0].id); // Auto-select first
        }
      } catch (err) {
        console.error("Failed to load experiences", err);
        setError("Could not load your experiences.");
      } finally {
        setLoadingExps(false);
      }
    };
    loadExperiences();
  }, [isAuthenticated, isProvider]);

  // 2. Fetch Slots when Experience or Page Changes
  const loadSlots = useCallback(async () => {
    if (!selectedExpId) return;
    try {
      setLoadingSlots(true);
      // Fetch upcoming slots, or all slots. The backend might sort them.
      const res = await fetchExperienceSlots(selectedExpId, currentPage, { sort: 'asc' }, 20);
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
  }, [selectedExpId, currentPage]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Formatting Utilities
  const formatCurrency = (amount) => `KSh ${amount?.toLocaleString() || '0'}`;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    const d = new Date(dateStr);
    // e.g. "Oct 24, 2026"
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'pm' : 'am';
    return `${hour % 12 || 12}:${m}${ampm}`;
  };

  // UI Components
  if (loadingExps) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="provider-loading">
              <div className="spinner large"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine active experience name to show in title
  const activeExp = experiences.find(e => e.id === selectedExpId);

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
            >
              <div>
                <h1 className="br-title">Bookings Ledger</h1>
                <p className="br-subtitle">
                  {experiences.length > 0 ? `Manage incoming reservations across your experiences.` : `You don't have any active experiences yet.`}
                </p>
              </div>
            </motion.div>

            {error && (
              <div className="error-state" style={{ marginBottom: '2rem' }}>
                <p>{error}</p>
              </div>
            )}

            {experiences.length > 0 ? (
              <>
                {/* Horizontal Experience Filter Bar */}
                <motion.div 
                  className="br-filter-bar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {experiences.map(exp => (
                    <div 
                      key={exp.id}
                      className={`br-filter-pill ${selectedExpId === exp.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedExpId(exp.id);
                        setCurrentPage(1); // Reset page on experience switch
                      }}
                    >
                      {exp.title}
                    </div>
                  ))}
                </motion.div>

                {/* Ledger Container */}
                <motion.div 
                  className="br-ledger-container"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Table Headers */}
                  <div className="br-ledger-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
                    <div className="br-header-cell">Slot Title</div>
                    <div className="br-header-cell">Schedule</div>
                    <div className="br-header-cell right-align">Price</div>
                    <div className="br-header-cell right-align">Check-ins</div>
                    <div className="br-header-cell right-align">Capacity</div>
                  </div>

                  {/* Table Body */}
                  <div className="br-ledger-body">
                    {loadingSlots ? (
                      <div className="provider-loading" style={{ minHeight: '300px' }}>
                        <div className="spinner"></div>
                      </div>
                    ) : slots.length > 0 ? (
                      slots.map((slot) => (
                        <div 
                          key={slot.id} 
                          className="br-ledger-row"
                          onClick={() => router.push(`/provider/bookings/slot/${selectedExpId}/${slot.id}`)}
                          style={{ cursor: 'pointer', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}
                        >
                          {/* 1. Slot Name */}
                          <div className="br-cell" data-label="Title">
                            <h4 className="br-customer-name">{slot.name}</h4>
                            <p className="br-customer-email">Scheduled slot</p>
                          </div>

                          {/* 2. Schedule */}
                          <div className="br-cell" data-label="Schedule">
                            <span className="br-slot-date">{formatDate(slot.date)}</span>
                            <span className="br-slot-time">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </div>

                          {/* 3. Price */}
                          <div className="br-cell right-align" data-label="Price">
                            <span className="br-text-main">{formatCurrency(slot.price)}</span>
                          </div>

                          {/* 4. Check-ins */}
                          <div className="br-cell right-align" data-label="Check-ins">
                            <span className="br-text-main">{slot.booked || 0}</span>
                            <span className="br-text-sub">Booked</span>
                          </div>

                          {/* 5. Status / Capacity */}
                          <div className="br-cell right-align" data-label="Capacity">
                            <span className={`br-status-pill ${slot.booked >= slot.capacity ? 'cancelled' : 'confirmed'}`}>
                              {slot.booked >= slot.capacity ? 'Full' : 'Available'}
                            </span>
                            <span className="br-text-sub">{slot.capacity - slot.booked} spots left</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="br-empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--lr-gray-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                          <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h3 className="br-title" style={{ fontSize: '1.25rem' }}>No slots scheduled</h3>
                        <p className="br-subtitle">You have no upcoming slots for this experience.</p>
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
              </>
            ) : (
               <div className="br-empty-state" style={{ marginTop: '2rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--lr-gray-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className="br-title" style={{ fontSize: '1.25rem' }}>Start your hosting journey</h3>
                  <p className="br-subtitle">You have no active experiences. Create one to receive bookings.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => router.push('/provider/listings/create')}>
                    Create Experience
                  </button>
               </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}