"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { submitReview } from "@/utils/api";
import { uploadMultipleToCloudinary, validateReviewImages } from "@/utils/cloudinaryUpload";
import { compressImageWithPreset } from "@/utils/imageCompression";
import "@/styles/review-form.css";

export default function ReviewForm({ 
  experienceId, 
  reservationId, 
  experienceTitle, 
  onReviewSubmitted,
  onClose 
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingImages, setUploadingImages] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (value) => {
    setRating(value);
  };

  const handleRatingHover = (value) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    // Validate images
    const validation = validateReviewImages(files, 2);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // Check if adding these files would exceed the limit
    if (imageFiles.length + files.length > 2) {
      setError('Maximum 2 images allowed');
      return;
    }

    try {
      // Compress images before showing preview
      const compressedFiles = await Promise.all(
        files.map(file => compressImageWithPreset(file, 'gallery'))
      );

      // Create preview URLs
      const imageUrls = compressedFiles.map(blob => URL.createObjectURL(blob));
      
      // Update state
      setImages(prev => [...prev, ...imageUrls]);
      setImageFiles(prev => [...prev, ...compressedFiles]);
      setError(null);
    } catch (err) {
      console.error('Error processing images:', err);
      setError('Failed to process images. Please try again.');
    }
  };

  const removeImage = (index) => {
    // Revoke object URL to free memory
    URL.revokeObjectURL(images[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a comment");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let uploadedImageUrls = [];

      // Upload images to Cloudinary if any
      if (imageFiles.length > 0) {
        setIsUploadingImages(true);
        setUploadProgress(0);
        
        // Initialize uploading images state
        const initialUploadingImages = imageFiles.map((file, index) => ({
          index,
          name: `Image ${index + 1}`,
          progress: 0,
          status: 'uploading'
        }));
        setUploadingImages(initialUploadingImages);
        
        try {
          uploadedImageUrls = await uploadMultipleToCloudinary(
            imageFiles, 
            'reviews',
            (current, total) => {
              const progress = Math.round((current / total) * 100);
              setUploadProgress(progress);
              
              // Update individual image progress
              setUploadingImages(prev => 
                prev.map((img, index) => ({
                  ...img,
                  progress: index < current ? 100 : index === current ? (current % 1) * 100 : 0,
                  status: index < current ? 'completed' : index === current ? 'uploading' : 'pending'
                }))
              );
            }
          );
          
          // Mark all as completed
          setUploadingImages(prev => 
            prev.map(img => ({ ...img, progress: 100, status: 'completed' }))
          );
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          setError('Failed to upload images. Please try again.');
          setUploadingImages(prev => 
            prev.map(img => ({ ...img, status: 'error' }))
          );
          return;
        } finally {
          setIsUploadingImages(false);
        }
      }

      const reviewData = {
        rating,
        comment: comment.trim(),
        images: uploadedImageUrls,
        reservation_id: reservationId
      };

      await submitReview(experienceId, reviewData);
      
      // Call success callback
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      // Close the form
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={`star ${isActive ? 'active' : ''}`}
          onClick={() => handleRatingClick(starValue)}
          onMouseEnter={() => handleRatingHover(starValue)}
          onMouseLeave={handleRatingLeave}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill={isActive ? "#FFD700" : "#E5E7EB"}
              stroke={isActive ? "#FFD700" : "#D1D5DB"}
              strokeWidth="1"
            />
          </svg>
        </button>
      );
    });
  };

  return (
    <motion.div
      className="review-form-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="review-form-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-form-header">
          <h2 className="review-form-title">Leave a Review</h2>
          <button
            onClick={onClose}
            className="review-form-close"
            disabled={isSubmitting}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="review-form-content">
          <div className="experience-info">
            <h3 className="experience-title">{experienceTitle}</h3>
            <p className="reservation-id">Reservation ID: {reservationId}</p>
          </div>

          <form onSubmit={handleSubmit} className="review-form">
            {/* Rating Section */}
            <div className="form-group">
              <label className="form-label">How was your experience?</label>
              <div className="rating-container">
                <div className="stars">
                  {renderStars()}
                </div>
                <p className="rating-text">
                  {rating === 0 ? "Select a rating" : 
                   rating === 1 ? "Poor" :
                   rating === 2 ? "Fair" :
                   rating === 3 ? "Good" :
                   rating === 4 ? "Very Good" :
                   "Excellent"}
                </p>
              </div>
            </div>

            {/* Comment Section */}
            <div className="form-group">
              <label className="form-label">Tell us about your experience</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="comment-textarea"
                placeholder="Share your thoughts about the experience. What did you enjoy? What could be improved?"
                rows="5"
                maxLength="1000"
                disabled={isSubmitting}
              />
              <div className="character-count">
                {comment.length}/1000 characters
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="form-group">
              <label className="form-label">Add photos (optional)</label>
              <div className="image-upload-section">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="image-input"
                  id="review-images"
                  disabled={isSubmitting || imageFiles.length >= 2}
                />
                <label 
                  htmlFor="review-images" 
                  className={`image-upload-button ${imageFiles.length >= 2 ? 'disabled' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14.5 4H20.5C21.6 4 22.5 4.9 22.5 6V20C22.5 21.1 21.6 22 20.5 22H3.5C2.4 22 1.5 21.1 1.5 20V6C1.5 4.9 2.4 4 3.5 4H9.5L12 6.5L14.5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6.5V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11L12 14L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {imageFiles.length >= 2 ? 'Maximum 2 photos' : 'Add Photos'}
                </label>
                <p className="image-upload-hint">
                  Upload up to 2 photos ({imageFiles.length}/2)
                </p>
                
                {/* Upload Progress */}
                {isUploadingImages && (
                  <div className="upload-progress">
                    <div className="upload-status">
                      <div className="upload-spinner">
                        <div className="spinner"></div>
                      </div>
                      <div className="upload-info">
                        <p className="upload-title">Uploading to Cloudinary...</p>
                        <p className="upload-subtitle">Please don't close this window</p>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">{uploadProgress}% complete</p>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="image-preview-container">
                  {images.map((imageUrl, index) => {
                    const uploadingImage = uploadingImages.find(img => img.index === index);
                    const isUploading = uploadingImage && uploadingImage.status === 'uploading';
                    const isCompleted = uploadingImage && uploadingImage.status === 'completed';
                    const hasError = uploadingImage && uploadingImage.status === 'error';
                    
                    return (
                      <div key={index} className={`image-preview ${isUploading ? 'uploading' : ''} ${isCompleted ? 'completed' : ''} ${hasError ? 'error' : ''}`}>
                        <Image
                          src={imageUrl}
                          alt={`Review image ${index + 1}`}
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover' }}
                          className="preview-image"
                        />
                        
                        {/* Upload Progress Overlay */}
                        {isUploading && (
                          <div className="image-upload-overlay">
                            <div className="image-upload-spinner">
                              <div className="spinner"></div>
                            </div>
                            <div className="image-upload-progress">
                              <div className="image-progress-bar">
                                <div 
                                  className="image-progress-fill" 
                                  style={{ width: `${uploadingImage.progress}%` }}
                                ></div>
                              </div>
                              <span className="image-progress-text">{uploadingImage.progress}%</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Completed Overlay */}
                        {isCompleted && (
                          <div className="image-completed-overlay">
                            <div className="completed-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        )}
                        
                        {/* Error Overlay */}
                        {hasError && (
                          <div className="image-error-overlay">
                            <div className="error-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="remove-image-btn"
                          disabled={isSubmitting || isUploadingImages}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || isUploadingImages || rating === 0 || !comment.trim()}
              >
                {isUploadingImages ? (
                  <>
                    <div className="spinner"></div>
                    Uploading Images...
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    Submitting Review...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
