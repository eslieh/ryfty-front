"use client";

import React from 'react';
import '@/styles/skeleton.css';

const SkeletonLoader = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '',
  variant = 'text' // 'text', 'rectangular', 'circular'
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'skeleton-circular';
      case 'rectangular':
        return 'skeleton-rectangular';
      default:
        return 'skeleton-text';
    }
  };

  return (
    <div 
      className={`skeleton ${getVariantClass()} ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius: variant === 'circular' ? '50%' : borderRadius 
      }}
    />
  );
};

// Experience Detail Skeleton Component
export const ExperienceDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header placeholder */}
      <div style={{ height: '80px', background: '#f8f9fa' }}></div>
      
      <div className="experience-detail-container">
        {/* Back Button Skeleton */}
        <div style={{ marginBottom: '32px' }}>
          <SkeletonLoader width="180px" height="40px" borderRadius="8px" />
        </div>

        {/* Title and Favorite Skeleton */}
        <div className="experience-header" style={{ marginBottom: '32px' }}>
          <div className="experience-title-section">
            <SkeletonLoader width="60%" height="36px" borderRadius="8px" className="skeleton-title" />
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <SkeletonLoader width="150px" height="20px" borderRadius="6px" />
              <SkeletonLoader width="100px" height="20px" borderRadius="6px" />
            </div>
          </div>
          <SkeletonLoader variant="circular" width="48px" height="48px" />
        </div>

        {/* Image Gallery Skeleton */}
        <div className="image-gallery" style={{ marginBottom: '40px' }}>
          <div className="main-image" style={{ position: 'relative', height: '400px', marginBottom: '16px' }}>
            <SkeletonLoader width="100%" height="100%" borderRadius="12px" variant="rectangular" />
          </div>
          <div className="gallery-grid" style={{ display: 'flex', gap: '16px' }}>
            <SkeletonLoader width="48%" height="120px" borderRadius="12px" variant="rectangular" />
            <SkeletonLoader width="48%" height="120px" borderRadius="12px" variant="rectangular" />
          </div>
        </div>

        {/* Content Section Skeleton */}
        <div className="experience-content-section" style={{ display: 'flex', gap: '40px' }}>
          <div className="main-content" style={{ flex: 1 }}>
            {/* Host Section Skeleton */}
            <div className="host-section" style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
              <SkeletonLoader variant="circular" width="56px" height="56px" />
              <div style={{ flex: 1 }}>
                <SkeletonLoader width="200px" height="24px" borderRadius="6px" />
                <SkeletonLoader width="100%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                <SkeletonLoader width="80%" height="16px" borderRadius="4px" style={{ marginTop: '4px' }} />
              </div>
            </div>

            {/* Description Section Skeleton */}
            <div className="description-section" style={{ marginBottom: '40px' }}>
              <SkeletonLoader width="250px" height="28px" borderRadius="6px" className="skeleton-section-title" />
              <div style={{ marginTop: '16px' }}>
                <SkeletonLoader width="100%" height="16px" borderRadius="4px" />
                <SkeletonLoader width="100%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                <SkeletonLoader width="100%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                <SkeletonLoader width="75%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
              </div>
            </div>

            {/* Activities Section Skeleton */}
            <div className="highlights-section" style={{ marginBottom: '40px' }}>
              <SkeletonLoader width="150px" height="28px" borderRadius="6px" className="skeleton-section-title" />
              <div style={{ marginTop: '16px' }}>
                {[1, 2, 3, 4].map((item) => {
                  // Create deterministic widths to avoid hydration issues
                  const widths = ['75%', '60%', '85%', '70%'];
                  return (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <SkeletonLoader width="8px" height="8px" variant="circular" style={{ marginRight: '12px' }} />
                      <SkeletonLoader width={widths[item - 1]} height="16px" borderRadius="4px" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meeting Section Skeleton */}
            <div className="meeting-section">
              <SkeletonLoader width="200px" height="28px" borderRadius="6px" className="skeleton-section-title" />
              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                <SkeletonLoader width="250px" height="20px" borderRadius="4px" />
                <SkeletonLoader width="300px" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
                <SkeletonLoader width="200px" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
              </div>
              <SkeletonLoader width="100%" height="300px" borderRadius="12px" variant="rectangular" />
            </div>
          </div>

          {/* Booking Card Skeleton */}
          <div style={{ width: '400px' }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '32px', 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e9ecef'
            }}>
              {/* Price Section Skeleton */}
              <div style={{ marginBottom: '32px' }}>
                <SkeletonLoader width="180px" height="32px" borderRadius="6px" />
                <SkeletonLoader width="150px" height="20px" borderRadius="4px" style={{ marginTop: '8px' }} />
              </div>
              
              {/* Slots Section Skeleton */}
              <div>
                <SkeletonLoader width="160px" height="24px" borderRadius="6px" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map((slot) => (
                    <div key={slot} style={{ 
                      padding: '16px', 
                      border: '2px solid #f0f0f0', 
                      borderRadius: '12px' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <SkeletonLoader width="100px" height="18px" borderRadius="4px" />
                        <SkeletonLoader width="80px" height="18px" borderRadius="4px" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <SkeletonLoader width="120px" height="16px" borderRadius="4px" />
                        <SkeletonLoader width="100px" height="16px" borderRadius="4px" />
                      </div>
                      <SkeletonLoader width="90px" height="14px" borderRadius="4px" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Button Skeleton */}
              <div style={{ marginTop: '32px' }}>
                <SkeletonLoader width="100%" height="56px" borderRadius="12px" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer placeholder */}
      <div style={{ height: '200px', background: '#f8f9fa', marginTop: '80px' }}></div>
    </div>
  );
};

export default SkeletonLoader;
