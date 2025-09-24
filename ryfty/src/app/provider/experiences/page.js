"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProviderLayout from '@/components/provider/ProviderLayout';

export default function ProviderExperiences() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch experiences
    const fetchExperiences = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API calls
      setExperiences([
        {
          id: 1,
          title: 'Nairobi National Park Safari',
          description: 'Experience the wildlife of Nairobi National Park with our expert guides.',
          price: 15000,
          duration: '4 hours',
          maxGuests: 6,
          status: 'active',
          bookings: 45,
          rating: 4.8,
          image: '/images/safari.jpg'
        },
        {
          id: 2,
          title: 'Cultural Village Tour',
          description: 'Immerse yourself in local culture and traditions.',
          price: 8500,
          duration: '3 hours',
          maxGuests: 12,
          status: 'active',
          bookings: 23,
          rating: 4.6,
          image: '/images/cultural.jpg'
        },
        {
          id: 3,
          title: 'Mountain Hiking Adventure',
          description: 'Conquer the peaks with our experienced mountain guides.',
          price: 12000,
          duration: '6 hours',
          maxGuests: 8,
          status: 'draft',
          bookings: 0,
          rating: 0,
          image: '/images/hiking.jpg'
        }
      ]);

      setLoading(false);
    };

    fetchExperiences();
  }, []);

  const ExperienceCard = ({ experience }) => (
    <motion.div
      className="experience-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="experience-image">
        <img src={experience.image} alt={experience.title} />
        <div className={`experience-status experience-status-${experience.status}`}>
          {experience.status}
        </div>
      </div>
      
      <div className="experience-content">
        <h3 className="experience-title">{experience.title}</h3>
        <p className="experience-description">{experience.description}</p>
        
        <div className="experience-details">
          <div className="detail-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            KSh {experience.price.toLocaleString()}
          </div>
          <div className="detail-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {experience.duration}
          </div>
          <div className="detail-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Max {experience.maxGuests} guests
          </div>
        </div>
        
        <div className="experience-stats">
          <div className="stat">
            <span className="stat-value">{experience.bookings}</span>
            <span className="stat-label">Bookings</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {experience.rating > 0 ? `${experience.rating}/5` : 'No rating'}
            </span>
            <span className="stat-label">Rating</span>
          </div>
        </div>
        
        <div className="experience-actions">
          <button className="btn btn-secondary">Edit</button>
          <button className="btn btn-primary">View Details</button>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <ProviderLayout>
        <div className="experiences-loading">
          <div className="spinner large"></div>
          <p>Loading experiences...</p>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="provider-experiences">
        {/* Header */}
        <motion.div
          className="experiences-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1 className="page-title">My Experiences</h1>
            <p className="page-subtitle">
              Manage and track your hosted experiences
            </p>
          </div>
          <motion.button
            className="btn btn-primary create-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create New Experience
          </motion.button>
        </motion.div>

        {/* Stats */}
        <div className="experiences-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{experiences.length}</div>
              <div className="stat-title">Total Experiences</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V8.5C3 7.39543 3.89543 6.5 5 6.5H19C20.1046 6.5 21 7.39543 21 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {experiences.reduce((sum, exp) => sum + exp.bookings, 0)}
              </div>
              <div className="stat-title">Total Bookings</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {experiences.length > 0 
                  ? (experiences.reduce((sum, exp) => sum + exp.rating, 0) / experiences.filter(exp => exp.rating > 0).length).toFixed(1)
                  : '0'
                }/5
              </div>
              <div className="stat-title">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Experiences Grid */}
        <div className="experiences-grid">
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
              <button className="btn btn-primary">
                Create Your First Experience
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
