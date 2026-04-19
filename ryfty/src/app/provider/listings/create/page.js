"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import dynamic from 'next/dynamic';
import '@/styles/provider.css';
import '@/styles/listing-redesign.css';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div style={{ height: 280, background: '#f7f7f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#717171', fontSize: '0.875rem' }}>Loading map...</div>
});

/* ─── Shared Chip Input Component ───────────────────────── */
function ChipInput({ chips, onAdd, onRemove, placeholder, chipVariant = 'primary', hint }) {
  const [inputVal, setInputVal] = useState('');

  const commit = () => {
    const v = inputVal.trim();
    if (v) { onAdd(v); setInputVal(''); }
  };

  return (
    <div>
      <div
        className="lr-chip-input-wrap"
        onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
      >
        {chips.map((chip, i) => (
          <span key={i} className={`lr-chip ${chipVariant}`}>
            {chip}
            <button className="lr-chip-remove" type="button" onClick={() => onRemove(chip)} aria-label={`Remove ${chip}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </span>
        ))}
        <input
          className="lr-chip-text-input"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === ',' ) { e.preventDefault(); commit(); } }}
          placeholder={chips.length === 0 ? placeholder : ''}
        />
      </div>
      {hint && <p className="lr-chip-input-hint">{hint}</p>}
    </div>
  );
}

/* ─── Status Toggle ──────────────────────────────────────── */
function StatusToggle({ value, onChange }) {
  const isPublished = value === 'published';
  return (
    <div
      className="lr-status-toggle-wrap"
      onClick={() => onChange(isPublished ? 'draft' : 'published')}
    >
      <div className="lr-status-toggle-info">
        <p className="lr-status-toggle-label">{isPublished ? 'Published' : 'Draft'}</p>
        <p className="lr-status-toggle-desc">
          {isPublished
            ? 'Visible to guests and accepting bookings'
            : 'Hidden from guests — save and continue editing'}
        </p>
      </div>
      <div className={`lr-toggle-switch ${isPublished ? 'active' : ''}`}>
        <div className="lr-toggle-thumb"/>
      </div>
    </div>
  );
}

/* ─── Horizontal Step Indicator ─────────────────────────── */
function StepIndicator({ currentStep, totalSteps, steps, onStepClick }) {
  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;
  return (
    <div className="lr-step-indicator">
      <div className="lr-step-progress-track">
        <div className="lr-step-fill-line" style={{ width: `${progressPct}%` }}/>
        {steps.map((step) => {
          const completed = currentStep > step.id;
          const active    = currentStep === step.id;
          return (
            <div
              key={step.id}
              className={`lr-step-dot-wrap ${completed ? 'completed' : ''} ${active ? 'current' : ''}`}
              onClick={() => completed && onStepClick && onStepClick(step.id)}
              title={step.title}
            >
              <div className={`lr-step-dot ${completed ? 'completed' : ''} ${active ? 'current' : ''}`}>
                {completed
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12"/></svg>
                  : step.id
                }
              </div>
              <span className="lr-step-label">{step.title}</span>
            </div>
          );
        })}
      </div>
      <p className="lr-step-current-label">
        Step {currentStep} of {totalSteps} — <strong>{steps[currentStep - 1]?.title}</strong>
      </p>
    </div>
  );
}

/* ─── Step 1: Basic Info ─────────────────────────────────── */
function Step1({ formData, handleInputChange }) {
  return (
    <motion.div className="lr-step-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="lr-step-heading">Tell us about your experience</h2>
      <p className="lr-step-subheading">Start with the basics — a great title and description set the stage.</p>

      <div className="lr-field">
        <label className="lr-label" htmlFor="lr-title">Experience Title *</label>
        <input
          id="lr-title"
          className="lr-input"
          type="text"
          value={formData.title}
          onChange={e => handleInputChange('title', e.target.value)}
          placeholder="e.g., Sunset Safari Adventure in Maasai Mara"
          autoComplete="off"
        />
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="lr-description">Description *</label>
        <textarea
          id="lr-description"
          className="lr-textarea"
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          placeholder="Describe what guests will experience, see, and feel. Be vivid and specific."
          rows={6}
        />
      </div>

      <div className="lr-field">
        <label className="lr-label">Listing Status</label>
        <StatusToggle value={formData.status} onChange={(v) => handleInputChange('status', v)} />
        <p className="lr-field-hint">You can always change this later from the manage page.</p>
      </div>
    </motion.div>
  );
}

/* ─── Step 2: Destinations & Activities ─────────────────── */
function Step2({ formData, handleArrayInputChange }) {
  return (
    <motion.div className="lr-step-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="lr-step-heading">Where and what?</h2>
      <p className="lr-step-subheading">Tell guests where they'll go and what they'll do.</p>

      <div className="lr-field">
        <label className="lr-label">Destinations *</label>
        <ChipInput
          chips={formData.destinations}
          onAdd={v => handleArrayInputChange('destinations', v, 'add')}
          onRemove={v => handleArrayInputChange('destinations', v, 'remove')}
          placeholder="Type a destination and press Enter…"
          chipVariant="primary"
          hint="e.g., Maasai Mara, Lake Nakuru, Nairobi"
        />
      </div>

      <div className="lr-field">
        <label className="lr-label">Activities *</label>
        <ChipInput
          chips={formData.activities}
          onAdd={v => handleArrayInputChange('activities', v, 'add')}
          onRemove={v => handleArrayInputChange('activities', v, 'remove')}
          placeholder="Type an activity and press Enter…"
          chipVariant="primary"
          hint="e.g., Game Drive, Bush Walk, Sundowner"
        />
      </div>
    </motion.div>
  );
}

/* ─── Step 3: Inclusions & Exclusions ───────────────────── */
function Step3({ formData, handleArrayInputChange }) {
  return (
    <motion.div className="lr-step-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="lr-step-heading">What's included?</h2>
      <p className="lr-step-subheading">Help guests know exactly what they're getting — and what they need to bring.</p>

      <div className="lr-two-col-chips">
        <div>
          <div className="lr-col-label green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12"/></svg>
            What's Included
          </div>
          <ChipInput
            chips={formData.inclusions}
            onAdd={v => handleArrayInputChange('inclusions', v, 'add')}
            onRemove={v => handleArrayInputChange('inclusions', v, 'remove')}
            placeholder="e.g., Transport, Meals…"
            chipVariant="green"
            hint="Press Enter or comma to add"
          />
        </div>
        <div>
          <div className="lr-col-label red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            What's Not Included
          </div>
          <ChipInput
            chips={formData.exclusions}
            onAdd={v => handleArrayInputChange('exclusions', v, 'add')}
            onRemove={v => handleArrayInputChange('exclusions', v, 'remove')}
            placeholder="e.g., Park fees, Tips…"
            chipVariant="red"
            hint="Press Enter or comma to add"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Step 4: Images ─────────────────────────────────────── */
function Step4({ formData, handleInputChange, handleArrayInputChange }) {
  const [uploadingPoster, setUploadingPoster]   = useState(false);
  const [uploadingImages, setUploadingImages]   = useState(false);
  const [posterPreview, setPosterPreview]       = useState(null);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);

  useEffect(() => {
    return () => {
      if (posterPreview?.blob) URL.revokeObjectURL(posterPreview.blob);
      additionalPreviews.forEach(p => { if (p.blob) URL.revokeObjectURL(p.blob); });
    };
  }, []);

  const getFileHash = (file) => `${file.name}_${file.size}_${file.lastModified}`;

  const uploadToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ryfty_images');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.secure_url;
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = URL.createObjectURL(file);
    setPosterPreview({ blob, uploading: true });
    setUploadingPoster(true);
    try {
      const url = await uploadToCloudinary(file);
      handleInputChange('poster_image_url', url);
      setPosterPreview({ url, blob, uploading: false });
    } catch {
      alert('Failed to upload image. Please try again.');
      setPosterPreview(null);
      URL.revokeObjectURL(blob);
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const previews = files.map((file, i) => ({
      id: `${Date.now()}_${i}`,
      blob: URL.createObjectURL(file),
      file,
      uploading: true,
      alt: `Experience image ${formData.images.length + i + 1}`
    }));
    setAdditionalPreviews(prev => [...prev, ...previews]);
    setUploadingImages(true);
    for (const preview of previews) {
      try {
        const url = await uploadToCloudinary(preview.file);
        setAdditionalPreviews(prev => prev.map(p => p.id === preview.id ? { ...p, url, uploading: false } : p));
        handleArrayInputChange('images', { url, alt: preview.alt, publicId: preview.file.name.split('.')[0] }, 'add');
      } catch {
        setAdditionalPreviews(prev => prev.filter(p => p.id !== preview.id));
      }
    }
    setUploadingImages(false);
  };

  const posterSrc = posterPreview?.blob || formData.poster_image_url;

  return (
    <motion.div className="lr-step-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="lr-step-heading">Show your experience</h2>
      <p className="lr-step-subheading">Great photos make the difference. Add a cover image and a gallery.</p>

      {/* Poster */}
      <div className="lr-field">
        <label className="lr-label">Cover Photo *</label>
        <input type="file" id="lr-poster" accept="image/*" style={{ display: 'none' }} onChange={handlePosterUpload} />
        {posterSrc ? (
          <div className="lr-poster-preview">
            <img src={posterSrc} alt="Poster preview" />
            {posterPreview?.uploading && (
              <div className="lr-uploading-overlay">
                <div className="spinner small"/>
              </div>
            )}
            <button
              type="button"
              className="lr-image-remove-btn"
              onClick={() => { handleInputChange('poster_image_url', ''); setPosterPreview(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ) : (
          <label htmlFor="lr-poster" className="lr-image-upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div className="lr-upload-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            {uploadingPoster
              ? <p className="lr-upload-title">Uploading…</p>
              : <>
                <p className="lr-upload-title">Upload cover photo</p>
                <p className="lr-upload-hint">Click to choose or drag & drop · JPG, PNG, WEBP · Max 5 MB</p>
              </>
            }
          </label>
        )}
      </div>

      {/* Gallery */}
      <div className="lr-field">
        <label className="lr-label">Gallery Photos <span style={{ fontWeight: 400, color: '#717171' }}>(optional)</span></label>
        <input type="file" id="lr-gallery" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload} />
        <label htmlFor="lr-gallery" className="lr-image-upload-zone" style={{ display: 'block', cursor: 'pointer', padding: '1.25rem' }}>
          <div className="lr-upload-icon" style={{ width: 32, height: 32, marginBottom: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          {uploadingImages
            ? <p className="lr-upload-title" style={{ fontSize: '0.875rem' }}>Uploading…</p>
            : <>
              <p className="lr-upload-title" style={{ fontSize: '0.875rem' }}>Add gallery photos</p>
              <p className="lr-upload-hint">Select multiple</p>
            </>
          }
        </label>

        {(formData.images.length > 0 || additionalPreviews.length > 0) && (
          <div className="lr-gallery-grid" style={{ marginTop: '0.75rem' }}>
            {formData.images.map((img, idx) => (
              <div key={`up_${idx}`} className="lr-gallery-item">
                <img src={img.url} alt={img.alt} />
                <div className="lr-gallery-item-overlay">
                  <button
                    type="button"
                    className="lr-gallery-remove"
                    onClick={() => handleArrayInputChange('images', img, 'remove')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
            {additionalPreviews.map(p => (
              <div key={p.id} className="lr-gallery-item">
                <img src={p.blob} alt={p.alt} />
                {p.uploading && (
                  <div className="lr-uploading-overlay">
                    <div className="spinner small"/>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Step 5: Location & Dates ───────────────────────────── */
function Step5({ formData, handleInputChange, handleNestedInputChange }) {
  return (
    <motion.div className="lr-step-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="lr-step-heading">Where and when?</h2>
      <p className="lr-step-subheading">Set the meeting point on the map and the dates guests can book.</p>

      {/* Map */}
      <div className="lr-field">
        <label className="lr-label">Meeting Point Location *</label>
        <p className="lr-field-hint" style={{ marginBottom: '0.75rem' }}>Pin the exact location where guests will meet you.</p>
        <LocationPicker
          latitude={formData.meeting_point.coordinates.latitude}
          longitude={formData.meeting_point.coordinates.longitude}
          onLocationChange={(lat, lng) => handleNestedInputChange('meeting_point', 'coordinates', { latitude: lat, longitude: lng })}
          onAddressChange={(addr) => handleNestedInputChange('meeting_point', 'address', addr)}
        />
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="lr-mp-name">Meeting Point Name *</label>
        <input
          id="lr-mp-name"
          className="lr-input"
          type="text"
          value={formData.meeting_point.name}
          onChange={e => handleNestedInputChange('meeting_point', 'name', e.target.value)}
          placeholder="e.g., Nairobi National Park Gate"
          autoComplete="off"
        />
        <p className="lr-field-hint">A memorable name your guests will recognise.</p>
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="lr-mp-addr">Address</label>
        <input
          id="lr-mp-addr"
          className="lr-input"
          type="text"
          value={formData.meeting_point.address}
          readOnly
          placeholder="Auto-filled from map pin"
          style={{ background: '#f7f7f7', color: '#717171' }}
        />
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="lr-mp-inst">Meeting Instructions</label>
        <textarea
          id="lr-mp-inst"
          className="lr-textarea"
          value={formData.meeting_point.instructions}
          onChange={e => handleNestedInputChange('meeting_point', 'instructions', e.target.value)}
          placeholder="e.g., Look for the green Ryfty jeep at the main entrance. Please arrive 15 minutes early."
          rows={3}
        />
      </div>

      <div className="lr-field-row">
        <div className="lr-field" style={{ margin: 0 }}>
          <label className="lr-label" htmlFor="lr-start">Start Date *</label>
          <input
            id="lr-start"
            className="lr-input"
            type="date"
            value={formData.start_date}
            onChange={e => handleInputChange('start_date', e.target.value)}
          />
          <p className="lr-field-hint">When does availability begin?</p>
        </div>
        <div className="lr-field" style={{ margin: 0 }}>
          <label className="lr-label" htmlFor="lr-end">End Date *</label>
          <input
            id="lr-end"
            className="lr-input"
            type="date"
            value={formData.end_date}
            onChange={e => handleInputChange('end_date', e.target.value)}
          />
          <p className="lr-field-hint">When does availability end?</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Step 6: Preview ────────────────────────────────────── */
function Step6({ formData }) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <div className="lr-step-card" style={{ marginBottom: '1rem' }}>
        <h2 className="lr-step-heading">Review before publishing</h2>
        <p className="lr-step-subheading">This is how your experience looks to guests.</p>
      </div>

      {/* Cover */}
      {formData.poster_image_url && (
        <div className="lr-poster-preview" style={{ marginBottom: '1rem', aspectRatio: '21/8' }}>
          <img src={formData.poster_image_url} alt="Cover" style={{ borderRadius: 'var(--lr-radius-lg)' }}/>
        </div>
      )}

      {/* Title & status */}
      <div className="lr-preview-card" style={{ marginBottom: '1rem' }}>
        <div className="lr-preview-card-body">
          <p className="lr-preview-title">{formData.title || 'Untitled Experience'}</p>
          <span className={`lr-status-pill ${formData.status}`} style={{ position: 'static', display: 'inline-flex', marginBottom: '0.75rem' }}>
            <span className="lr-status-dot"/>
            {formData.status === 'published' ? 'Published' : 'Draft'}
          </span>
          <p className="lr-preview-desc">{formData.description || '—'}</p>
        </div>
      </div>

      {/* Destinations & Activities */}
      <div className="lr-preview-card" style={{ marginBottom: '1rem' }}>
        <div className="lr-preview-card-header">
          <h4 className="lr-preview-section-title">Destinations & Activities</h4>
        </div>
        <div className="lr-preview-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {formData.destinations.length > 0 && (
            <div className="lr-preview-tag-list">
              {formData.destinations.map((d, i) => <span key={i} className="lr-preview-tag neutral">{d}</span>)}
            </div>
          )}
          {formData.activities.length > 0 && (
            <div className="lr-preview-tag-list">
              {formData.activities.map((a, i) => <span key={i} className="lr-preview-tag neutral">{a}</span>)}
            </div>
          )}
          {formData.destinations.length === 0 && formData.activities.length === 0 && (
            <p style={{ color: '#717171', fontSize: '0.875rem', margin: 0 }}>None added</p>
          )}
        </div>
      </div>

      {/* Inclusions / Exclusions */}
      <div className="lr-preview-card" style={{ marginBottom: '1rem' }}>
        <div className="lr-preview-card-header">
          <h4 className="lr-preview-section-title">What's Included</h4>
        </div>
        <div className="lr-preview-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Included</p>
              <div className="lr-preview-tag-list">
                {formData.inclusions.length > 0
                  ? formData.inclusions.map((inc, i) => <span key={i} className="lr-preview-tag green">{inc}</span>)
                  : <span style={{ color: '#717171', fontSize: '0.8125rem' }}>None</span>}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Not Included</p>
              <div className="lr-preview-tag-list">
                {formData.exclusions.length > 0
                  ? formData.exclusions.map((exc, i) => <span key={i} className="lr-preview-tag red">{exc}</span>)
                  : <span style={{ color: '#717171', fontSize: '0.8125rem' }}>None</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Dates */}
      <div className="lr-preview-card">
        <div className="lr-preview-card-header">
          <h4 className="lr-preview-section-title">Location & Dates</h4>
        </div>
        <div className="lr-preview-card-body">
          <div className="lr-kv-row"> <span className="lr-kv-key">Meeting Point</span> <span className="lr-kv-value">{formData.meeting_point.name || '—'}</span> </div>
          <div className="lr-kv-row"> <span className="lr-kv-key">Address</span> <span className="lr-kv-value">{formData.meeting_point.address || '—'}</span> </div>
          <div className="lr-kv-row"> <span className="lr-kv-key">Instructions</span> <span className="lr-kv-value">{formData.meeting_point.instructions || '—'}</span> </div>
          <div className="lr-kv-row"> <span className="lr-kv-key">Availability</span> <span className="lr-kv-value">{fmt(formData.start_date)} – {fmt(formData.end_date)}</span> </div>
          <div className="lr-kv-row"> <span className="lr-kv-key">Status</span> <span className="lr-kv-value" style={{ textTransform: 'capitalize' }}>{formData.status}</span> </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Success Modal ─────────────────────────────────────── */
function SuccessModal({ show, onGoListings, onClose }) {
  if (!show) return null;
  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 64, height: 64, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#065f46' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12"/></svg>
        </div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Experience Created! 🎉</h2>
        <p style={{ fontSize: '0.9375rem', color: '#717171', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Next step: head to your listing and add <strong>time slots</strong> — that's what guests book!
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="lr-btn-next" onClick={onGoListings}>Go to Listings →</button>
          <button className="lr-btn-prev" onClick={onClose}>Later</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function CreateListingPage() {
  const [formStep, setFormStep]               = useState(1);
  const [showSuccess, setShowSuccess]         = useState(false);
  const [loading, setLoading]                 = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destinations: [],
    activities: [],
    inclusions: [],
    exclusions: [],
    images: [],
    poster_image_url: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    meeting_point: {
      name: '',
      address: '',
      coordinates: { latitude: null, longitude: null },
      instructions: ''
    }
  });

  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();

  const TOTAL_STEPS = 6;
  const STEPS = [
    { id: 1, title: 'Basics' },
    { id: 2, title: 'Details' },
    { id: 3, title: 'Includes' },
    { id: 4, title: 'Photos' },
    { id: 5, title: 'Location' },
    { id: 6, title: 'Preview' },
  ];

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => prev[field] === value ? prev : { ...prev, [field]: value });
  }, []);

  const handleNestedInputChange = useCallback((parent, field, value) => {
    setFormData(prev => {
      if (prev[parent][field] === value) return prev;
      return { ...prev, [parent]: { ...prev[parent], [field]: value } };
    });
  }, []);

  const handleArrayInputChange = useCallback((field, value, action = 'add') => {
    setFormData(prev => {
      if (action === 'add') {
        const exists = field === 'images' && typeof value === 'object'
          ? prev[field].some(i => i.url === value.url)
          : prev[field].includes(value);
        if (exists) return prev;
        return { ...prev, [field]: [...prev[field], value] };
      } else {
        const filtered = field === 'images' && typeof value === 'object'
          ? prev[field].filter(i => i.url !== value.url)
          : prev[field].filter(i => i !== value);
        return { ...prev, [field]: filtered };
      }
    });
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { createExperience } = await import('@/utils/api');
      await createExperience({
        title: formData.title,
        description: formData.description,
        destinations: formData.destinations,
        activities: formData.activities,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        poster_image_url: formData.poster_image_url,
        images: formData.images || [],
        status: formData.status,
        meeting_point: {
          name: formData.meeting_point.name,
          address: formData.meeting_point.address,
          instructions: formData.meeting_point.instructions,
          coordinates: {
            latitude: parseFloat(formData.meeting_point.coordinates.latitude),
            longitude: parseFloat(formData.meeting_point.coordinates.longitude)
          }
        }
      });
      setShowSuccess(true);
    } catch (err) {
      console.error('Error creating experience:', err);
      alert('Failed to create experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isProvider()) {
    return <div className="provider-loading"><div className="spinner large"/><p>Redirecting…</p></div>;
  }

  const renderStep = () => {
    const props = { formData, handleInputChange, handleNestedInputChange, handleArrayInputChange };
    switch (formStep) {
      case 1: return <Step1 {...props} />;
      case 2: return <Step2 {...props} />;
      case 3: return <Step3 {...props} />;
      case 4: return <Step4 {...props} />;
      case 5: return <Step5 {...props} />;
      case 6: return <Step6 {...props} />;
      default: return <Step1 {...props} />;
    }
  };

  return (
    <div className="provider-main-page">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation className="provider-left-nav" orientation="vertical" />

        <motion.main
          className="provider-main-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="content-wrapper">
            <div className="lr-wizard">

              {/* Wizard header */}
              <div className="lr-wizard-header">
                <button className="lr-back-link" onClick={() => router.push('/provider/listings')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Listings
                </button>
                <h1 className="lr-wizard-page-title">Create Experience</h1>
              </div>

              {/* Step indicator */}
              <StepIndicator
                currentStep={formStep}
                totalSteps={TOTAL_STEPS}
                steps={STEPS}
                onStepClick={setFormStep}
              />

              {/* Step content */}
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>

              {/* Sticky footer nav */}
              <div className="lr-wizard-footer">
                <div className="lr-wizard-footer-inner">
                  <span className="lr-step-counter">Step {formStep} of {TOTAL_STEPS}</span>
                  <div className="lr-footer-actions">
                    <button
                      className="lr-btn-prev"
                      type="button"
                      onClick={() => setFormStep(s => Math.max(1, s - 1))}
                      disabled={formStep === 1}
                    >
                      Previous
                    </button>
                    {formStep < TOTAL_STEPS ? (
                      <button
                        className="lr-btn-next"
                        type="button"
                        onClick={() => setFormStep(s => Math.min(TOTAL_STEPS, s + 1))}
                      >
                        Continue
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    ) : (
                      <button
                        className="lr-btn-submit"
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading
                          ? <><div className="spinner small"/>Creating…</>
                          : <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12"/></svg>
                            Create Experience
                          </>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.main>
      </div>

      <AnimatePresence>
        <SuccessModal
          show={showSuccess}
          onGoListings={() => router.push('/provider/listings')}
          onClose={() => setShowSuccess(false)}
        />
      </AnimatePresence>
    </div>
  );
}
