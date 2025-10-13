"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import SlotForm from '@/components/SlotForm';
import { fetchProviderExperience, fetchExperienceSlots, createSlot, updateSlot, deleteSlot } from '@/utils/api';
import '@/styles/provider.css';
import '@/styles/manage-experience.css';

export default function ManageExperiencePage() {
  const [experience, setExperience] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotViewMode, setSlotViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [currentListMonth, setCurrentListMonth] = useState(new Date());
  
  // Form handling state
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [shouldResetForm, setShouldResetForm] = useState(false);
  
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();
  const params = useParams();

  // Redirect if not authenticated or not a provider
 

  // Fetch experience data
  useEffect(() => {
    const fetchExperienceData = async () => {
      if (!params?.id || !isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchProviderExperience(params.id);
        
        if (response && response.experience) {
          setExperience(response.experience);
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

  // Fetch slots data for a specific month
  const fetchSlotsForMonth = async (month) => {
    if (!params?.id || !isAuthenticated || !isProvider()) return;
    
    try {
      setSlotsLoading(true);
      
      // Get month start and end dates
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Format dates as YYYY-MM-DD using local timezone
      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      const response = await fetchExperienceSlots(params.id, 1, {
        start_date: startDateStr,
        end_date: endDateStr,
        sort: 'asc'
      }, 100);
      
      if (response && response.slots) {
        setSlots(response.slots);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Fetch slots for current month on initial load
  useEffect(() => {
    fetchSlotsForMonth(currentListMonth);
  }, [params?.id, isAuthenticated, isProvider]);

  // Fetch slots when month changes in calendar view
  useEffect(() => {
    if (slotViewMode === 'calendar') {
      fetchSlotsForMonth(currentMonth);
    }
  }, [currentMonth, slotViewMode]);

  // Fetch slots when month changes in list view
  useEffect(() => {
    if (slotViewMode === 'list') {
      fetchSlotsForMonth(currentListMonth);
    }
  }, [currentListMonth, slotViewMode]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSlotsForDate = (dateStr) => {
    return slots.filter(slot => slot.date === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const navigateListMonth = (direction) => {
    setCurrentListMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const resetSlotForm = () => {
    setEditingSlot(null);
    setShowSlotForm(false);
    setFormError(null);
    setFormSuccess(null);
    setFormLoading(false);
    setShouldResetForm(true);
    // Reset the flag after a brief moment
    setTimeout(() => setShouldResetForm(false), 100);
  };

  const handleSlotSubmit = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    
    try {
      if (editingSlot) {
        await updateSlot(editingSlot.id, formData);
        setFormSuccess('Slot updated successfully!');
      } else {
        await createSlot(params.id, formData);
        setFormSuccess('Slot created successfully!');
      }
      
      // Refresh slots data for current month
      const currentMonthToRefresh = slotViewMode === 'calendar' ? currentMonth : currentListMonth;
      await fetchSlotsForMonth(currentMonthToRefresh);
      
      // Close modal immediately on success
      resetSlotForm();
    } catch (err) {
      console.error('Error saving slot:', err);
      setFormError(err.message || `Failed to ${editingSlot ? 'update' : 'create'} slot. Please try again.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSlotCancel = () => {
    resetSlotForm();
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setShowSlotForm(true);
  };

  const handleDeleteSlot = async (slotId) => {
    setShowDeleteConfirm(slotId);
  };

  const confirmDeleteSlot = async () => {
    if (!showDeleteConfirm) return;
    
    setDeleteLoading(true);
    setFormError(null);
    setFormSuccess(null);
    
    try {
      await deleteSlot(showDeleteConfirm);
      
      // Refresh slots data for current month
      const currentMonthToRefresh = slotViewMode === 'calendar' ? currentMonth : currentListMonth;
      await fetchSlotsForMonth(currentMonthToRefresh);
      
      setFormSuccess('Slot deleted successfully!');
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting slot:', err);
      setFormError(err.message || 'Failed to delete slot. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteSlot = () => {
    setShowDeleteConfirm(null);
    setFormError(null);
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

  if (!experience) {
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
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="error-title">Experience Not Found</h3>
              <p className="error-description">The experience you're looking for doesn't exist or you don't have permission to view it.</p>
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'details', label: 'Details', icon: '📍' },
    { id: 'inclusions', label: 'What\'s Included', icon: '✅' },
    { id: 'images', label: 'Images', icon: '📸' },
    { id: 'location', label: 'Location', icon: '🗺️' },
    { id: 'slots', label: 'Slots', icon: '⏰' }
  ];

  const OverviewTab = () => (
    <motion.div
      className="tab-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="experience-overview">
        {/* Hero Section */}
        <div className="overview-hero">
          <div className="hero-poster">
            <img 
              src={experience.poster_image_url || '/images/placeholder.jpg'} 
              alt={experience.title} 
              className="hero-image" 
            />
            <div className="hero-overlay">
              <div className={`status-badge status-${experience.status}`}>
                <div className="status-dot"></div>
                <span className="status-text">{experience.status.charAt(0).toUpperCase() + experience.status.slice(1)}</span>
              </div>
            </div>
          </div>
          
          <div className="hero-content">
            <div className="hero-header">
              <h1 className="hero-title">{experience.title}</h1>
              <div className="hero-meta">
                <div className="meta-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{formatDate(experience.start_date)} - {formatDate(experience.end_date)}</span>
                </div>
                <div className="meta-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{experience.meeting_point?.name || 'Meeting point not set'}</span>
                </div>
              </div>
            </div>
            
            <div className="hero-description">
              <p>{experience.description}</p>
            </div>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{experience.destinations?.length || 0}</span>
                  <span className="stat-label">Destinations</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{experience.activities?.length || 0}</span>
                  <span className="stat-label">Activities</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{experience.inclusions?.length || 0}</span>
                  <span className="stat-label">Inclusions</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{experience.exclusions?.length || 0}</span>
                  <span className="stat-label">Exclusions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experience Details Cards */}
        <div className="overview-cards">
          <div className="detail-card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">Experience Details</h3>
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">Created:</span>
                <span className="detail-value">{formatDateTime(experience.created_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatDateTime(experience.updated_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Experience ID:</span>
                <span className="detail-value experience-id">{experience.id}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">Schedule</h3>
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{formatDate(experience.start_date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">End Date:</span>
                <span className="detail-value">{formatDate(experience.end_date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">
                  {experience.start_date && experience.end_date 
                    ? `${Math.ceil((new Date(experience.end_date) - new Date(experience.start_date)) / (1000 * 60 * 60 * 24))} days`
                    : 'Not set'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">Meeting Point</h3>
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{experience.meeting_point?.name || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{experience.meeting_point?.address || 'Not set'}</span>
              </div>
              {experience.meeting_point?.coordinates && (
                <div className="detail-row">
                  <span className="detail-label">Coordinates:</span>
                  <span className="detail-value">
                    {experience.meeting_point.coordinates.latitude}, {experience.meeting_point.coordinates.longitude}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const DetailsTab = () => (
    <motion.div
      className="tab-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="details-section">
        <h3 className="section-title">Destinations</h3>
        <div className="list-container">
          {experience.destinations && experience.destinations.length > 0 ? (
            <ul className="detail-list">
              {experience.destinations.map((destination, index) => (
                <li key={index} className="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {destination}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No destinations specified</p>
          )}
        </div>

        <h3 className="section-title">Activities</h3>
        <div className="list-container">
          {experience.activities && experience.activities.length > 0 ? (
            <ul className="detail-list">
              {experience.activities.map((activity, index) => (
                <li key={index} className="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {activity}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No activities specified</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const InclusionsTab = () => (
    <motion.div
      className="tab-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="inclusions-section">
        <div className="inclusion-group">
          <h3 className="section-title inclusion-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            What's Included
          </h3>
          <div className="list-container">
            {experience.inclusions && experience.inclusions.length > 0 ? (
              <ul className="detail-list inclusion-list">
                {experience.inclusions.map((inclusion, index) => (
                  <li key={index} className="detail-item inclusion-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {inclusion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">No inclusions specified</p>
            )}
          </div>
        </div>

        <div className="exclusion-group">
          <h3 className="section-title exclusion-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            What's Not Included
          </h3>
          <div className="list-container">
            {experience.exclusions && experience.exclusions.length > 0 ? (
              <ul className="detail-list exclusion-list">
                {experience.exclusions.map((exclusion, index) => (
                  <li key={index} className="detail-item exclusion-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {exclusion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">No exclusions specified</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ImagesTab = () => (
    <motion.div
      className="tab-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="images-section">
        <h3 className="section-title">Poster Image</h3>
        {experience.poster_image_url ? (
          <div className="image-container">
            <img 
              src={experience.poster_image_url} 
              alt={experience.title} 
              className="experience-image-large" 
            />
          </div>
        ) : (
          <p className="no-data">No poster image uploaded</p>
        )}

        <h3 className="section-title">Additional Images</h3>
        {experience.images && experience.images.length > 0 ? (
          <div className="images-grid">
            {experience.images.map((image, index) => (
              <div key={index} className="image-item">
                <img 
                  src={image.url || image} 
                  alt={`${experience.title} - Image ${index + 1}`} 
                  className="experience-image" 
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No additional images uploaded</p>
        )}
      </div>
    </motion.div>
  );

  const LocationTab = () => (
    <motion.div
      className="tab-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="location-section">
        <h3 className="section-title">Meeting Point</h3>
        <div className="location-info">
          <div className="location-item">
            <span className="location-label">Name:</span>
            <span className="location-value">{experience.meeting_point?.name || 'Not specified'}</span>
          </div>
          <div className="location-item">
            <span className="location-label">Address:</span>
            <span className="location-value">{experience.meeting_point?.address || 'Not specified'}</span>
          </div>
          <div className="location-item">
            <span className="location-label">Instructions:</span>
            <span className="location-value">{experience.meeting_point?.instructions || 'No instructions provided'}</span>
          </div>
          {experience.meeting_point?.coordinates && (
            <div className="location-item">
              <span className="location-label">Coordinates:</span>
              <span className="location-value">
                {experience.meeting_point.coordinates.latitude}, {experience.meeting_point.coordinates.longitude}
              </span>
            </div>
          )}
        </div>

        <h3 className="section-title">Experience Dates</h3>
        <div className="dates-info">
          <div className="date-item">
            <span className="date-label">Start Date:</span>
            <span className="date-value">{formatDate(experience.start_date)}</span>
          </div>
          <div className="date-item">
            <span className="date-label">End Date:</span>
            <span className="date-value">{formatDate(experience.end_date)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const SlotsTab = () => (
    <div
      className="tab-content"
    >
      <div className="slots-section">
        <div className="slots-header">
          <div className="slots-header-left">
            <h3 className="section-title">Slot Management</h3>
            <div className="slots-stats">
              <span className="stat-item">
                <strong>{slots.length}</strong> Total Slots
              </span>
              <span className="stat-item">
                <strong>{slots.reduce((sum, slot) => sum + slot.capacity, 0)}</strong> Total Capacity
              </span>
              <span className="stat-item">
                <strong>{slots.reduce((sum, slot) => sum + slot.booked, 0)}</strong> Booked
              </span>
            </div>
          </div>
          <div className="slots-header-right">
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${slotViewMode === 'list' ? 'active' : ''}`}
                onClick={() => setSlotViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                List View
              </button>
              <button 
                className={`toggle-btn ${slotViewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setSlotViewMode('calendar')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Calendar View
              </button>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowSlotForm(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add New Slot
            </button>
          </div>
        </div>

        {/* View Content */}
        {slotViewMode === 'list' ? (
          <>
            {/* List View Month Navigation */}
            <div className="list-month-navigation">
              <div className="month-nav-header">
                <button 
                  onClick={() => navigateListMonth(-1)} 
                  className="month-nav-btn"
                  disabled={slotsLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h3 className="month-title">
                  {currentListMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button 
                  onClick={() => navigateListMonth(1)} 
                  className="month-nav-btn"
                  disabled={slotsLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {slotsLoading && (
                <div className="month-loading">
                  <div className="loading-spinner small"></div>
                  <span>Loading slots...</span>
                </div>
              )}
            </div>

            {/* Slots Grid */}
            {slotsLoading ? (
              <div className="slots-loading">
                <div className="loading-spinner"></div>
                <p>Loading slots for {currentListMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}...</p>
              </div>
            ) : slots.length > 0 ? (
              <div className="slots-grid">
                {slots.map((slot) => (
                <div key={slot.id} className="slot-card">
                  <div className="slot-header">
                    <h4 className="slot-name">{slot.name}</h4>
                    <div className="slot-price">{formatCurrency(slot.price)}</div>
                  </div>
                  
                  <div className="slot-details">
                    <div className="slot-detail">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(slot.date)}</span>
                    </div>
                    <div className="slot-detail">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{slot.start_time} - {slot.end_time}</span>
                    </div>
                    <div className="slot-detail">
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">{slot.booked}/{slot.capacity}</span>
                    </div>
                    <div className="slot-detail">
                      <span className="detail-label">Available:</span>
                      <span className="detail-value">{slot.capacity - slot.booked}</span>
                    </div>
                  </div>

                  <div className="slot-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditSlot(slot)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={slot.booked > 0}
                      title={slot.booked > 0 ? "Cannot delete slot with existing bookings" : "Delete slot"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="empty-title">No slots for {currentListMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <p className="empty-description">
                  No slots have been created for this month yet.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowSlotForm(true)}
                >
                  Create Slot for This Month
                </button>
              </div>
            )}
          </>
        ) : (
          /* Calendar View */
          <div className="calendar-container">
            <div className="calendar-header">
              <button 
                onClick={() => navigateMonth(-1)} 
                className="calendar-nav-btn"
                disabled={slotsLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h3 className="calendar-month">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {slotsLoading && (
                  <div className="calendar-loading-indicator">
                    <div className="loading-spinner small"></div>
                  </div>
                )}
              </h3>
              <button 
                onClick={() => navigateMonth(1)} 
                className="calendar-nav-btn"
                disabled={slotsLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              
              {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty"></div>
              ))}
              
              {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                // Format date as YYYY-MM-DD using local timezone to avoid timezone shifts
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const daySlots = getSlotsForDate(dateStr);
                const hasSlots = daySlots.length > 0;
                const isSelected = selectedDate === dateStr;
                
                return (
                  <div
                    key={day}
                    className={`calendar-day ${hasSlots ? 'has-slots' : ''} ${isToday(date) ? 'today' : ''} ${isPastDate(date) ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => hasSlots && setSelectedDate(dateStr)}
                  >
                    <span className="day-number">{day}</span>
                    {hasSlots && (
                      <div className="slots-indicator">
                        <span className="slots-count">{daySlots.length}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Selected Date Slots */}
            {selectedDate && (
              <div className="selected-date-slots">
                <h4 className="selected-date-title">
                  Slots for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="date-slots-list">
                  {getSlotsForDate(selectedDate).map((slot) => (
                    <motion.div
                      key={slot.id}
                      className={`slot-item ${slot.booked >= slot.capacity ? 'fully-booked' : ''}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="slot-header">
                        <span className="slot-name">{slot.name}</span>
                        <span className="slot-price">{formatCurrency(slot.price)}</span>
                      </div>
                      <div className="slot-details">
                        <span className="slot-time">{slot.start_time} - {slot.end_time}</span>
                      </div>
                      <div className="slot-availability">
                        <span className="availability-text">
                          {slot.booked}/{slot.capacity} booked
                          {slot.booked < slot.capacity && (
                            <span className="spots-left"> ({slot.capacity - slot.booked} spots left)</span>
                          )}
                        </span>
                      </div>
                      <div className="slot-actions">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditSlot(slot)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={slot.booked > 0}
                          title={slot.booked > 0 ? "Cannot delete slot with existing bookings" : "Delete slot"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slot Form Modal */}
      {showSlotForm && (
        <div
          className="modal-overlay"
          onClick={resetSlotForm}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingSlot ? 'Edit Slot' : 'Create New Slot'}</h3>
              <button className="modal-close" onClick={resetSlotForm}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <SlotForm
              editingSlot={editingSlot}
              onSubmit={handleSlotSubmit}
              onCancel={handleSlotCancel}
              formLoading={formLoading}
              formError={formError}
              formSuccess={formSuccess}
              resetForm={shouldResetForm}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={cancelDeleteSlot}
        >
          <div
            className="modal-content delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Delete Slot</h3>
              <button className="modal-close" onClick={cancelDeleteSlot}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="delete-confirm-content">
              <div className="delete-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <h4>Are you sure you want to delete this slot?</h4>
              <p>This action cannot be undone. Any existing bookings for this slot will be affected.</p>

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

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cancelDeleteSlot}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={confirmDeleteSlot}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <div className="loading-spinner small"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Slot'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'details': return <DetailsTab />;
      case 'inclusions': return <InclusionsTab />;
      case 'images': return <ImagesTab />;
      case 'location': return <LocationTab />;
      case 'slots': return <SlotsTab />;
      default: return <OverviewTab />;
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
            {/* Header */}
            <div className="manage-header">
              <div className="header-left">
                <button 
                  className="btn btn-secondary back-btn"
                  onClick={() => router.push('/provider/listings')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Listings
                </button>
                <div className="page-title-section">
                  <h1 className="page-title">Experience Management Center</h1>
                  <p className="page-subtitle">Manage your experience details, bookings, and settings</p>
                </div>
              </div>
              
              <div className="header-actions">
            <button
              className="btn btn-outline"
              onClick={() => router.push(`/provider/bookings`)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View Bookings
            </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => router.push(`/experience/${experience.id}`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View Public
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push(`/provider/listings/edit/${experience.id}`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit Experience
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="manage-tabs">
              <div className="tab-buttons">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="manage-content">
              {renderTabContent()}
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
