"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchExperiences } from "../utils/api";
import "../styles/skeleton.css";
import "../styles/experience-list.css";

export default function ExperienceList({ searchQuery = "" }) {
  const router = useRouter();
  const isInitialLoad = useRef(true);
  const [favorites, setFavorites] = useState(new Set());
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);
  // Load more experiences function
  const loadMoreExperiences = useCallback(async () => {
    if (loadingMore || !hasNextPage) return;
    
    try {
      setLoadingMore(true);
      setError(null);
      
      const data = await fetchExperiences(searchQuery, nextCursor);
      console.log('Loaded more experiences:', data);
      
      setExperiences(prev => [...prev, ...(data.experiences || [])]);
      setHasNextPage(data.pagination?.has_next || false);
      setNextCursor(data.pagination?.next_cursor || null);
    } catch (err) {
      console.error('Error loading more experiences:', err);
      setError('Failed to load more experiences. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  }, [searchQuery, nextCursor, hasNextPage, loadingMore]);

  // Initial load and search reset
  useEffect(() => {
    const loadExperiences = async () => {
      try {
        // Reset pagination state when search query changes
        setHasNextPage(true);
        setNextCursor(null);
        setLoadingMore(false);
        
        // If this is the initial load, show full loading
        // If this is a search, show searching state
        if (isInitialLoad.current) {
          setLoading(true);
        } else {
          setSearching(true);
        }
        setError(null);
        
        const data = await fetchExperiences(searchQuery);
        console.log('Initial load data:', data);
        
        setExperiences(data.experiences || []);
        setHasNextPage(data.pagination?.has_next || false);
        setNextCursor(data.pagination?.next_cursor || null);
        
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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !loadingMore && !loading && !searching) {
          loadMoreExperiences();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [hasNextPage, loadingMore, loading, searching, loadMoreExperiences]);

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
  const generateRating = (experienceId) => {
    // Create a deterministic rating based on experience ID to avoid hydration issues
    const hash = experienceId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const normalizedHash = Math.abs(hash) % 100;
    return (4.5 + (normalizedHash / 100) * 0.5).toFixed(1);
  };

  // Helper function to convert USD to KES
  const convertToKES = (usdAmount) => {
    const exchangeRate = 1; // Approximate USD to KES rate
    return Math.round(usdAmount * exchangeRate);
  };

  // Helper function to format KES price
  const formatKESPrice = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
              className="experience-card-hm skeleton-fade-in"
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
              <div className="experience-content-hm">
                {/* Title skeleton */}
                <div className="skeleton skeleton-shimmer skeleton-title"></div>
                
                {/* Details skeleton */}
                <div className="skeleton-details-container">
                  <div className="skeleton skeleton-shimmer skeleton-duration"></div>
                  <div className="skeleton skeleton-shimmer skeleton-rating"></div>
                </div>
                
                {/* Location skeleton */}
                <div className="skeleton skeleton-shimmer skeleton-location"></div>
                
                {/* Price skeleton */}
                <div className="skeleton skeleton-shimmer skeleton-price"></div>
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
            className="experience-card-hm"
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
              />
              
              {/* Share Button */}
              <motion.button
                className="experience-share"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle share functionality
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12549 15.0077 5.24919 15.0227 5.37063L8.08331 9.17063C7.51839 8.46543 6.66631 8 5.66667 8C3.91005 8 2.5 9.41005 2.5 11.1667C2.5 12.9233 3.91005 14.3333 5.66667 14.3333C6.66631 14.3333 7.51839 13.8679 8.08331 13.1627L15.0227 16.9627C15.0077 17.0841 15 17.2078 15 17.3333C15 19.09 16.4101 20.5 18.1667 20.5C19.9233 20.5 21.3333 19.09 21.3333 17.3333C21.3333 15.5767 19.9233 14.1667 18.1667 14.1667C17.1663 14.1667 16.3142 14.6321 15.7493 15.3373L8.80993 11.5373C8.82493 11.4159 8.83267 11.2922 8.83267 11.1667C8.83267 11.0411 8.82493 10.9174 8.80993 10.796L15.7493 6.996C16.3142 7.7012 17.1663 8.16667 18.1667 8.16667L18 8Z" fill="currentColor"/>
                </svg>
              </motion.button>
            </div>

            {/* Card Content */}
            <div className="experience-content-hm">
              <h3 className="experience-title-hm">{experience.title}</h3>
              
              <div className="experience-location">
                <span className="location-text">{getPrimaryLocation(experience.destinations)}</span>
              </div>
              
              <div className="experience-price">
                <span className="price-amount-experience">
                  From {formatKESPrice(convertToKES(experience.min_price))}
                  {experience.max_price !== experience.min_price && ` - ${formatKESPrice(convertToKES(experience.max_price))}`}
                </span>
                <span className="price-person">/ guest</span>
              </div>
              
              <div className="experience-rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="star-icon">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="currentColor"
                  />
                </svg>
                <span className="rating-score">{experience.avg_rating || 0}</span>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Infinite scroll trigger and loading indicator */}
        {hasNextPage && (
          <div ref={observerRef} className="infinite-scroll-trigger">
            {loadingMore && (
              <motion.div 
                className="loading-more-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="loading-more-content">
                  <div className="loading-spinner"></div>
                  <span>Loading more experiences...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        
      </motion.div>
      {/* End of results indicator */}
      {!hasNextPage && experiences.length > 0 && (
          <motion.div 
            className="end-of-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p>You've reached the end of the experiences</p>
          </motion.div>
        )}
    </div>
  );
}