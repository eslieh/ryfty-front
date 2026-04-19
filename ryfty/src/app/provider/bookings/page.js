"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperiences } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/listing-redesign.css'; // Leverage our established cards UI

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

  return (
    <motion.div
      className="lr-experience-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => router.push(`/provider/bookings/${experience.id}`)}
      style={{ cursor: 'pointer' }}
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
      </div>

      {/* ── Text body ── */}
      <div className="lr-card-body">
        <h3 className="lr-card-title">{experience.title}</h3>
        
        {/* Simple inline metadata: Date range + subtle dot + slots */}
        <div className="lr-card-meta">
          {dateRange && <span>{dateRange}</span>}
          {dateRange && <span className="lr-meta-dot">·</span>}
          <span>{totalSlots} slots · {totalBooked} booked</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="lr-card-footer">
        <div className="lr-card-location">
          {experience.city && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          )}
          {experience.city}
        </div>
        
        <button className="lr-btn-manage">
          View Bookings
        </button>
      </div>
    </motion.div>
  );
}

export default function BookingsIndexPage() {
  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();

  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadExperiences = async () => {
      if (!isAuthenticated || !isProvider()) return;
      try {
        setLoading(true);
        // Load active experiences
        const res = await fetchProviderExperiences(1, 50, { status: 'active', sort: 'created_at_desc' });
        if (res?.experiences) {
          setExperiences(res.experiences);
        }
      } catch (err) {
        console.error("Failed to load active experiences", err);
        setError("Could not load your active experiences.");
      } finally {
        setLoading(false);
      }
    };
    loadExperiences();
  }, [isAuthenticated, isProvider]);

  return (
    <div className="lr-page-container">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation className="provider-left-nav" orientation="vertical" />

        <main className="provider-main-content">
          <div className="lr-content-wrapper">
            
            {/* Header Area */}
            <motion.div 
               className="lr-listings-header"
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
            >
              <div>
                <h1 className="lr-listings-title">Bookings Operations</h1>
                <p className="lr-page-subtitle">
                  Select an active experience to manage its upcoming reservations and verify tickets.
                </p>
              </div>
            </motion.div>

            {error && (
              <div className="error-state" style={{ marginBottom: '2rem' }}>
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              <div className="provider-loading" style={{ minHeight: '300px' }}>
                <div className="spinner large"></div>
              </div>
            ) : experiences.length > 0 ? (
              <div className="lr-experience-list">
                <AnimatePresence>
                  {experiences.map((exp, i) => (
                    <ExperienceCard
                      key={exp.id}
                      experience={exp}
                      router={router}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
               <div className="br-empty-state" style={{ marginTop: '2rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--lr-gray-400)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className="br-title" style={{ fontSize: '1.25rem' }}>No Active Experiences</h3>
                  <p className="br-subtitle">You have no published experiences active yet.</p>
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