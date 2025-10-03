"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchExperiences } from "../utils/api";
import "../styles/skeleton.css";

export default function ExperienceList({ searchQuery = "" }) {
  const router = useRouter();
  const isInitialLoad = useRef(true);
  const [favorites, setFavorites] = useState(new Set());
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Fetch experiences from API
  useEffect(() => {
    const loadExperiences = async () => {
      try {
        // If this is the initial load, show full loading
        // If this is a search, show searching state
        if (isInitialLoad.current) {
          setLoading(true);
        } else {
          setSearching(true);
        }
        setError(null);
        
        const data = await fetchExperiences(searchQuery);
        setExperiences(data.experiences || []);
        
        // Mark initial load as complete
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setError('Failed to load experiences. Please try again.');
      } finally {
        setLoading(false);
        setSearching(false);
      }
    };

    loadExperiences();
  }, [searchQuery]);

  const toggleFavorite = (experienceId, event) => {
    event.stopPropagation(); // Prevent card click when clicking heart
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(experienceId)) {
        newFavorites.delete(experienceId);
      } else {
        newFavorites.add(experienceId);
      }
      return newFavorites;
    });
  };

  const handleCardClick = (experienceId) => {
    router.push(`/experience/${experienceId}`);
  };

  // Helper function to calculate duration from start and end dates
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "Duration varies";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day";
    if (diffDays > 1) return `${diffDays} days`;
    
    // If same day, calculate hours
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `${diffHours} hours`;
  };

  // Helper function to get primary location
  const getPrimaryLocation = (destinations) => {
    if (!destinations || destinations.length === 0) return "Location TBD";
    return destinations[0];
  };

  // Helper function to generate rating (since API doesn't provide it)
  const generateRating = () => {
    return (4.8 + Math.random() * 0.2).toFixed(2);
  };

  // Placeholder image for experiences without poster images
  const placeholderImage = "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='18' fill='%23999' text-anchor='middle' dy='.3em'%3EExperience Image%3C/text%3E%3C/svg%3E";

  if (loading) {
    return (
      <div className="experience-list-container">
        <motion.div 
          className="experience-grid skeleton-group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {[...Array(6)].map((_, index) => (
            <motion.div
              key={index}
              className="experience-card skeleton-fade-in"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1,
                ease: "easeOut" 
              }}
            >
              {/* Skeleton Image */}
              <div className="experience-image-container skeleton skeleton-shimmer"></div>
              
              {/* Skeleton Content */}
              <div className="experience-content">
                {/* Title skeleton */}
                <div className="skeleton skeleton-shimmer" style={{ 
                  height: '20px', 
                  width: '85%', 
                  marginBottom: '12px',
                  borderRadius: '4px'
                }}></div>
                
                {/* Details skeleton */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div className="skeleton skeleton-shimmer" style={{ 
                    height: '16px', 
                    width: '60px',
                    borderRadius: '4px'
                  }}></div>
                  <div className="skeleton skeleton-shimmer" style={{ 
                    height: '16px', 
                    width: '40px',
                    marginLeft: 'auto',
                    borderRadius: '4px'
                  }}></div>
                </div>
                
                {/* Location skeleton */}
                <div className="skeleton skeleton-shimmer" style={{ 
                  height: '16px', 
                  width: '70%', 
                  marginBottom: '8px',
                  borderRadius: '4px'
                }}></div>
                
                {/* Price skeleton */}
                <div className="skeleton skeleton-shimmer" style={{ 
                  height: '18px', 
                  width: '50%',
                  borderRadius: '4px'
                }}></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="experience-list-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="experience-list-container">
        <div className="no-experiences">
          <p>No experiences found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="experience-list-container">
      {/* Search indicator */}
      {searching && (
        <motion.div 
          className="search-indicator"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="search-indicator-content">
            <div className="search-spinner"></div>
            <span>Searching experiences...</span>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        className={`experience-grid ${searching ? 'searching' : ''}`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: searching ? 0.6 : 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {experiences.map((experience, index) => (
          <motion.div
            key={experience.id}
            className="experience-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut" 
            }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            onClick={() => handleCardClick(experience.id)}
          >
            {/* Image Container */}
            <div className="experience-image-container">
              <Image 
                src={experience.poster_image_url || placeholderImage} 
                alt={experience.title}
                className="experience-image"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
              />
              
              {/* Heart Icon */}
              <motion.button
                className={`experience-heart ${favorites.has(experience.id) ? 'favorited' : ''}`}
                onClick={(e) => toggleFavorite(experience.id, e)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={favorites.has(experience.id) ? "currentColor" : "none"}
                  />
                </svg>
              </motion.button>
            </div>

            {/* Card Content */}
            <div className="experience-content">
              <h3 className="experience-title">{experience.title}</h3>
              
              <div className="experience-details">
                <span className="experience-duration">
                  {calculateDuration(experience.start_date, experience.end_date)}
                </span>
                <div className="experience-rating">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="star-icon">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="rating-score">{generateRating()}</span>
                </div>
              </div>
              
              <div className="experience-location">
                <span className="location-text">{getPrimaryLocation(experience.destinations)}</span>
              </div>
              
              <div className="experience-price">
                <span className="price-amount">
                  ${experience.min_price}
                  {experience.max_price !== experience.min_price && ` - $${experience.max_price}`}
                </span>
                <span className="price-person">per person</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}