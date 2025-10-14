"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import TabNavigation from "@/components/provider/TabNavigation";
import ProviderHeader from "@/components/provider/ProviderHeader";
import SkeletonLoader from "@/components/SkeletonLoader";
import "@/styles/provider.css";
import "@/styles/review-form.css";
import config from "@/config";
import { getAuthToken } from "@/utils/authStorage";
import { useAuth } from "@/contexts/AuthContext";

function ExperienceReviewsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isProvider } = useAuth();
  const { id } = params;
  
  // Experience states
  const [experience, setExperience] = useState(null);
  const [experienceLoading, setExperienceLoading] = useState(true);
  const [experienceError, setExperienceError] = useState(null);
  
  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  // Redirect if not authenticated or not a provider
  if (!isAuthenticated || !isProvider()) {
    return (
      <div className="provider-loading">
        <div className="spinner large"></div>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // Fetch experience details
  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setExperienceLoading(true);
        setExperienceError(null);
        
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Only add auth header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('Fetching experience:', id);
        const response = await fetch(`${config.api.baseUrl}/public/experiences/${id}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch experience: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Experience data:', data);
        
        if (data.experience) {
          setExperience(data.experience);
        } else {
          throw new Error('Experience not found');
        }
      } catch (err) {
        console.error('Error fetching experience:', err);
        setExperienceError(err.message);
      } finally {
        setExperienceLoading(false);
      }
    };
    
    if (id) {
      fetchExperience();
    }
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!experience?.id) return;
      
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('Fetching reviews for experience:', experience.id);
        const response = await fetch(`${config.api.baseUrl}/experiences/${experience.id}/reviews?page=1&per_page=10`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Reviews data:', data);
        
        if (data.reviews) {
          setReviews(data.reviews);
          setReviewsPagination(data.pagination);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviewsError(err.message);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [experience?.id]);

  // Load more reviews function
  const loadMoreReviews = async () => {
    if (!reviewsPagination.has_next || loadingMoreReviews) return;
    
    try {
      setLoadingMoreReviews(true);
      
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const nextPage = reviewsPagination.page + 1;
      console.log('Loading more reviews, page:', nextPage);
      
      const response = await fetch(`${config.api.baseUrl}/experiences/${experience.id}/reviews?page=${nextPage}&per_page=${reviewsPagination.per_page}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more reviews: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('More reviews data:', data);
      
      if (data.reviews) {
        setReviews(prevReviews => [...prevReviews, ...data.reviews]);
        setReviewsPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error loading more reviews:', err);
      alert('Failed to load more reviews. Please try again.');
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  // Loading state
  if (experienceLoading) {
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
              <p>Loading experience details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (experienceError) {
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
              <p className="error-description">{experienceError}</p>
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

  // No experience found
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
                </svg>
              </div>
              <h3 className="error-title">Experience Not Found</h3>
              <p className="error-description">The experience you're looking for doesn't exist.</p>
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
            <motion.div
              className="reviews-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="header-content">
                <div className="breadcrumb">
                  <button 
                    onClick={() => router.push('/provider/listings')}
                    className="breadcrumb-link"
                  >
                    Listings
                  </button>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-current">Reviews</span>
                </div>
                <h1 className="page-title">{experience?.title || 'Experience'} Reviews</h1>
                <div className="reviews-summary-stats">
                  <div className="reviews-count-badge">
                    {reviewsPagination.total_count} review{reviewsPagination.total_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reviews Section */}
            <motion.div 
              className="reviews-section reviews-page-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {reviewsLoading ? (
                <div className="reviews-skeleton">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="review-skeleton-item">
                      <div className="review-skeleton-header">
                        <div className="review-skeleton-user">
                          <SkeletonLoader variant="circular" width="40px" height="40px" />
                          <div className="review-skeleton-user-info">
                            <SkeletonLoader width="120px" height="16px" borderRadius="4px" />
                            <SkeletonLoader width="80px" height="12px" borderRadius="4px" style={{ marginTop: '4px' }} />
                          </div>
                        </div>
                        <div className="review-skeleton-rating">
                          <SkeletonLoader width="80px" height="16px" borderRadius="4px" />
                        </div>
                      </div>
                      <div className="review-skeleton-content">
                        <SkeletonLoader width="100%" height="16px" borderRadius="4px" />
                        <SkeletonLoader width="100%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                        <SkeletonLoader width="75%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviewsError ? (
                <div className="reviews-error">
                  <div className="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="error-title">Error Loading Reviews</h4>
                  <p className="error-message">{reviewsError}</p>
                  <button onClick={() => window.location.reload()} className="retry-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12A9 9 0 0 1 12 3A9 9 0 0 1 21 12A9 9 0 0 1 12 21A9 9 0 0 1 3 12Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 3V12L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Retry
                  </button>
                </div>
              ) : reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      className="review-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="review-header">
                        <div className="review-user">
                          <div className="review-avatar">
                            <Image
                              src={review.user?.avatar_url || config.defaultAvatar}
                              alt={review.user?.name || 'User'}
                              width={40}
                              height={40}
                              className="review-avatar-image"
                            />
                          </div>
                          <div className="review-user-info">
                            <h4 className="review-user-name">{review.user?.name || 'Anonymous'}</h4>
                            {review.user?.location && (
                              <p className="review-location">{review.user.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="review-meta">
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`star ${i < review.rating ? 'filled' : 'empty'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="review-date">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="review-content">
                        <p className="review-comment">{review.comment}</p>
                        
                        {review.images && review.images.length > 0 && (
                          <div className="review-images">
                            <div className="review-image-group">
                              {review.images.map((imageUrl, imageIndex) => (
                                <div key={imageIndex} className="review-image-item">
                                  <Image
                                    src={imageUrl}
                                    alt={`Review image ${imageIndex + 1}`}
                                    width={120}
                                    height={120}
                                    className="review-image"
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Load More Reviews Button */}
                  {reviewsPagination.has_next && (
                    <div className="reviews-load-more">
                      <button
                        onClick={loadMoreReviews}
                        disabled={loadingMoreReviews}
                        className="load-more-reviews-btn"
                      >
                        {loadingMoreReviews ? (
                          <>
                            <span className="loading-spinner"></span>
                            Loading more reviews...
                          </>
                        ) : (
                          `Load More Reviews (${reviewsPagination.total_count - reviews.length} remaining)`
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Reviews Summary */}
                  <div className="reviews-summary">
                    <p className="reviews-count">
                      Showing {reviews.length} of {reviewsPagination.total_count} reviews
                    </p>
                  </div>
                </div>
              ) : (
                <div className="no-reviews">
                  <div className="no-reviews-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="no-reviews-title">No reviews yet</h4>
                  <p className="no-reviews-message">
                    This experience doesn't have any reviews yet.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

export default ExperienceReviewsPage;
