"use client";

import { useState, useRef } from 'react';

const CreateExperienceForm = ({ 
  onSubmit, 
  onCancel, 
  formLoading, 
  formError, 
  formSuccess,
  currentStep = 1,
  onStepChange
}) => {
  // Individual state for each input to prevent re-renders
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meetingPointName, setMeetingPointName] = useState('');
  const [meetingPointAddress, setMeetingPointAddress] = useState('');
  const [meetingPointInstructions, setMeetingPointInstructions] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Arrays for destinations, activities, inclusions, exclusions
  const [destinations, setDestinations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);

  // Temporary input states
  const [newDestination, setNewDestination] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  // Refs to maintain focus
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const statusRef = useRef(null);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const meetingPointNameRef = useRef(null);
  const meetingPointAddressRef = useRef(null);
  const meetingPointInstructionsRef = useRef(null);
  const latitudeRef = useRef(null);
  const longitudeRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      title,
      description,
      status,
      start_date: startDate,
      end_date: endDate,
      destinations,
      activities,
      inclusions,
      exclusions,
      meeting_point: {
        name: meetingPointName,
        address: meetingPointAddress,
        instructions: meetingPointInstructions,
        coordinates: {
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null
        }
      }
    };

    onSubmit(formData);
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setStatus('draft');
    setStartDate('');
    setEndDate('');
    setMeetingPointName('');
    setMeetingPointAddress('');
    setMeetingPointInstructions('');
    setLatitude('');
    setLongitude('');
    setDestinations([]);
    setActivities([]);
    setInclusions([]);
    setExclusions([]);
    setNewDestination('');
    setNewActivity('');
    setNewInclusion('');
    setNewExclusion('');
    onCancel();
  };

  // Array management functions
  const addDestination = () => {
    if (newDestination.trim()) {
      setDestinations(prev => [...prev, newDestination.trim()]);
      setNewDestination('');
    }
  };

  const removeDestination = (index) => {
    setDestinations(prev => prev.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setActivities(prev => [...prev, newActivity.trim()]);
      setNewActivity('');
    }
  };

  const removeActivity = (index) => {
    setActivities(prev => prev.filter((_, i) => i !== index));
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions(prev => [...prev, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const removeInclusion = (index) => {
    setInclusions(prev => prev.filter((_, i) => i !== index));
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions(prev => [...prev, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const removeExclusion = (index) => {
    setExclusions(prev => prev.filter((_, i) => i !== index));
  };

  // Step 1: Basic Information
  const Step1 = () => (
    <div className="form-step">
      <div className="form-group">
        <label htmlFor="title">Experience Title *</label>
        <input
          ref={titleRef}
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Sunset Safari Adventure"
          required
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          ref={descriptionRef}
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your experience in detail..."
          rows={6}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          ref={statusRef}
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
    </div>
  );

  // Step 2: Destinations and Activities
  const Step2 = () => (
    <div className="form-step">
      <div className="form-group">
        <label>Destinations *</label>
        <div className="array-input-group">
          <div className="input-with-button">
            <input
              type="text"
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              placeholder="e.g., Maasai Mara National Reserve"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDestination())}
              autoComplete="off"
            />
            <button type="button" onClick={addDestination} className="add-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {destinations.length > 0 && (
            <div className="array-list">
              {destinations.map((destination, index) => (
                <div key={index} className="array-item">
                  <span>{destination}</span>
                  <button type="button" onClick={() => removeDestination(index)} className="remove-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Activities *</label>
        <div className="array-input-group">
          <div className="input-with-button">
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="e.g., Game drive, Photography, Cultural visit"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
              autoComplete="off"
            />
            <button type="button" onClick={addActivity} className="add-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {activities.length > 0 && (
            <div className="array-list">
              {activities.map((activity, index) => (
                <div key={index} className="array-item">
                  <span>{activity}</span>
                  <button type="button" onClick={() => removeActivity(index)} className="remove-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Inclusions and Exclusions
  const Step3 = () => (
    <div className="form-step">
      <div className="form-group">
        <label>What's Included</label>
        <div className="array-input-group">
          <div className="input-with-button">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              placeholder="e.g., Transportation, Guide, Lunch"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
              autoComplete="off"
            />
            <button type="button" onClick={addInclusion} className="add-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {inclusions.length > 0 && (
            <div className="array-list">
              {inclusions.map((inclusion, index) => (
                <div key={index} className="array-item">
                  <span>{inclusion}</span>
                  <button type="button" onClick={() => removeInclusion(index)} className="remove-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>What's Not Included</label>
        <div className="array-input-group">
          <div className="input-with-button">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              placeholder="e.g., Personal expenses, Tips, Insurance"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
              autoComplete="off"
            />
            <button type="button" onClick={addExclusion} className="add-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {exclusions.length > 0 && (
            <div className="array-list">
              {exclusions.map((exclusion, index) => (
                <div key={index} className="array-item">
                  <span>{exclusion}</span>
                  <button type="button" onClick={() => removeExclusion(index)} className="remove-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 4: Dates and Meeting Point
  const Step4 = () => (
    <div className="form-step">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_date">Start Date *</label>
          <input
            ref={startDateRef}
            type="date"
            id="start_date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="end_date">End Date *</label>
          <input
            ref={endDateRef}
            type="date"
            id="end_date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="meeting_point_name">Meeting Point Name *</label>
        <input
          ref={meetingPointNameRef}
          type="text"
          id="meeting_point_name"
          value={meetingPointName}
          onChange={(e) => setMeetingPointName(e.target.value)}
          placeholder="e.g., Nairobi City Center"
          required
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="meeting_point_address">Meeting Point Address *</label>
        <input
          ref={meetingPointAddressRef}
          type="text"
          id="meeting_point_address"
          value={meetingPointAddress}
          onChange={(e) => setMeetingPointAddress(e.target.value)}
          placeholder="e.g., Kenyatta Avenue, Nairobi"
          required
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="meeting_point_instructions">Meeting Instructions</label>
        <textarea
          ref={meetingPointInstructionsRef}
          id="meeting_point_instructions"
          value={meetingPointInstructions}
          onChange={(e) => setMeetingPointInstructions(e.target.value)}
          placeholder="Special instructions for meeting..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Coordinates (Optional)</label>
        <div className="form-row">
          <input
            ref={latitudeRef}
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitude"
            autoComplete="off"
          />
          <input
            ref={longitudeRef}
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitude"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <Step1 />;
      case 2: return <Step2 />;
      case 3: return <Step3 />;
      case 4: return <Step4 />;
      default: return <Step1 />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-experience-form">
      {/* Error Message */}
      {formError && (
        <div className="form-message form-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{formError}</span>
        </div>
      )}

      {/* Success Message */}
      {formSuccess && (
        <div className="form-message form-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Step Content */}
      {renderCurrentStep()}

      {/* Navigation */}
      <div className="form-actions">
        <div className="step-navigation">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={formLoading}
          >
            Cancel
          </button>
          
          <div className="step-buttons">
            {currentStep > 1 && (
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => onStepChange(currentStep - 1)}
                disabled={formLoading}
              >
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => onStepChange(currentStep + 1)}
                disabled={formLoading}
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Creating...
                  </>
                ) : (
                  'Create Experience'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateExperienceForm;