"use client";

import { useState, useRef, useEffect } from 'react';

const SlotForm = ({ 
  editingSlot, 
  onSubmit, 
  onCancel, 
  formLoading, 
  formError, 
  formSuccess,
  resetForm = false
}) => {
  // Individual state for each input
  const [slotName, setSlotName] = useState('');
  const [slotCapacity, setSlotCapacity] = useState('');
  const [slotPrice, setSlotPrice] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [slotTimezone, setSlotTimezone] = useState('Africa/Nairobi');
  const [validationError, setValidationError] = useState('');

  // Refs to maintain focus
  const nameRef = useRef(null);
  const capacityRef = useRef(null);
  const priceRef = useRef(null);
  const dateRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const timezoneRef = useRef(null);

  // Initialize form when editing
  useEffect(() => {
    if (editingSlot) {
      setSlotName(editingSlot.name || '');
      setSlotCapacity(editingSlot.capacity?.toString() || '');
      setSlotPrice(editingSlot.price?.toString() || '');
      setSlotDate(editingSlot.date || '');
      setSlotStartTime(editingSlot.start_time || '');
      setSlotEndTime(editingSlot.end_time || '');
      setSlotTimezone(editingSlot.timezone || 'Africa/Nairobi');
    }
    // Don't reset form when editingSlot becomes null - let parent handle that
  }, [editingSlot]);

  // Handle explicit form reset from parent
  useEffect(() => {
    if (resetForm) {
      setSlotName('');
      setSlotCapacity('');
      setSlotPrice('');
      setSlotDate('');
      setSlotStartTime('');
      setSlotEndTime('');
      setSlotTimezone('Africa/Nairobi');
      setValidationError('');
    }
  }, [resetForm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear any previous validation errors
    setValidationError('');
    
    // Validate that end time is after start time
    if (slotStartTime && slotEndTime && slotStartTime >= slotEndTime) {
      setValidationError('End time must be after start time');
      return;
    }
    
    const formData = {
      name: slotName,
      capacity: parseInt(slotCapacity),
      price: parseFloat(slotPrice),
      date: slotDate,
      start_time: slotStartTime,
      end_time: slotEndTime,
      timezone: slotTimezone
    };

    onSubmit(formData);
  };

  const handleCancel = () => {
    // Reset form
    setSlotName('');
    setSlotCapacity('');
    setSlotPrice('');
    setSlotDate('');
    setSlotStartTime('');
    setSlotEndTime('');
    setSlotTimezone('Africa/Nairobi');
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="slot-form">
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

      {/* Validation Error Message */}
      {validationError && (
        <div className="form-message form-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{validationError}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="slot-name">Slot Name *</label>
        <input
          ref={nameRef}
          type="text"
          id="slot-name"
          value={slotName}
          onChange={(e) => setSlotName(e.target.value)}
          placeholder="e.g., Morning Session, VIP Experience"
          required
          autoComplete="off"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="slot-capacity">Capacity *</label>
          <input
            ref={capacityRef}
            type="number"
            id="slot-capacity"
            value={slotCapacity}
            onChange={(e) => setSlotCapacity(e.target.value)}
            placeholder="20"
            min="1"
            required
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="slot-price">Price (KES) *</label>
          <input
            ref={priceRef}
            type="number"
            id="slot-price"
            value={slotPrice}
            onChange={(e) => setSlotPrice(e.target.value)}
            placeholder="1000"
            min="0"
            step="0.01"
            required
            autoComplete="off"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="slot-date">Date *</label>
        <input
          ref={dateRef}
          type="date"
          id="slot-date"
          value={slotDate}
          onChange={(e) => setSlotDate(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="slot-start-time">Start Time *</label>
          <input
            ref={startTimeRef}
            type="time"
            id="slot-start-time"
            value={slotStartTime}
            onChange={(e) => {
              setSlotStartTime(e.target.value);
              setValidationError(''); // Clear validation error when user changes time
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="slot-end-time">End Time *</label>
          <input
            ref={endTimeRef}
            type="time"
            id="slot-end-time"
            value={slotEndTime}
            onChange={(e) => {
              setSlotEndTime(e.target.value);
              setValidationError(''); // Clear validation error when user changes time
            }}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="slot-timezone">Timezone</label>
        <select
          ref={timezoneRef}
          id="slot-timezone"
          value={slotTimezone}
          onChange={(e) => setSlotTimezone(e.target.value)}
        >
          <option value="Africa/Nairobi">Africa/Nairobi</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={handleCancel} 
          disabled={formLoading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={formLoading}
        >
          {formLoading ? (
            <>
              <div className="loading-spinner small"></div>
              {editingSlot ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            editingSlot ? 'Update Slot' : 'Create Slot'
          )}
        </button>
      </div>
    </form>
  );
};

export default SlotForm;
