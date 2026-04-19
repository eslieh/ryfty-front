"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import {
  fetchProviderExperience,
  fetchExperienceSlots,
  createSlot,
  updateSlot,
  deleteSlot
} from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/listing-redesign.css';

/* ─ Helpers ──────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtCurrency = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);
const padDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/* ─── Status pill ────────────────────────────────────────── */
function StatusPill({ status }) {
  return (
    <div className={`lr-status-pill ${status}`} style={{ position: 'static', display: 'inline-flex' }}>
      <div className="lr-status-dot"/>
      {status === 'published' ? 'Published' : 'Draft'}
    </div>
  );
}

/* ─── Status toggle (inline) ─────────────────────────────── */
function InlineStatusToggle({ status, onChange }) {
  const isPublished = status === 'published';
  return (
    <div
      className="lr-status-toggle-wrap"
      onClick={onChange}
      style={{ cursor: 'pointer' }}
    >
      <div className="lr-status-toggle-info">
        <p className="lr-status-toggle-label">{isPublished ? 'Published' : 'Draft'}</p>
        <p className="lr-status-toggle-desc">
          {isPublished ? 'Visible to guests and accepting bookings' : 'Hidden from guests'}
        </p>
      </div>
      <div className={`lr-toggle-switch ${isPublished ? 'active' : ''}`}>
        <div className="lr-toggle-thumb"/>
      </div>
    </div>
  );
}

/* ─── Slot Drawer ────────────────────────────────────────── */
function SlotDrawer({ open, editingSlot, onClose, onSubmit, formLoading, formError, formSuccess }) {
  const [name,      setName]     = useState('');
  const [capacity,  setCap]      = useState('');
  const [price,     setPrice]    = useState('');
  const [date,      setDate]     = useState('');
  const [startTime, setStart]    = useState('');
  const [endTime,   setEnd]      = useState('');
  const [timezone,  setTz]       = useState('Africa/Nairobi');
  const [showAdv,   setShowAdv]  = useState(false);
  const [valErr,    setValErr]   = useState('');

  // Pre-fill when editing
  useEffect(() => {
    if (editingSlot) {
      setName(editingSlot.name || '');
      setCap(editingSlot.capacity?.toString() || '');
      setPrice(editingSlot.price?.toString() || '');
      setDate(editingSlot.date || '');
      setStart(editingSlot.start_time || '');
      setEnd(editingSlot.end_time || '');
      setTz(editingSlot.timezone || 'Africa/Nairobi');
    } else {
      setName(''); setCap(''); setPrice(''); setDate(''); setStart(''); setEnd('');
      setTz('Africa/Nairobi');
    }
    setValErr('');
    setShowAdv(false);
  }, [editingSlot, open]);

  // Duration label
  const durationLabel = (() => {
    if (!startTime || !endTime) return '';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    setValErr('');
    if (startTime && endTime && startTime >= endTime) {
      setValErr('End time must be after start time');
      return;
    }
    onSubmit({ name, capacity: parseInt(capacity), price: parseFloat(price), date, start_time: startTime, end_time: endTime, timezone });
  };

  if (!open) return null;

  return (
    <>
      <div className="lr-drawer-overlay" onClick={onClose}/>
      <div className="lr-drawer">
        <div className="lr-drawer-header">
          <h3 className="lr-drawer-title">{editingSlot ? 'Edit Slot' : 'Add a Slot'}</h3>
          <button className="lr-drawer-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form className="lr-drawer-body" onSubmit={handleSubmit}>
          {/* Messages */}
          {(formError || valErr) && (
            <div className="lr-form-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {formError || valErr}
            </div>
          )}
          {formSuccess && (
            <div className="lr-form-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <path d="M20 6L9 17L4 12"/>
              </svg>
              {formSuccess}
            </div>
          )}

          {/* Name */}
          <div className="lr-field" style={{ margin: 0 }}>
            <label className="lr-label" htmlFor="sl-name">Slot Name *</label>
            <input id="sl-name" className="lr-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Morning Session" required autoComplete="off"/>
          </div>

          {/* Date */}
          <div className="lr-field" style={{ margin: 0 }}>
            <label className="lr-label" htmlFor="sl-date">Date *</label>
            <input id="sl-date" className="lr-input" type="date" value={date} onChange={e => setDate(e.target.value)} required/>
          </div>

          {/* Time range */}
          <div className="lr-field" style={{ margin: 0 }}>
            <label className="lr-label">Time *</label>
            <div className="lr-time-range-row">
              <div>
                <p className="lr-field-hint" style={{ margin: '0 0 4px' }}>Start</p>
                <input className="lr-input" type="time" value={startTime} onChange={e => { setStart(e.target.value); setValErr(''); }} required/>
              </div>
              <div className="lr-time-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <div>
                <p className="lr-field-hint" style={{ margin: '0 0 4px' }}>End</p>
                <input className="lr-input" type="time" value={endTime} onChange={e => { setEnd(e.target.value); setValErr(''); }} required/>
              </div>
            </div>
            {durationLabel && (
              <div className="lr-duration-bar-wrap" style={{ marginTop: '0.5rem' }}>
                <div className="lr-duration-bar">
                  <div className="lr-duration-fill" style={{ width: '100%' }}/>
                </div>
                <span className="lr-duration-label">{durationLabel}</span>
              </div>
            )}
          </div>

          {/* Capacity & Price */}
          <div className="lr-field-row" style={{ margin: 0, gap: '0.75rem' }}>
            <div>
              <label className="lr-label" htmlFor="sl-cap">Capacity *</label>
              <input id="sl-cap" className="lr-input" type="number" min="1" value={capacity} onChange={e => setCap(e.target.value)} placeholder="20" required autoComplete="off"/>
            </div>
            <div>
              <label className="lr-label" htmlFor="sl-price">Price (KES) *</label>
              <input id="sl-price" className="lr-input" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="2500" required autoComplete="off"/>
            </div>
          </div>

          {/* Advanced (timezone) */}
          <div>
            <button type="button" className="lr-advanced-toggle" onClick={() => setShowAdv(v => !v)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showAdv ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
              Advanced settings
            </button>
            {showAdv && (
              <div style={{ marginTop: '0.75rem' }}>
                <label className="lr-label" htmlFor="sl-tz">Timezone</label>
                <select id="sl-tz" className="lr-select" value={timezone} onChange={e => setTz(e.target.value)}>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            )}
          </div>
        </form>

        <div className="lr-drawer-footer">
          <button type="button" className="lr-btn-prev" onClick={onClose} disabled={formLoading}>Cancel</button>
          <button type="submit" className="lr-btn-submit" onClick={handleSubmit} disabled={formLoading}>
            {formLoading
              ? <><div className="spinner small"/>{editingSlot ? 'Saving…' : 'Creating…'}</>
              : editingSlot ? 'Save Changes' : 'Create Slot'
            }
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Delete Confirm Drawer ──────────────────────────────── */
function DeleteConfirmDrawer({ open, onClose, onConfirm, loading, error }) {
  if (!open) return null;
  return (
    <>
      <div className="lr-drawer-overlay" onClick={onClose}/>
      <div className="lr-drawer" style={{ maxWidth: 380 }}>
        <div className="lr-drawer-header">
          <h3 className="lr-drawer-title" style={{ color: '#b91c1c' }}>Delete Slot?</h3>
          <button className="lr-drawer-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="lr-drawer-body">
          <div className="lr-delete-confirm">
            <p>This slot and all its booking data will be permanently removed. This cannot be undone.</p>
            {error && <div className="lr-form-error" style={{marginTop: '0.5rem'}}>{error}</div>}
          </div>
        </div>
        <div className="lr-drawer-footer">
          <button className="lr-btn-prev" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="lr-btn-submit" style={{ background: '#b91c1c' }} onClick={onConfirm} disabled={loading}>
            {loading ? <><div className="spinner small"/>Deleting…</> : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Overview Tab ───────────────────────────────────────── */
function OverviewTab({ experience }) {
  const destinations = experience.destinations || [];
  const activities   = experience.activities   || [];
  const inclusions   = experience.inclusions   || [];
  const exclusions   = experience.exclusions   || [];
  const images       = experience.images       || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Banner */}
      <div className="lr-overview-banner">
        <img src={experience.poster_image_url || '/images/placeholder.jpg'} alt={experience.title}/>
        <div className="lr-banner-overlay"/>
        <div className="lr-banner-status">
          <StatusPill status={experience.status}/>
        </div>
      </div>

      {/* Gallery strip */}
      {images.length > 0 && (
        <div className="lr-gallery-strip">
          {images.map((img, i) => (
            <div key={i} className="lr-gallery-strip-item">
              <img src={img.url || img} alt={img.alt || `Photo ${i+1}`}/>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="lr-overview-stats">
        <div className="lr-stat-card">
          <span className="lr-stat-value">{destinations.length}</span>
          <span className="lr-stat-label">Destinations</span>
        </div>
        <div className="lr-stat-card">
          <span className="lr-stat-value">{activities.length}</span>
          <span className="lr-stat-label">Activities</span>
        </div>
        <div className="lr-stat-card">
          <span className="lr-stat-value">{inclusions.length}</span>
          <span className="lr-stat-label">Inclusions</span>
        </div>
        <div className="lr-stat-card">
          <span className="lr-stat-value">{exclusions.length}</span>
          <span className="lr-stat-label">Exclusions</span>
        </div>
      </div>

      <div className="lr-overview-body">
        {/* Description */}
        <div className="lr-info-panel">
          <div className="lr-info-panel-header">
            <h4 className="lr-info-panel-title">About this experience</h4>
          </div>
          <div className="lr-info-panel-body">
            <p style={{ fontSize: '0.9375rem', color: '#484848', lineHeight: 1.65, margin: 0 }}>
              {experience.description || '—'}
            </p>
          </div>
        </div>

        {/* Destinations & Activities */}
        {(destinations.length > 0 || activities.length > 0) && (
          <div className="lr-info-panel">
            <div className="lr-info-panel-header">
              <h4 className="lr-info-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Destinations & Activities
              </h4>
            </div>
            <div className="lr-info-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {destinations.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#717171', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Destinations</p>
                  <div className="lr-pill-list">
                    {destinations.map((d, i) => <span key={i} className="lr-pill neutral">{d}</span>)}
                  </div>
                </div>
              )}
              {activities.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#717171', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Activities</p>
                  <div className="lr-pill-list">
                    {activities.map((a, i) => <span key={i} className="lr-pill blue">{a}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inclusions / Exclusions */}
        {(inclusions.length > 0 || exclusions.length > 0) && (
          <div className="lr-info-panel">
            <div className="lr-info-panel-header">
              <h4 className="lr-info-panel-title">What's Included</h4>
            </div>
            <div className="lr-info-panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Included</p>
                  <div className="lr-pill-list">
                    {inclusions.length > 0
                      ? inclusions.map((inc, i) => <span key={i} className="lr-pill green">{inc}</span>)
                      : <span style={{ color: '#717171', fontSize: '0.8125rem' }}>None specified</span>}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Not Included</p>
                  <div className="lr-pill-list">
                    {exclusions.length > 0
                      ? exclusions.map((exc, i) => <span key={i} className="lr-pill red">{exc}</span>)
                      : <span style={{ color: '#717171', fontSize: '0.8125rem' }}>None specified</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Point */}
        <div className="lr-info-panel">
          <div className="lr-info-panel-header">
            <h4 className="lr-info-panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Meeting Point & Dates
            </h4>
          </div>
          <div className="lr-info-panel-body">
            <div className="lr-kv-row"><span className="lr-kv-key">Name</span><span className="lr-kv-value">{experience.meeting_point?.name || '—'}</span></div>
            <div className="lr-kv-row"><span className="lr-kv-key">Address</span><span className="lr-kv-value">{experience.meeting_point?.address || '—'}</span></div>
            {experience.meeting_point?.instructions && (
              <div className="lr-kv-row"><span className="lr-kv-key">Instructions</span><span className="lr-kv-value">{experience.meeting_point.instructions}</span></div>
            )}
            <div className="lr-kv-row"><span className="lr-kv-key">Start Date</span><span className="lr-kv-value">{fmt(experience.start_date)}</span></div>
            <div className="lr-kv-row"><span className="lr-kv-key">End Date</span><span className="lr-kv-value">{fmt(experience.end_date)}</span></div>
            <div className="lr-kv-row"><span className="lr-kv-key">Experience ID</span>
              <span className="lr-kv-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#f7f7f7', padding: '2px 6px', borderRadius: 4, color: '#717171' }}>{experience.id}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Slots Tab ──────────────────────────────────────────── */
function SlotsTab({ experienceId, onOpenDrawer, onEditSlot, onDeleteSlot, slots, slotsLoading }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate]  = useState(null);

  const daysInMonth  = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 0).getDate();
  const firstDay     = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today        = new Date(); today.setHours(0,0,0,0);

  const getSlotsForDate = (dateStr) => slots.filter(s => s.date === dateStr);
  const selectedSlots   = selectedDate ? getSlotsForDate(selectedDate) : [];

  const navigateMonth = (dir) => {
    setCurrentMonth(prev => {
      const d = new Date(prev); d.setMonth(d.getMonth() + dir); return d;
    });
    setSelectedDate(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="lr-slots-header">
        <div className="lr-slots-month-nav">
          <button className="lr-month-nav-btn" onClick={() => navigateMonth(-1)} disabled={slotsLoading} aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h3 className="lr-month-title">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {slotsLoading && <span style={{ marginLeft: 8 }}><div className="spinner small" style={{ display: 'inline-block', width: 14, height: 14 }}/></span>}
          </h3>
          <button className="lr-month-nav-btn" onClick={() => navigateMonth(1)} disabled={slotsLoading} aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <button className="lr-btn-add-slot" onClick={() => onOpenDrawer(null)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Add Slot
        </button>
      </div>

      {/* Calendar */}
      <div className="lr-calendar-wrap">
        <div className="lr-calendar-header">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="lr-cal-day-label">{d}</div>
          ))}
        </div>
        <div className="lr-calendar-grid">
          {/* Empty cells */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`e${i}`} className="lr-cal-day empty"/>
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day     = i + 1;
            const date    = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = padDate(date);
            const daySlots = getSlotsForDate(dateStr);
            const hasSlots = daySlots.length > 0;
            const isToday  = date.getTime() === today.getTime();
            const isPast   = date < today;
            const isSelected = selectedDate === dateStr;

            return (
              <div
                key={day}
                className={`lr-cal-day ${hasSlots ? 'has-slots' : ''} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => hasSlots ? setSelectedDate(isSelected ? null : dateStr) : null}
              >
                <span className="lr-day-number">{day}</span>
                {hasSlots && (
                  <div className="lr-slot-dots">
                    {daySlots.slice(0, 2).map((slot, si) => {
                      const isFull = slot.booked >= slot.capacity;
                      const isNearFull = !isFull && slot.booked / slot.capacity > 0.7;
                      return (
                        <div key={si} className={`lr-slot-dot-chip ${isFull ? 'full' : isNearFull ? 'booked' : ''}`}>
                          {slot.start_time?.slice(0, 5)}
                        </div>
                      );
                    })}
                    {daySlots.length > 2 && (
                      <div className="lr-slot-dot-chip">+{daySlots.length - 2}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      <AnimatePresence>
        {selectedDate && selectedSlots.length > 0 && (
          <motion.div
            className="lr-selected-date-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="lr-panel-header">
              <h4 className="lr-panel-date-title">
                {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h4>
              <span className="lr-panel-slot-count">{selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''}</span>
            </div>
            <div className="lr-slot-card-list">
              {selectedSlots.map(slot => {
                const fillPct = slot.capacity > 0 ? (slot.booked / slot.capacity) * 100 : 0;
                const fillClass = fillPct >= 100 ? 'full' : fillPct >= 70 ? 'near-full' : '';
                return (
                  <div key={slot.id} className="lr-slot-item">
                    <div className="lr-slot-time-block">
                      <span className="lr-slot-time">{slot.start_time?.slice(0,5)}</span>
                      <span className="lr-slot-time-sep">to</span>
                      <span className="lr-slot-time">{slot.end_time?.slice(0,5)}</span>
                    </div>
                    <div className="lr-slot-info">
                      <p className="lr-slot-name">{slot.name}</p>
                      <div className="lr-slot-meta-row">
                        <div className="lr-capacity-bar-wrap">
                          <div className="lr-capacity-bar">
                            <div className={`lr-capacity-fill ${fillClass}`} style={{ width: `${Math.min(fillPct, 100)}%` }}/>
                          </div>
                          <span className="lr-capacity-text">{slot.booked}/{slot.capacity}</span>
                        </div>
                        <span className="lr-slot-price-badge">{fmtCurrency(slot.price)}</span>
                      </div>
                    </div>
                    <div className="lr-slot-actions">
                      <button className="lr-icon-btn" onClick={() => onEditSlot(slot)} title="Edit slot">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"/>
                          <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"/>
                        </svg>
                      </button>
                      <button
                        className="lr-icon-btn danger"
                        onClick={() => onDeleteSlot(slot.id)}
                        disabled={slot.booked > 0}
                        title={slot.booked > 0 ? 'Cannot delete — has bookings' : 'Delete slot'}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No slots */}
      {!slotsLoading && slots.length === 0 && (
        <div className="lr-slots-empty" style={{ marginTop: '1.5rem' }}>
          <span className="lr-slots-empty-icon">📅</span>
          <p className="lr-slots-empty-title">No slots this month</p>
          <p className="lr-slots-empty-hint">Tap a date or use "Add Slot" to create your first time slot.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Settings Tab ───────────────────────────────────────── */
function SettingsTab({ experience, router }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="lr-settings-section">

        {/* Edit */}
        <div className="lr-settings-card">
          <div className="lr-settings-card-header">
            <h4 className="lr-settings-card-title">Edit Experience</h4>
          </div>
          <div className="lr-settings-card-body">
            <div className="lr-settings-row">
              <div className="lr-settings-row-info">
                <p className="lr-settings-row-label">Update details, photos & location</p>
                <p className="lr-settings-row-desc">Edit the title, description, images, and meeting point.</p>
              </div>
              <button className="lr-btn-settings-action" onClick={() => router.push(`/provider/listings/edit/${experience.id}`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            </div>
            <div className="lr-settings-row">
              <div className="lr-settings-row-info">
                <p className="lr-settings-row-label">View public page</p>
                <p className="lr-settings-row-desc">See how guests view this experience.</p>
              </div>
              <button className="lr-btn-settings-action" onClick={() => router.push(`/experience/${experience.id}`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                View
              </button>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="lr-settings-card">
          <div className="lr-settings-card-header">
            <h4 className="lr-settings-card-title">Bookings</h4>
          </div>
          <div className="lr-settings-card-body">
            <div className="lr-settings-row">
              <div className="lr-settings-row-info">
                <p className="lr-settings-row-label">View all bookings</p>
                <p className="lr-settings-row-desc">See who has reserved time on your experience.</p>
              </div>
              <button className="lr-btn-settings-action" onClick={() => router.push('/provider/bookings')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Bookings
              </button>
            </div>
          </div>
        </div>

        {/* Experience info */}
        <div className="lr-settings-card">
          <div className="lr-settings-card-header">
            <h4 className="lr-settings-card-title">Experience Info</h4>
          </div>
          <div className="lr-settings-card-body">
            <div className="lr-kv-row"><span className="lr-kv-key">Experience ID</span><span className="lr-kv-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#f7f7f7', padding: '2px 6px', borderRadius: 4, color: '#717171' }}>{experience.id}</span></div>
            <div className="lr-kv-row"><span className="lr-kv-key">Created</span><span className="lr-kv-value">{fmt(experience.created_at)}</span></div>
            <div className="lr-kv-row"><span className="lr-kv-key">Last Updated</span><span className="lr-kv-value">{fmt(experience.updated_at)}</span></div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function ManageExperiencePage() {
  const [experience, setExperience]     = useState(null);
  const [slots, setSlots]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState('overview');

  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editingSlot, setEditingSlot]   = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [formLoading, setFormLoading]   = useState(false);
  const [formError, setFormError]       = useState(null);
  const [formSuccess, setFormSuccess]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]   = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { isAuthenticated, isProvider } = useAuth();
  const router  = useRouter();
  const params  = useParams();

  /* Fetch experience */
  useEffect(() => {
    const load = async () => {
      if (!params?.id || !isAuthenticated || !isProvider()) return;
      setLoading(true);
      try {
        const res = await fetchProviderExperience(params.id);
        if (res?.experience) setExperience(res.experience);
        else setError('Experience not found');
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id, isAuthenticated, isProvider]);

  /* Fetch slots for month */
  const fetchSlots = useCallback(async (month) => {
    if (!params?.id || !isAuthenticated || !isProvider()) return;
    setSlotsLoading(true);
    try {
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end   = new Date(month.getFullYear(), month.getMonth()+1, 0);
      const res = await fetchExperienceSlots(params.id, 1, {
        start_date: padDate(start), end_date: padDate(end), sort: 'asc'
      }, 100);
      setSlots(res?.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [params?.id, isAuthenticated, isProvider]);

  useEffect(() => { fetchSlots(currentMonth); }, [params?.id, isAuthenticated]);
  useEffect(() => { if (activeTab === 'slots') fetchSlots(currentMonth); }, [activeTab, currentMonth]);

  /* Slot CRUD */
  const openDrawer = (slot = null) => {
    setEditingSlot(slot);
    setFormError(null);
    setFormSuccess(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingSlot(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSlotSubmit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingSlot) await updateSlot(editingSlot.id, data);
      else await createSlot(params.id, data);
      await fetchSlots(currentMonth);
      closeDrawer();
    } catch (e) {
      setFormError(e.message || `Failed to ${editingSlot ? 'update' : 'create'} slot`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSlot = (id) => { setDeleteId(id); setDeleteError(null); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteSlot(deleteId);
      await fetchSlots(currentMonth);
      setDeleteId(null);
    } catch (e) {
      setDeleteError(e.message || 'Failed to delete slot');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* Guards */
  if (!isAuthenticated || !isProvider()) {
    return <div className="provider-loading"><div className="spinner large"/><p>Redirecting…</p></div>;
  }

  if (loading) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main"/>
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical"/>
          <div className="provider-main-content">
            <div className="content-wrapper" style={{ padding: '2rem 0' }}>
              {[1,2,3].map(i => (
                <div key={i} className="lr-skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main"/>
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical"/>
          <div className="provider-main-content">
            <div className="lr-empty-state">
              <div className="lr-empty-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 className="lr-empty-title">{error || 'Experience not found'}</h3>
              <button className="lr-btn-new-listing" onClick={() => router.push('/provider/listings')}>← Back to Listings</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'slots',    label: 'Slots'    },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="provider-main-page">
      <ProviderHeader variant="main"/>

      <div className="provider-layout-content">
        <TabNavigation className="provider-left-nav" orientation="vertical"/>

        <motion.main
          className="provider-main-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="content-wrapper">

            {/* Minimal header */}
            <div className="lr-manage-header">
              <div className="lr-manage-breadcrumb">
                <button className="lr-breadcrumb-link" onClick={() => router.push('/provider/listings')}>
                  ← Listings
                </button>
                <span className="lr-breadcrumb-sep">/</span>
                <span className="lr-breadcrumb-current">{experience.title}</span>
              </div>
              <div className="lr-manage-title-row">
                <h1 className="lr-manage-title">{experience.title}</h1>
                <div className="lr-manage-header-actions">
                  <button className="lr-btn-header-action" onClick={() => router.push(`/experience/${experience.id}`)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Preview
                  </button>
                  <button className="lr-btn-header-action primary" onClick={() => router.push(`/provider/listings/edit/${experience.id}`)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="lr-manage-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`lr-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && <OverviewTab key="ov" experience={experience}/>}
              {activeTab === 'slots' && (
                <SlotsTab
                  key="sl"
                  experienceId={params.id}
                  slots={slots}
                  slotsLoading={slotsLoading}
                  onOpenDrawer={openDrawer}
                  onEditSlot={s => openDrawer(s)}
                  onDeleteSlot={handleDeleteSlot}
                />
              )}
              {activeTab === 'settings' && <SettingsTab key="st" experience={experience} router={router}/>}
            </AnimatePresence>

          </div>
        </motion.main>
      </div>

      {/* Slot Drawer */}
      <AnimatePresence>
        <SlotDrawer
          open={drawerOpen}
          editingSlot={editingSlot}
          onClose={closeDrawer}
          onSubmit={handleSlotSubmit}
          formLoading={formLoading}
          formError={formError}
          formSuccess={formSuccess}
        />
      </AnimatePresence>

      {/* Delete Confirm Drawer */}
      <AnimatePresence>
        <DeleteConfirmDrawer
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          error={deleteError}
        />
      </AnimatePresence>
    </div>
  );
}
