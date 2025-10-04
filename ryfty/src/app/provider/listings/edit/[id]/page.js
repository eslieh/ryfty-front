"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperience, updateExperience } from '@/utils/api';
import '@/styles/provider.css';

export default function EditExperiencePage() {
  const [formStep, setFormStep] = useState(1); // Step within the experience form
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
      coordinates: {
        latitude: null,
        longitude: null
      },
      instructions: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();
  const params = useParams();

  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (!isAuthenticated || !isProvider()) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, isProvider, router]);

  // Fetch experience data
  useEffect(() => {
    const fetchExperienceData = async () => {
      if (!params?.id || !isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchProviderExperience(params.id);
        
        if (response && response.experience) {
          const experience = response.experience;
          setFormData({
            title: experience.title || '',
            description: experience.description || '',
            destinations: experience.destinations || [],
            activities: experience.activities || [],
            inclusions: experience.inclusions || [],
            exclusions: experience.exclusions || [],
            images: experience.images || [],
            poster_image_url: experience.poster_image_url || '',
            start_date: experience.start_date || '',
            end_date: experience.end_date || '',
            status: experience.status || 'draft',
            meeting_point: experience.meeting_point || {
              name: '',
              address: '',
              coordinates: { latitude: null, longitude: null },
              instructions: ''
            }
          });
        } else {
          setError('Experience not found');
        }
      } catch (err) {
        console.error('Error fetching experience:', err);
        setError(err.message || 'Failed to fetch experience');
      } finally {
        setLoading(false);
      }
    };

    fetchExperienceData();
  }, [params?.id, isAuthenticated, isProvider]);

  // Optimized input handlers - prevent unnecessary re-renders
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      // Only update if value actually changed to prevent unnecessary re-renders
      if (prev[field] === value) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const handleNestedInputChange = useCallback((parent, field, value) => {
    setFormData(prev => {
      // Only update if value actually changed to prevent unnecessary re-renders
      if (prev[parent][field] === value) return prev;
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value
        }
      };
    });
  }, []);

  const handleArrayInputChange = useCallback((field, value, action = 'add') => {
    setFormData(prev => ({
      ...prev,
      [field]: action === 'add' 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      await updateExperience(params.id, formData);
      setSaveSuccess(true);
      
      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        router.push('/provider/listings');
      }, 2000);
    } catch (err) {
      console.error('Error updating experience:', err);
      setSaveError(err.message || 'Failed to update experience');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !isProvider()) {
    return (
      <div className="provider-loading">
        <div className="spinner large"></div>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation
            className="provider-left-nav"
            orientation="vertical"
          />
          <div className="provider-main-content">
            <div className="experiences-loading">
              <div className="spinner large"></div>
              <p>Loading experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation
            className="provider-left-nav"
            orientation="vertical"
          />
          <div className="provider-main-content">
            <div className="error-state">
              <div className="error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="error-title">Failed to Load Experience</h3>
              <p className="error-description">{error}</p>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/provider/listings')}
              >
                Back to Listings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 5;

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Title and description' },
    { id: 2, title: 'Details', description: 'Destinations and activities' },
    { id: 3, title: 'What\'s Included', description: 'Inclusions and exclusions' },
    { id: 4, title: 'Images', description: 'Photos and poster image' },
    { id: 5, title: 'Location', description: 'Meeting point and dates' }
  ];

  const nextStep = () => {
    if (formStep < totalSteps) setFormStep(formStep + 1);
  };

  const prevStep = () => {
    if (formStep > 1) setFormStep(formStep - 1);
  };

  const StepIndicator = () => (
    <div className="step-indicator">
      {steps.map((stepItem) => (
        <div
          key={stepItem.id}
          className={`step-item ${formStep >= stepItem.id ? 'active' : ''} ${formStep === stepItem.id ? 'current' : ''}`}
        >
          <div className="step-number">{stepItem.id}</div>
          <div className="step-info">
            <div className="step-title">{stepItem.title}</div>
            <div className="step-description">{stepItem.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const Step1 = () => (
    <motion.div
      key="step1"
      className="form-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Basic Information</h2>
        <p>Tell us about your experience</p>
      </div>

      <div className="form-group">
        <label htmlFor="title">Experience Title *</label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Sunset Safari Adventure"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your experience in detail..."
          rows={6}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
    </motion.div>
  );

  const Step2 = () => {
    const [newDestination, setNewDestination] = useState('');
    const [newActivity, setNewActivity] = useState('');

    const addDestination = () => {
      if (newDestination.trim()) {
        handleArrayInputChange('destinations', newDestination.trim(), 'add');
        setNewDestination('');
      }
    };

    const addActivity = () => {
      if (newActivity.trim()) {
        handleArrayInputChange('activities', newActivity.trim(), 'add');
        setNewActivity('');
      }
    };

    return (
      <motion.div
        key="step2"
        className="form-step"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="step-header">
          <h2>Experience Details</h2>
          <p>Where will you go and what will you do?</p>
        </div>

        <div className="form-group">
          <label>Destinations *</label>
          <div className="todo-input">
            <input
              type="text"
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              placeholder="Add a destination (e.g., Maasai Mara National Reserve)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addDestination();
                }
              }}
            />
            <button
              type="button"
              onClick={addDestination}
              className="add-btn"
              disabled={!newDestination.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="todo-list">
            {formData.destinations.map((destination, index) => (
              <div key={index} className="todo-item">
                <div className="todo-checkbox">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="todo-text">{destination}</span>
                <button
                  type="button"
                  onClick={() => handleArrayInputChange('destinations', destination, 'remove')}
                  className="todo-remove"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {formData.destinations.length === 0 && (
              <div className="todo-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>No destinations added yet</span>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Activities *</label>
          <div className="todo-input">
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Add an activity (e.g., Game Drive)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addActivity();
                }
              }}
            />
            <button
              type="button"
              onClick={addActivity}
              className="add-btn"
              disabled={!newActivity.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="todo-list">
            {formData.activities.map((activity, index) => (
              <div key={index} className="todo-item">
                <div className="todo-checkbox">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="todo-text">{activity}</span>
                <button
                  type="button"
                  onClick={() => handleArrayInputChange('activities', activity, 'remove')}
                  className="todo-remove"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {formData.activities.length === 0 && (
              <div className="todo-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>No activities added yet</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const Step3 = () => {
    const [newInclusion, setNewInclusion] = useState('');
    const [newExclusion, setNewExclusion] = useState('');

    const addInclusion = () => {
      if (newInclusion.trim()) {
        handleArrayInputChange('inclusions', newInclusion.trim(), 'add');
        setNewInclusion('');
      }
    };

    const addExclusion = () => {
      if (newExclusion.trim()) {
        handleArrayInputChange('exclusions', newExclusion.trim(), 'add');
        setNewExclusion('');
      }
    };

    return (
      <motion.div
        key="step3"
        className="form-step"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="step-header">
          <h2>What&apos;s Included</h2>
          <p>What&apos;s included and excluded from your experience</p>
        </div>

        <div className="form-group">
          <label>Inclusions</label>
          <div className="todo-input">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              placeholder="Add what's included (e.g., Transport)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addInclusion();
                }
              }}
            />
            <button
              type="button"
              onClick={addInclusion}
              className="add-btn"
              disabled={!newInclusion.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="todo-list">
            {formData.inclusions.map((inclusion, index) => (
              <div key={index} className="todo-item">
                <div className="todo-checkbox">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="todo-text">{inclusion}</span>
                <button
                  type="button"
                  onClick={() => handleArrayInputChange('inclusions', inclusion, 'remove')}
                  className="todo-remove"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {formData.inclusions.length === 0 && (
              <div className="todo-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>No inclusions added yet</span>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Exclusions</label>
          <div className="todo-input">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              placeholder="Add what's excluded (e.g., Park Fees)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addExclusion();
                }
              }}
            />
            <button
              type="button"
              onClick={addExclusion}
              className="add-btn"
              disabled={!newExclusion.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="todo-list">
            {formData.exclusions.map((exclusion, index) => (
              <div key={index} className="todo-item">
                <div className="todo-checkbox">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="todo-text">{exclusion}</span>
                <button
                  type="button"
                  onClick={() => handleArrayInputChange('exclusions', exclusion, 'remove')}
                  className="todo-remove"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {formData.exclusions.length === 0 && (
              <div className="todo-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>No exclusions added yet</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const Step4 = () => (
    <motion.div
      key="step4"
      className="form-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Images</h2>
        <p>Add photos to showcase your experience</p>
      </div>

      <div className="form-group">
        <label htmlFor="poster_image">Poster Image *</label>
        <div className="image-upload-section">
          <div className="upload-area">
            <input
              type="text"
              id="poster_image"
              value={formData.poster_image_url}
              onChange={(e) => handleInputChange('poster_image_url', e.target.value)}
              placeholder="Enter image URL"
            />
          </div>
          
          {formData.poster_image_url && (
            <div className="image-preview-large">
              <img 
                src={formData.poster_image_url} 
                alt="Poster preview" 
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const Step5 = () => (
    <motion.div
      key="step5"
      className="form-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Location & Dates</h2>
        <p>Where and when will your experience take place?</p>
      </div>

      <div className="form-group">
        <label htmlFor="meeting_point_name">Meeting Point Name *</label>
        <input
          type="text"
          id="meeting_point_name"
          value={formData.meeting_point.name}
          onChange={(e) => handleNestedInputChange('meeting_point', 'name', e.target.value)}
          placeholder="e.g., Nairobi National Park Gate"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="meeting_point_address">Address *</label>
        <input
          type="text"
          id="meeting_point_address"
          value={formData.meeting_point.address}
          onChange={(e) => handleNestedInputChange('meeting_point', 'address', e.target.value)}
          placeholder="e.g., Langata Rd, Nairobi, Kenya"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="meeting_point_instructions">Meeting Instructions</label>
        <textarea
          id="meeting_point_instructions"
          value={formData.meeting_point.instructions}
          onChange={(e) => handleNestedInputChange('meeting_point', 'instructions', e.target.value)}
          placeholder="e.g., Please arrive 30 minutes early. Look for the jeep with our logo."
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_date">Start Date *</label>
          <input
            type="date"
            id="start_date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="end_date">End Date *</label>
          <input
            type="date"
            id="end_date"
            value={formData.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Coordinates (Optional)</label>
        <div className="form-row">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={formData.meeting_point.coordinates.latitude || ''}
            onChange={(e) => handleNestedInputChange('meeting_point', 'coordinates', {
              ...formData.meeting_point.coordinates,
              latitude: parseFloat(e.target.value) || null
            })}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={formData.meeting_point.coordinates.longitude || ''}
            onChange={(e) => handleNestedInputChange('meeting_point', 'coordinates', {
              ...formData.meeting_point.coordinates,
              longitude: parseFloat(e.target.value) || null
            })}
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep = () => {
    switch (formStep) {
      case 1: return <Step1 key="step1" />;
      case 2: return <Step2 key="step2" />;
      case 3: return <Step3 key="step3" />;
      case 4: return <Step4 key="step4" />;
      case 5: return <Step5 key="step5" />;
      default: return <Step1 key="step1" />;
    }
  };

  return (
    <div className="provider-main-page">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation
          className="provider-left-nav"
          orientation="vertical"
        />

        <motion.main 
          className="provider-main-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="content-wrapper">
            {/* Success/Error Messages */}
            {saveSuccess && (
              <motion.div
                className="success-message"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Experience updated successfully! Redirecting...</span>
              </motion.div>
            )}

            {saveError && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{saveError}</span>
              </motion.div>
            )}

            <div className="experience-form">
              <div className="form-header">
                <button 
                  className="btn btn-secondary"
                  onClick={() => router.push('/provider/listings')}
                >
                  ← Back to Listings
                </button>
                <h1>Edit Experience</h1>
              </div>

              <StepIndicator />

              <div className="form-content">
                <AnimatePresence mode="wait" key={formStep}>
                  {renderStep()}
                </AnimatePresence>
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={prevStep}
                  disabled={formStep === 1}
                >
                  Previous
                </button>
                
                {formStep < totalSteps ? (
                  <button 
                    className="btn btn-primary"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Update Experience'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
