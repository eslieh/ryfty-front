"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperiences } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/listing-redesign.css';

// Overflow menu for each card
function OverflowMenu({ experience, router }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="lr-overflow-wrap" ref={ref}>
      <button
        className="lr-btn-overflow"
        onClick={() => setOpen(v => !v)}
        title="More options"
        aria-label="More options"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="lr-overflow-menu"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
          >
            <button
              className="lr-overflow-item"
              onClick={() => { setOpen(false); router.push(`/experience/${experience.id}`); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              View Public Page
            </button>
            <button
              className="lr-overflow-item"
              onClick={() => { setOpen(false); router.push(`/provider/listings/reviews/${experience.id}`); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Reviews
            </button>
            <button
              className="lr-overflow-item"
              onClick={() => { setOpen(false); router.push('/provider/bookings'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              View Bookings
            </button>
            <div className="lr-overflow-divider"/>
            <button
              className="lr-overflow-item danger"
              onClick={() => { setOpen(false); router.push(`/provider/listings/edit/${experience.id}`); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"/>
                <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"/>
              </svg>
              Edit Experience
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Experience listing card
function ExperienceCard({ experience, router, index }) {
  const statusLabel = experience.status === 'published' ? 'Published' : 'Draft';

  const formatDateRange = () => {
    if (!experience.start_date && !experience.end_date) return null;
    const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (experience.start_date && experience.end_date) {
      return `${fmt(experience.start_date)} – ${fmt(experience.end_date)}`;
    }
    return fmt(experience.start_date || experience.end_date);
  };

  const dateRange = formatDateRange();
  const totalSlots   = experience.total_slots   ?? 0;
  const totalBooked  = experience.total_booked  ?? 0;
  const totalAvail   = Math.max(0, totalSlots - totalBooked);

  return (
    <motion.div
      className="lr-experience-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* ── Image block ── */}
      <div className="lr-card-image-wrap">
        <img
          src={experience.poster_image_url || '/images/placeholder.jpg'}
          alt={experience.title}
          className="lr-card-image"
        />

        {/* Status pill — top right */}
        <div className={`lr-status-pill ${experience.status}`}>
          <div className="lr-status-dot"/>
          {statusLabel}
        </div>

        {/* Overflow menu — top left */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <OverflowMenu experience={experience} router={router} />
        </div>
      </div>

      {/* ── Text body ── */}
      <div className="lr-card-body">
        <h3 className="lr-card-title">{experience.title}</h3>
        <p className="lr-card-subtitle">
          {dateRange && <span>{dateRange}</span>}
          {dateRange && totalSlots > 0 && <span className="lr-card-subtitle-dot"/>}
          {totalSlots > 0
            ? <span>{totalSlots} slot{totalSlots !== 1 ? 's' : ''} · {totalBooked} booked</span>
            : !dateRange ? <span style={{ color: '#b0b0b0' }}>No slots yet</span> : null}
        </p>
      </div>

      {/* ── Footer: location + Manage ── */}
      <div className="lr-card-footer">
        <span className="lr-card-location">
          {experience.meeting_point?.name
            || experience.meeting_point?.address
            || 'Location not set'}
        </span>
        <button
          className="lr-btn-manage"
          onClick={() => router.push(`/provider/listings/manage/${experience.id}`)}
        >
          Manage
        </button>
      </div>
    </motion.div>
  );
}

export default function ListingsPage() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchExperiences = async () => {
      if (!isAuthenticated || !isProvider()) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetchProviderExperiences();
        setExperiences(response?.experiences ?? []);
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setError(err.message || 'Failed to fetch experiences');
      } finally {
        setLoading(false);
      }
    };
    fetchExperiences();
  }, [isAuthenticated, isProvider]);

  if (!isAuthenticated || !isProvider()) {
    return (
      <div className="provider-loading">
        <div className="spinner large"/>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="provider-main-page lr-listings-page">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation className="provider-left-nav" orientation="vertical" />

        <motion.main
          className="provider-main-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="content-wrapper">

            {/* Header */}
            <div className="lr-listings-header">
              <h1 className="lr-listings-title">
                Your Experiences
                {!loading && experiences.length > 0 && (
                  <span className="lr-listings-count-badge">{experiences.length}</span>
                )}
              </h1>
              <button
                className="lr-btn-new-listing"
                onClick={() => router.push('/provider/listings/create')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>New listing</span>
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="lr-experience-list">
                {[1, 2, 3].map(i => (
                  <div key={i} className="lr-experience-card" style={{ pointerEvents: 'none' }}>
                    <div className="lr-card-image-wrap lr-skeleton" style={{ height: 160 }}/>
                    <div className="lr-card-body" style={{ gap: '0.625rem' }}>
                      <div className="lr-skeleton" style={{ height: 22, width: '60%', borderRadius: 6 }}/>
                      <div className="lr-skeleton" style={{ height: 14, width: '40%', borderRadius: 6 }}/>
                      <div className="lr-skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="lr-empty-state">
                <div className="lr-empty-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v4M12 17h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                </div>
                <h3 className="lr-empty-title">Failed to Load</h3>
                <p className="lr-empty-subtitle">{error}</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>
              </div>
            ) : experiences.length === 0 ? (
              <motion.div
                className="lr-empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="lr-empty-icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3 className="lr-empty-title">No experiences yet</h3>
                <p className="lr-empty-subtitle">
                  Create your first experience and start welcoming guests to your world.
                </p>
                <button
                  className="lr-btn-new-listing"
                  onClick={() => router.push('/provider/listings/create')}
                  style={{ fontSize: '0.9375rem', padding: '0.875rem 1.75rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Create your first experience
                </button>
              </motion.div>
            ) : (
              <div className="lr-experience-list">
                {experiences.map((exp, i) => (
                  <ExperienceCard key={exp.id} experience={exp} router={router} index={i} />
                ))}
              </div>
            )}

          </div>
        </motion.main>
      </div>
    </div>
  );
}
