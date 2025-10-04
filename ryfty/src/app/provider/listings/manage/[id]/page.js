"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
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
  const [slotFormData, setSlotFormData] = useState({
    name: '',
    capacity: '',
    price: '',
    date: '',
    start_time: '',
    end_time: '',
    timezone: 'Africa/Nairobi'
  });
  
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

  // Fetch slots data
  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!params?.id || !isAuthenticated || !isProvider()) return;
      
      try {
        const response = await fetchExperienceSlots(params.id);
        
        if (response && response.slots) {
          setSlots(response.slots);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setSlots([]);
      }
    };

    fetchSlotsData();
  }, [params?.id, isAuthenticated, isProvider]);

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

  const handleSlotFormChange = (field, value) => {
    setSlotFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetSlotForm = () => {
    setSlotFormData({
      name: '',
      capacity: '',
      price: '',
      date: '',
      start_time: '',
      end_time: '',
      timezone: 'Africa/Nairobi'
    });
    setEditingSlot(null);
    setShowSlotForm(false);
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    
    try {
      await createSlot(params.id, {
        ...slotFormData,
        capacity: parseInt(slotFormData.capacity),
        price: parseFloat(slotFormData.price)
      });
      
      // Refresh slots data
      const response = await fetchExperienceSlots(params.id);
      if (response && response.slots) {
        setSlots(response.slots);
      }
      
      resetSlotForm();
    } catch (err) {
      console.error('Error creating slot:', err);
      alert('Failed to create slot. Please try again.');
    }
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotFormData({
      name: slot.name,
      capacity: slot.capacity.toString(),
      price: slot.price.toString(),
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      timezone: slot.timezone
    });
    setShowSlotForm(true);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    
    try {
      await updateSlot(editingSlot.id, {
        ...slotFormData,
        capacity: parseInt(slotFormData.capacity),
        price: parseFloat(slotFormData.price)
      });
      
      // Refresh slots data
      const response = await fetchExperienceSlots(params.id);
      if (response && response.slots) {
        setSlots(response.slots);
      }
      
      resetSlotForm();
    } catch (err) {
      console.error('Error updating slot:', err);
      alert('Failed to update slot. Please try again.');
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
    <motion.div
      className="tab-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="slots-section">
        <div className="slots-header">
          <h3 className="section-title">Slot Management</h3>
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

        {slots.length > 0 ? (
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
            <h3 className="empty-title">No slots created yet</h3>
            <p className="empty-description">
              Create slots to allow guests to book specific times for your experience.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowSlotForm(true)}
            >
              Create Your First Slot
            </button>
          </div>
        )}
      </div>

      {/* Slot Form Modal */}
      {showSlotForm && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetSlotForm}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
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

            <form onSubmit={editingSlot ? handleUpdateSlot : handleCreateSlot} className="slot-form">
              <div className="form-group">
                <label htmlFor="slot-name">Slot Name *</label>
                <input
                  type="text"
                  id="slot-name"
                  value={slotFormData.name}
                  onChange={(e) => handleSlotFormChange('name', e.target.value)}
                  placeholder="e.g., Morning Session, VIP Experience"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="slot-capacity">Capacity *</label>
                  <input
                    type="number"
                    id="slot-capacity"
                    value={slotFormData.capacity}
                    onChange={(e) => handleSlotFormChange('capacity', e.target.value)}
                    placeholder="20"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="slot-price">Price (KES) *</label>
                  <input
                    type="number"
                    id="slot-price"
                    value={slotFormData.price}
                    onChange={(e) => handleSlotFormChange('price', e.target.value)}
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="slot-date">Date *</label>
                <input
                  type="date"
                  id="slot-date"
                  value={slotFormData.date}
                  onChange={(e) => handleSlotFormChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="slot-start-time">Start Time *</label>
                  <input
                    type="time"
                    id="slot-start-time"
                    value={slotFormData.start_time}
                    onChange={(e) => handleSlotFormChange('start_time', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="slot-end-time">End Time *</label>
                  <input
                    type="time"
                    id="slot-end-time"
                    value={slotFormData.end_time}
                    onChange={(e) => handleSlotFormChange('end_time', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="slot-timezone">Timezone</label>
                <select
                  id="slot-timezone"
                  value={slotFormData.timezone}
                  onChange={(e) => handleSlotFormChange('timezone', e.target.value)}
                >
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetSlotForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
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
