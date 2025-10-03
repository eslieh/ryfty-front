"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { saveFormData, loadFormData, clearFormData, hasDraftData, getDraftInfo } from '@/utils/formPersistence';
import '@/styles/provider.css';

export default function CreateListingPage() {
  const [currentStep, setCurrentStep] = useState('splash'); // splash, experience, services
  const [formStep, setFormStep] = useState(1); // Step within the experience form
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  
  // Local input states for immediate UI updates
  const [localInputs, setLocalInputs] = useState({
    title: '',
    description: '',
    status: 'draft',
    meeting_point: {
      name: '',
      address: '',
      coordinates: {
        latitude: null,
        longitude: null
      },
      instructions: ''
    },
    start_date: '',
    end_date: ''
  });
  
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
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (!isAuthenticated || !isProvider()) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, isProvider, router]);

  // Check for draft data on component mount
  useEffect(() => {
    if (isAuthenticated && isProvider()) {
      const draftInfo = getDraftInfo();
      if (draftInfo.hasDraft) {
        setShowDraftModal(true);
        setLastSaved(draftInfo.lastSaved);
      }
    }
  }, [isAuthenticated, isProvider]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      if (currentStep === 'experience') {
        // Clear any pending debounced updates first
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // Merge local inputs with form data for saving (localInputs has the most recent values)
        const dataToSave = {
          ...formData,
          ...localInputs
        };
        saveFormData(dataToSave, formStep);
        setLastSaved(new Date().toLocaleString());
      }
    }, 10000); // 10 seconds
  }, [localInputs, formStep, currentStep, formData]);

  // Manual save function for Next button clicks
  const saveCurrentStep = useCallback(() => {
    if (currentStep === 'experience') {
      // Clear any pending debounced updates first
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Merge local inputs with form data for saving (localInputs has the most recent values)
      const dataToSave = {
        ...formData,
        ...localInputs
      };
      saveFormData(dataToSave, formStep);
      setLastSaved(new Date().toLocaleString());
    }
  }, [localInputs, formStep, currentStep, formData]);

  // Schedule auto-save when form data changes
  useEffect(() => {
    if (currentStep === 'experience') {
      scheduleAutoSave();
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, scheduleAutoSave, currentStep]);

  // Debounced form data updates to prevent shuttering
  const debouncedUpdateFormData = useCallback((field, value) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }, 300); // 300ms delay to prevent shuttering
  }, []);

  const debouncedUpdateNestedFormData = useCallback((parent, field, value) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value
        }
      }));
    }, 300); // 300ms delay to prevent shuttering
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);


  // Immediate local input handlers
  const handleInputChange = useCallback((field, value) => {
    // Update local state immediately for UI responsiveness
    setLocalInputs(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Debounce the form data update to prevent shuttering
    debouncedUpdateFormData(field, value);
  }, [debouncedUpdateFormData]);

  const handleNestedInputChange = useCallback((parent, field, value) => {
    // Update local state immediately for UI responsiveness
    setLocalInputs(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
    
    // Debounce the form data update to prevent shuttering
    debouncedUpdateNestedFormData(parent, field, value);
  }, [debouncedUpdateNestedFormData]);

  const handleArrayInputChange = useCallback((field, value, action = 'add') => {
    setFormData(prev => ({
      ...prev,
      [field]: action === 'add' 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  }, []);

  // Draft restoration functions
  const restoreDraft = () => {
    const draftData = loadFormData();
    if (draftData) {
      setFormData(draftData.formData);
      setLocalInputs({
        title: draftData.formData.title || '',
        description: draftData.formData.description || '',
        status: draftData.formData.status || 'draft',
        meeting_point: draftData.formData.meeting_point || {
          name: '',
          address: '',
          coordinates: { latitude: null, longitude: null },
          instructions: ''
        },
        start_date: draftData.formData.start_date || '',
        end_date: draftData.formData.end_date || ''
      });
      setFormStep(draftData.currentStep);
      setCurrentStep('experience');
      setShowDraftModal(false);
    }
  };

  const discardDraft = () => {
    clearFormData();
    setShowDraftModal(false);
    setLastSaved(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Here you would make the API call to create the experience
      console.log('Submitting experience data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear draft data after successful submission
      clearFormData();
      setLastSaved(null);
      
      // Redirect back to listings
      router.push('/provider/listings');
    } catch (error) {
      console.error('Error creating experience:', error);
    } finally {
      setLoading(false);
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

  // Draft Modal Component
  const DraftModal = () => {
    if (!showDraftModal) return null;

    const draftInfo = getDraftInfo();

    return (
      <motion.div
        className="draft-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowDraftModal(false)}
      >
        <motion.div
          className="draft-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="draft-modal-header">
            <h3>Continue Your Draft?</h3>
            <button 
              className="draft-modal-close"
              onClick={() => setShowDraftModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="draft-modal-body">
            <p>We found a saved draft of your experience:</p>
            <div className="draft-info">
              <strong>{draftInfo.title}</strong>
              <span className="draft-date">Last saved: {draftInfo.lastSaved}</span>
              <span className="draft-step">Step {draftInfo.currentStep} of 5</span>
            </div>
          </div>
          
          <div className="draft-modal-actions">
            <button 
              className="btn btn-secondary"
              onClick={discardDraft}
            >
              Start Fresh
            </button>
            <button 
              className="btn btn-primary"
              onClick={restoreDraft}
            >
              Continue Draft
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const SplashScreen = () => (
    <motion.div
      className="create-splash"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="splash-content">
        <div className="splash-header">
          <h1 className="splash-title">Create New Listing</h1>
          <p className="splash-subtitle">Choose what type of listing you want to create</p>
        </div>

        <div className="listing-options">
          <motion.div
            className="listing-option"
            onClick={() => setCurrentStep('experience')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="option-title">Experience</h3>
            <p className="option-description">
              Create guided tours, activities, and immersive experiences for travelers
            </p>
            <div className="option-features">
              <span className="feature-tag">Tours</span>
              <span className="feature-tag">Activities</span>
              <span className="feature-tag">Adventures</span>
            </div>
          </motion.div>

          <motion.div
            className="listing-option coming-soon"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="option-title">Services</h3>
            <p className="option-description">
              Offer transportation, photography, catering, and other support services
            </p>
            <div className="coming-soon-badge">Coming Soon</div>
            <div className="option-features">
              <span className="feature-tag">Transport</span>
              <span className="feature-tag">Photography</span>
              <span className="feature-tag">Catering</span>
            </div>
          </motion.div>
        </div>

        <div className="splash-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/provider/listings')}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );

  const ExperienceForm = () => {
    const totalSteps = 5;

    const steps = [
      { id: 1, title: 'Basic Info', description: 'Title and description' },
      { id: 2, title: 'Details', description: 'Destinations and activities' },
      { id: 3, title: 'What\'s Included', description: 'Inclusions and exclusions' },
      { id: 4, title: 'Images', description: 'Photos and poster image' },
      { id: 5, title: 'Location', description: 'Meeting point and dates' }
    ];

    const nextStep = () => {
      // Save current step data before moving to next step
      saveCurrentStep();
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
            value={localInputs.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Sunset Safari Adventure"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={localInputs.description}
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
            value={localInputs.status}
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

    const Step4 = () => {
      const [uploadingPoster, setUploadingPoster] = useState(false);
      const [uploadingImages, setUploadingImages] = useState(false);
      const [selectedImageIndex, setSelectedImageIndex] = useState(null);
      const [showImageViewer, setShowImageViewer] = useState(false);
      const [posterPreview, setPosterPreview] = useState(null);
      const [additionalPreviews, setAdditionalPreviews] = useState([]);
      const [uploadProgress, setUploadProgress] = useState({});

      // Cleanup object URLs when component unmounts or previews change
      useEffect(() => {
        return () => {
          if (posterPreview?.url && posterPreview.url.startsWith('blob:')) {
            URL.revokeObjectURL(posterPreview.url);
          }
          additionalPreviews.forEach(preview => {
            if (preview.url && preview.url.startsWith('blob:')) {
              URL.revokeObjectURL(preview.url);
            }
          });
        };
      }, [posterPreview, additionalPreviews]);

      const uploadToCloudinary = async (file) => {
        // Check if this file was already uploaded (prevent duplicates)
        const fileHash = await getFileHash(file);
        const existingImage = formData.images.find(img => img.fileHash === fileHash);
        if (existingImage) {
          console.log('Image already uploaded, skipping duplicate');
          return existingImage.url;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ryfty_images');
        
        try {
          const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: uploadFormData,
          });
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          const data = await response.json();
          return { url: data.secure_url, fileHash };
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          throw error;
        }
      };

      // Simple file hash function to detect duplicates
      const getFileHash = async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            // Simple hash based on file name, size, and last modified
            const hash = `${file.name}_${file.size}_${file.lastModified}`;
            resolve(btoa(hash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16));
          };
          reader.readAsDataURL(file);
        });
      };

      const handlePosterImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file');
          return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB');
          return;
        }

        // Create immediate preview
        const previewUrl = URL.createObjectURL(file);
        setPosterPreview({
          url: previewUrl,
          file: file,
          uploading: true
        });

        setUploadingPoster(true);
        try {
          const uploadResult = await uploadToCloudinary(file);
          const imageUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
          handleInputChange('poster_image_url', imageUrl);
          setPosterPreview({
            url: imageUrl,
            file: file,
            uploading: false
          });
        } catch (error) {
          alert('Failed to upload image. Please try again.');
          setPosterPreview(null);
        } finally {
          setUploadingPoster(false);
        }
      };

      const handleAdditionalImagesUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Create immediate previews for all files
        const newPreviews = files.map((file, index) => {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`${file.name} is not a valid image file`);
          }

          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`${file.name} is too large (max 5MB)`);
          }

          const previewUrl = URL.createObjectURL(file);
          const previewId = `preview_${Date.now()}_${index}`;
          
          return {
            id: previewId,
            url: previewUrl,
            file: file,
            uploading: true,
            alt: `Experience image ${formData.images.length + index + 1}`
          };
        });

        // Add previews to state
        setAdditionalPreviews(prev => [...prev, ...newPreviews]);
        setUploadingImages(true);

        try {
          // Upload files one by one to show individual progress
          for (let i = 0; i < newPreviews.length; i++) {
            const preview = newPreviews[i];
            try {
              const uploadResult = await uploadToCloudinary(preview.file);
              const imageUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
              const fileHash = typeof uploadResult === 'string' ? null : uploadResult.fileHash;
              
              // Update preview to show completed upload
              setAdditionalPreviews(prev => 
                prev.map(p => 
                  p.id === preview.id 
                    ? { ...p, url: imageUrl, uploading: false }
                    : p
                )
              );

              // Add to form data
              const newImage = {
                url: imageUrl,
                alt: preview.alt,
                publicId: preview.file.name.split('.')[0],
                fileHash: fileHash
              };
              handleArrayInputChange('images', newImage, 'add');

            } catch (error) {
              // Remove failed preview
              setAdditionalPreviews(prev => 
                prev.filter(p => p.id !== preview.id)
              );
              console.error(`Failed to upload ${preview.file.name}:`, error);
            }
          }
        } catch (error) {
          alert(`Failed to upload images: ${error.message}`);
        } finally {
          setUploadingImages(false);
        }
      };

      const openImageViewer = (index) => {
        setSelectedImageIndex(index);
        setShowImageViewer(true);
      };

      const closeImageViewer = () => {
        setShowImageViewer(false);
        setSelectedImageIndex(null);
      };

      const nextImage = () => {
        if (selectedImageIndex < formData.images.length - 1) {
          setSelectedImageIndex(selectedImageIndex + 1);
        }
      };

      const prevImage = () => {
        if (selectedImageIndex > 0) {
          setSelectedImageIndex(selectedImageIndex - 1);
        }
      };

      const ImageViewer = () => {
        if (!showImageViewer || selectedImageIndex === null) return null;

        const currentImage = formData.images[selectedImageIndex];

        return (
          <motion.div
            className="image-viewer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageViewer}
          >
            <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
              <button className="image-viewer-close" onClick={closeImageViewer}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {formData.images.length > 1 && (
                <>
                  <button 
                    className="image-viewer-nav image-viewer-prev" 
                    onClick={prevImage}
                    disabled={selectedImageIndex === 0}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  
                  <button 
                    className="image-viewer-nav image-viewer-next" 
                    onClick={nextImage}
                    disabled={selectedImageIndex === formData.images.length - 1}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </>
              )}

              <div className="image-viewer-main">
                <img src={currentImage.url} alt={currentImage.alt} />
                <div className="image-viewer-info">
                  <span className="image-counter">
                    {selectedImageIndex + 1} of {formData.images.length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      };

      return (
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
                  type="file"
                  id="poster_image"
                  accept="image/*"
                  onChange={handlePosterImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="poster_image" className="upload-button">
                  {uploadingPoster ? (
                    <div className="upload-loading">
                      <div className="spinner small"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="upload-content">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Upload Poster Image</span>
                      <small>Click to select or drag and drop</small>
            </div>
          )}
                </label>
              </div>
              
              {(posterPreview || formData.poster_image_url) && (
                <div className="image-preview-large">
                  <img 
                    src={posterPreview?.url || formData.poster_image_url} 
                    alt="Poster preview" 
                  />
                  {posterPreview?.uploading && (
                    <div className="upload-progress-overlay">
                      <div className="upload-progress-content">
                        <div className="spinner small"></div>
                        <span>Uploading...</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('poster_image_url', '');
                      setPosterPreview(null);
                    }}
                    className="remove-image-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
        </div>

        <div className="form-group">
          <label>Additional Images</label>
            <div className="image-upload-section">
              <div className="upload-area">
            <input
                  type="file"
                  id="additional_images"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="additional_images" className="upload-button">
                  {uploadingImages ? (
                    <div className="upload-loading">
                      <div className="spinner small"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="upload-content">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Upload Additional Images</span>
                      <small>Select multiple images (max 5MB each)</small>
                    </div>
                  )}
                </label>
              </div>
              
              {(formData.images.length > 0 || additionalPreviews.length > 0) && (
                <div className="image-grid-enhanced">
                  {/* Show uploaded images */}
              {formData.images.map((image, index) => (
                    <div key={`uploaded_${index}`} className="image-item-enhanced">
                      <img 
                        src={image.url} 
                        alt={image.alt} 
                        onClick={() => openImageViewer(index)}
                      />
                  <button
                    type="button"
                    onClick={() => handleArrayInputChange('images', image, 'remove')}
                        className="remove-image-btn"
                  >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                  </button>
                      <div className="image-overlay">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                </div>
              ))}
                  
                  {/* Show preview images */}
                  {additionalPreviews.map((preview) => (
                    <div key={preview.id} className="image-item-enhanced">
                      <img 
                        src={preview.url} 
                        alt={preview.alt}
                      />
                      {preview.uploading && (
                        <div className="upload-progress-overlay">
                          <div className="upload-progress-content">
                            <div className="spinner small"></div>
                            <span>Uploading...</span>
            </div>
          </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAdditionalPreviews(prev => 
                            prev.filter(p => p.id !== preview.id)
                          );
                        }}
                        className="remove-image-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {!preview.uploading && (
                        <div className="image-overlay">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ImageViewer />
      </motion.div>
    );
    };

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
            value={localInputs.meeting_point.name}
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
            value={localInputs.meeting_point.address}
            onChange={(e) => handleNestedInputChange('meeting_point', 'address', e.target.value)}
            placeholder="e.g., Langata Rd, Nairobi, Kenya"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="meeting_point_instructions">Meeting Instructions</label>
          <textarea
            id="meeting_point_instructions"
            value={localInputs.meeting_point.instructions}
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
              value={localInputs.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="end_date">End Date *</label>
            <input
              type="date"
              id="end_date"
              value={localInputs.end_date}
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
              value={localInputs.meeting_point.coordinates.latitude || ''}
              onChange={(e) => handleNestedInputChange('meeting_point', 'coordinates', {
                ...formData.meeting_point.coordinates,
                latitude: parseFloat(e.target.value) || null
              })}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={localInputs.meeting_point.coordinates.longitude || ''}
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
      <div className="experience-form">
        <div className="form-header">
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentStep('splash')}
          >
            ← Back to Options
          </button>
          <h1>Create Experience</h1>
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
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Experience'}
            </button>
          )}
        </div>
      </div>
    );
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
            {/* Auto-save indicator */}
            {currentStep === 'experience' && lastSaved && (
              <div className="auto-save-indicator">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Auto-saved {lastSaved}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {currentStep === 'splash' && <SplashScreen key="splash" />}
              {currentStep === 'experience' && <ExperienceForm key="experience" />}
            </AnimatePresence>
          </div>
        </motion.main>
      </div>

      {/* Draft Modal */}
      <DraftModal />
    </div>
  );
}
