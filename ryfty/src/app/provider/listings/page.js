"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchProviderExperiences } from '@/utils/api';
import '@/styles/provider.css';

export default function ListingsPage() {
  const [activeTab, setActiveTab] = useState('experiences');
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
 

  useEffect(() => {
    const fetchExperiences = async () => {
      if (!isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchProviderExperiences();
        
        // Handle the API response structure
        if (response && response.experiences) {
          setExperiences(response.experiences);
        } else {
          setExperiences([]);
        }
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setError(err.message || 'Failed to fetch experiences');
        setExperiences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [isAuthenticated, isProvider]);

  const ExperienceCard = ({ experience }) => (
    <motion.div
      className="experience-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="experience-poster">
        <img 
          src={experience.poster_image_url || '/images/placeholder.jpg'} 
          alt={experience.title} 
          className="poster-image" 
        />
        <div className={`experience-status experience-status-${experience.status}`}>
          {experience.status}
        </div>
      </div>
      
      <div className="experience-content">
        <h3 className="experience-title">{experience.title}</h3>
        <p className="experience-description">{experience.description || 'No description available'}</p>
        
        <div className="experience-metrics">
          <div className="metric-item">
            <div className="metric-label">Created</div>
            <div className="metric-value">
              <span className="created-date">
                {new Date(experience.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="metric-item">
            <div className="metric-label">Duration</div>
            <div className="metric-value">
              <span className="duration">
                {experience.start_date && experience.end_date 
                  ? `${new Date(experience.start_date).toLocaleDateString()} - ${new Date(experience.end_date).toLocaleDateString()}`
                  : 'No dates set'
                }
              </span>
            </div>
          </div>
        </div>
        
        <div className="experience-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push(`/provider/listings/manage/${experience.id}`)}
          >
            Manage
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => router.push(`/provider/bookings`)}
          >
            View Bookings
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => router.push(`/provider/listings/reviews/${experience.id}`)}
          >
            Reviews
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => router.push(`/experience/${experience.id}`)}
          >
            View Public
          </button>
        </div>
      </div>
    </motion.div>
  );

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
              <p>Loading experiences...</p>
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
              <h3 className="error-title">Failed to Load Experiences</h3>
              <p className="error-description">{error}</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-main-page">
      {/* Header with Logo */}
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        {/* Left Navigation */}
        <TabNavigation
          className="provider-left-nav"
          orientation="vertical"
        />

        {/* Main Content Area */}
        <motion.main 
          className="provider-main-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="content-wrapper">
            <div className="provider-experiences">
        {/* Header */}
        <motion.div
          className="experiences-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1 className="page-title">Listings</h1>
          </div>
          <motion.button
            className="btn btn-primary create-btn"
            onClick={() => router.push('/provider/listings/create')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Listings
          </motion.button>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="listings-tabs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="tab-buttons">
            <button
              className={`tab-button ${activeTab === 'experiences' ? 'active' : ''}`}
              onClick={() => setActiveTab('experiences')}
            >
              Experiences
            </button>
            <button
              className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
            Services
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'experiences' && (
          <>
            {/* Experiences Grid */}
            <motion.div 
              className="experiences-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {experiences.length > 0 ? (
                experiences.map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} />
                ))
              ) : (
                <motion.div
                  className="empty-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="empty-title">No experiences yet</h3>
                  <p className="empty-description">
                    Create your first experience to start hosting guests
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => router.push('/provider/listings/create')}
                  >
                    Create Your First Experience
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}

        {activeTab === 'services' && (
          <motion.div
            className="services-coming-soon"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="coming-soon-content">
              <div className="coming-soon-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="coming-soon-title">Services Coming Soon</h2>
              <p className="coming-soon-description">
                We&apos;re working on bringing you a comprehensive services platform. 
                Soon you&apos;ll be able to offer various services like transportation, 
                photography, catering, and more to complement your experiences.
              </p>
              <div className="coming-soon-features">
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Transportation Services</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Photography & Videography</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Catering Services</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Equipment Rental</span>
                </div>
              </div>
              <div className="coming-soon-notify">
                <button className="btn btn-secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notify Me When Available
                </button>
              </div>
            </div>
          </motion.div>
            )}
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
