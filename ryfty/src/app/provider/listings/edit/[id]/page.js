"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperience, updateExperience } from '@/utils/api';
import dynamic from 'next/dynamic';
import '@/styles/provider.css';
import '@/styles/listing-redesign.css';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, background: '#f7f7f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#717171', fontSize: '0.875rem' }}>
      Loading map…
    </div>
  )
});

/* ─── Chip Input ────────────────────────────────────────── */
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
        onClick={e => e.currentTarget.querySelector('input')?.focus()}
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
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === ',')     { e.preventDefault(); commit(); }
          }}
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
    <div className="lr-status-toggle-wrap" onClick={() => onChange(isPublished ? 'draft' : 'published')}>
      <div className="lr-status-toggle-info">
        <p className="lr-status-toggle-label">{isPublished ? 'Published' : 'Draft'}</p>
        <p className="lr-status-toggle-desc">
          {isPublished ? 'Visible to guests and accepting bookings' : 'Hidden from guests — save and continue editing'}
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
        {steps.map(step => {
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
                  : step.id}
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
      <h2 className="lr-step-heading">Basic Information</h2>
      <p className="lr-step-subheading">Update the title, description, and visibility of this experience.</p>

      <div className="lr-field">
        <label className="lr-label" htmlFor="ed-title">Experience Title *</label>
        <input
          id="ed-title"
          className="lr-input"
          type="text"
          value={formData.title}
          onChange={e => handleInputChange('title', e.target.value)}
          placeholder="e.g., Sunset Safari Adventure in Maasai Mara"
          autoComplete="off"
        />
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="ed-description">Description *</label>
        <textarea
          id="ed-description"
          className="lr-textarea"
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          placeholder="Describe what guests will experience…"
          rows={6}
        />
      </div>

      <div className="lr-field">
        <label className="lr-label">Listing Status</label>
        <StatusToggle value={formData.status} onChange={v => handleInputChange('status', v)} />
      </div>
    </motion.div>
  );
}

/* ─── Step 2: Destinations & Activities ─────────────────── */
function Step2({ formData, handleArrayInputChange }) {
  return (
    <motion.div className="lr-step-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="lr-step-heading">Where and what?</h2>
      <p className="lr-step-subheading">Update destinations and activities for this experience.</p>

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
      <p className="lr-step-subheading">Update inclusions and exclusions for this experience.</p>

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
  const [uploadingPoster, setUploadingPoster]     = useState(false);
  const [uploadingImages, setUploadingImages]     = useState(false);
  const [pendingPreviews, setPendingPreviews]     = useState([]);

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
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPoster(true);
    try {
      const url = await uploadToCloudinary(file);
      handleInputChange('poster_image_url', url);
    } catch { alert('Poster upload failed. Please try again.'); }
    finally { setUploadingPoster(false); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    const previews = files.map((f, i) => ({ id: `${Date.now()}_${i}`, blob: URL.createObjectURL(f), file: f, uploading: true, alt: `Experience image ${formData.images.length + i + 1}` }));
    setPendingPreviews(prev => [...prev, ...previews]);
    setUploadingImages(true);
    for (const p of previews) {
      try {
        const url = await uploadToCloudinary(p.file);
        setPendingPreviews(prev => prev.map(x => x.id === p.id ? { ...x, url, uploading: false } : x));
        handleArrayInputChange('images', { url, alt: p.alt, publicId: p.file.name.split('.')[0] }, 'add');
      } catch { setPendingPreviews(prev => prev.filter(x => x.id !== p.id)); }
    }
    setUploadingImages(false);
  };

  return (
    <motion.div className="lr-step-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="lr-step-heading">Photos</h2>
      <p className="lr-step-subheading">Update the cover photo and gallery images.</p>

      {/* Poster */}
      <div className="lr-field">
        <label className="lr-label">Cover Photo *</label>
        <input type="file" id="ed-poster" accept="image/*" style={{ display: 'none' }} onChange={handlePosterUpload}/>
        {formData.poster_image_url ? (
          <div className="lr-poster-preview">
            <img src={formData.poster_image_url} alt="Cover preview"/>
            {uploadingPoster && <div className="lr-uploading-overlay"><div className="spinner small"/></div>}
            <button type="button" className="lr-image-remove-btn" onClick={() => handleInputChange('poster_image_url', '')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ) : (
          <label htmlFor="ed-poster" className="lr-image-upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div className="lr-upload-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="lr-upload-title">{uploadingPoster ? 'Uploading…' : 'Upload cover photo'}</p>
            <p className="lr-upload-hint">JPG, PNG, WEBP · Max 5 MB</p>
          </label>
        )}
      </div>

      {/* Gallery */}
      <div className="lr-field">
        <label className="lr-label">Gallery Photos <span style={{ fontWeight: 400, color: '#717171' }}>(optional)</span></label>
        <input type="file" id="ed-gallery" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload}/>
        <label htmlFor="ed-gallery" className="lr-image-upload-zone" style={{ display: 'block', cursor: 'pointer', padding: '1.25rem' }}>
          <p className="lr-upload-title" style={{ fontSize: '0.875rem' }}>{uploadingImages ? 'Uploading…' : 'Add gallery photos'}</p>
          <p className="lr-upload-hint">Select multiple images</p>
        </label>
        {(formData.images.length > 0 || pendingPreviews.length > 0) && (
          <div className="lr-gallery-grid" style={{ marginTop: '0.75rem' }}>
            {formData.images.map((img, i) => (
              <div key={`img_${i}`} className="lr-gallery-item">
                <img src={img.url || img} alt={img.alt || `Photo ${i+1}`}/>
                <div className="lr-gallery-item-overlay">
                  <button type="button" className="lr-gallery-remove" onClick={() => handleArrayInputChange('images', img, 'remove')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
            {pendingPreviews.map(p => (
              <div key={p.id} className="lr-gallery-item">
                <img src={p.blob} alt={p.alt}/>
                {p.uploading && <div className="lr-uploading-overlay"><div className="spinner small"/></div>}
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
      <h2 className="lr-step-heading">Location & Dates</h2>
      <p className="lr-step-subheading">Update the meeting point and experience dates.</p>

      <div className="lr-field">
        <label className="lr-label">Meeting Point Location</label>
        <p className="lr-field-hint" style={{ marginBottom: '0.75rem' }}>Drag the pin to update the exact location.</p>
        <LocationPicker
          latitude={formData.meeting_point.coordinates.latitude}
          longitude={formData.meeting_point.coordinates.longitude}
          onLocationChange={(lat, lng) => handleNestedInputChange('meeting_point', 'coordinates', { latitude: lat, longitude: lng })}
          onAddressChange={addr => handleNestedInputChange('meeting_point', 'address', addr)}
        />
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="ed-mp-name">Meeting Point Name *</label>
        <input
          id="ed-mp-name"
          className="lr-input"
          type="text"
          value={formData.meeting_point.name}
          onChange={e => handleNestedInputChange('meeting_point', 'name', e.target.value)}
          placeholder="e.g., Nairobi National Park Gate"
          autoComplete="off"
        />
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="ed-mp-addr">Address</label>
        <input
          id="ed-mp-addr"
          className="lr-input"
          type="text"
          value={formData.meeting_point.address}
          onChange={e => handleNestedInputChange('meeting_point', 'address', e.target.value)}
          placeholder="Auto-filled from map, or type manually"
        />
      </div>

      <div className="lr-field">
        <label className="lr-label" htmlFor="ed-mp-inst">Meeting Instructions</label>
        <textarea
          id="ed-mp-inst"
          className="lr-textarea"
          value={formData.meeting_point.instructions}
          onChange={e => handleNestedInputChange('meeting_point', 'instructions', e.target.value)}
          placeholder="e.g., Look for the green Ryfty jeep at the main entrance."
          rows={3}
        />
      </div>

      <div className="lr-field-row">
        <div className="lr-field" style={{ margin: 0 }}>
          <label className="lr-label" htmlFor="ed-start">Start Date *</label>
          <input
            id="ed-start"
            className="lr-input"
            type="date"
            value={formData.start_date}
            onChange={e => handleInputChange('start_date', e.target.value)}
          />
        </div>
        <div className="lr-field" style={{ margin: 0 }}>
          <label className="lr-label" htmlFor="ed-end">End Date *</label>
          <input
            id="ed-end"
            className="lr-input"
            type="date"
            value={formData.end_date}
            onChange={e => handleInputChange('end_date', e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function EditExperiencePage() {
  const [formStep,     setFormStep]     = useState(1);
  const [formData,     setFormData]     = useState({
    title: '', description: '', destinations: [], activities: [],
    inclusions: [], exclusions: [], images: [], poster_image_url: '',
    start_date: '', end_date: '', status: 'draft',
    meeting_point: { name: '', address: '', coordinates: { latitude: null, longitude: null }, instructions: '' }
  });
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [pageError,    setPageError]    = useState(null);
  const [saveError,    setSaveError]    = useState(null);
  const [saveSuccess,  setSaveSuccess]  = useState(false);
  const [expTitle,     setExpTitle]     = useState('');

  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();
  const params = useParams();

  const TOTAL_STEPS = 5;
  const STEPS = [
    { id: 1, title: 'Basics'   },
    { id: 2, title: 'Details'  },
    { id: 3, title: 'Includes' },
    { id: 4, title: 'Photos'   },
    { id: 5, title: 'Location' },
  ];

  useEffect(() => {
    const load = async () => {
      if (!params?.id || !isAuthenticated || !isProvider()) return;
      setLoading(true);
      try {
        const res = await fetchProviderExperience(params.id);
        if (res?.experience) {
          const e = res.experience;
          setExpTitle(e.title || 'Edit Experience');
          setFormData({
            title:             e.title             || '',
            description:       e.description       || '',
            destinations:      e.destinations      || [],
            activities:        e.activities        || [],
            inclusions:        e.inclusions        || [],
            exclusions:        e.exclusions        || [],
            images:            e.images            || [],
            poster_image_url:  e.poster_image_url  || '',
            start_date:        e.start_date        || '',
            end_date:          e.end_date          || '',
            status:            e.status            || 'draft',
            meeting_point:     e.meeting_point     || { name: '', address: '', coordinates: { latitude: null, longitude: null }, instructions: '' }
          });
        } else setPageError('Experience not found');
      } catch (e) {
        setPageError(e.message || 'Failed to load experience');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id, isAuthenticated, isProvider]);

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
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateExperience(params.id, {
        ...formData,
        end_date: formData.end_date || null,
        meeting_point: {
          ...formData.meeting_point,
          coordinates: {
            latitude:  parseFloat(formData.meeting_point.coordinates.latitude),
            longitude: parseFloat(formData.meeting_point.coordinates.longitude)
          }
        }
      });
      setSaveSuccess(true);
      setTimeout(() => router.push(`/provider/listings/manage/${params.id}`), 1500);
    } catch (err) {
      setSaveError(err.message || 'Failed to update experience');
    } finally {
      setSaving(false);
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
              {[1,2,3].map(i => <div key={i} className="lr-skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }}/>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageError) {
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
              <h3 className="lr-empty-title">{pageError}</h3>
              <button className="lr-btn-new-listing" onClick={() => router.push('/provider/listings')}>← Back to Listings</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sharedProps = { formData, handleInputChange, handleNestedInputChange, handleArrayInputChange };

  const renderStep = () => {
    switch (formStep) {
      case 1: return <Step1 key="s1" {...sharedProps}/>;
      case 2: return <Step2 key="s2" {...sharedProps}/>;
      case 3: return <Step3 key="s3" {...sharedProps}/>;
      case 4: return <Step4 key="s4" {...sharedProps}/>;
      case 5: return <Step5 key="s5" {...sharedProps}/>;
      default: return <Step1 key="s1" {...sharedProps}/>;
    }
  };

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
            <div className="lr-wizard">

              {/* Header */}
              <div className="lr-wizard-header">
                <button
                  className="lr-back-link"
                  onClick={() => router.push(`/provider/listings/manage/${params.id}`)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back to manage
                </button>
                <h1 className="lr-wizard-page-title">Edit Experience</h1>
                <span className="lr-wizard-page-context">{expTitle}</span>
              </div>

              {/* Global messages */}
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div className="lr-form-success" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: '1rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 6L9 17L4 12"/></svg>
                    Experience saved! Redirecting…
                  </motion.div>
                )}
                {saveError && (
                  <motion.div className="lr-form-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: '1rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {saveError}
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Sticky footer */}
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
                        disabled={saving}
                      >
                        {saving
                          ? <><div className="spinner small"/>Saving…</>
                          : <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12"/></svg>
                            Save All Changes
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
    </div>
  );
}
