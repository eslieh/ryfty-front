"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import LocationPicker from '@/components/LocationPicker';
import '@/styles/provider.css';

const Step1 = ({ formData, handleInputChange }) => (
  <motion.div
    className="form-step"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <div className="step-header">
      <h2>Basic Information</h2>
      <p>Tell us about your experience</p>
    </div>

    <div className="form-group">
      <label htmlFor="title">Experience Title *</label>
      <input
        type="text"
        id="title"
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        placeholder="e.g., Sunset Safari Adventure"
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="description">Description *</label>
      <textarea
        id="description"
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        placeholder="Describe your experience in detail..."
        rows={6}
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="status">Status</label>
      <select
        id="status"
        value={formData.status}
        onChange={(e) => handleInputChange('status', e.target.value)}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </div>
  </motion.div>
);

const Step2 = ({ formData, handleArrayInputChange }) => {
  const [newDestination, setNewDestination] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const addDestination = () => {
    if (newDestination.trim()) {
      handleArrayInputChange('destinations', newDestination.trim(), 'add');
      setNewDestination('');
    }
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      handleArrayInputChange('activities', newActivity.trim(), 'add');
      setNewActivity('');
    }
  };

  return (
  <motion.div
    className="form-step"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
      <div className="step-header">
        <h2>Experience Details</h2>
        <p>Where will you go and what will you do?</p>
      </div>

      <div className="form-group">
        <label>Destinations *</label>
        <div className="todo-input">
          <input
            type="text"
            value={newDestination}
            onChange={(e) => setNewDestination(e.target.value)}
            placeholder="Add a destination (e.g., Maasai Mara National Reserve)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addDestination();
              }
            }}
          />
          <button
            type="button"
            onClick={addDestination}
            className="add-btn"
            disabled={!newDestination.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="todo-list">
          {formData.destinations.map((destination, index) => (
            <div key={index} className="todo-item">
              <div className="todo-checkbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="todo-text">{destination}</span>
              <button
                type="button"
                onClick={() => handleArrayInputChange('destinations', destination, 'remove')}
                className="todo-remove"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
          {formData.destinations.length === 0 && (
            <div className="todo-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>No destinations added yet</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Activities *</label>
        <div className="todo-input">
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Add an activity (e.g., Game Drive)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addActivity();
              }
            }}
          />
          <button
            type="button"
            onClick={addActivity}
            className="add-btn"
            disabled={!newActivity.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="todo-list">
          {formData.activities.map((activity, index) => (
            <div key={index} className="todo-item">
              <div className="todo-checkbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="todo-text">{activity}</span>
              <button
                type="button"
                onClick={() => handleArrayInputChange('activities', activity, 'remove')}
                className="todo-remove"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
          {formData.activities.length === 0 && (
            <div className="todo-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>No activities added yet</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Step3 = ({ formData, handleArrayInputChange }) => {
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  const addInclusion = () => {
    if (newInclusion.trim()) {
      handleArrayInputChange('inclusions', newInclusion.trim(), 'add');
      setNewInclusion('');
    }
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      handleArrayInputChange('exclusions', newExclusion.trim(), 'add');
      setNewExclusion('');
    }
  };

  return (
  <motion.div
    className="form-step"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
      <div className="step-header">
        <h2>What&apos;s Included</h2>
        <p>What&apos;s included and excluded from your experience</p>
      </div>

      <div className="form-group">
        <label>Inclusions</label>
        <div className="todo-input">
          <input
            type="text"
            value={newInclusion}
            onChange={(e) => setNewInclusion(e.target.value)}
            placeholder="Add what's included (e.g., Transport)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addInclusion();
              }
            }}
          />
          <button
            type="button"
            onClick={addInclusion}
            className="add-btn"
            disabled={!newInclusion.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="todo-list">
          {formData.inclusions.map((inclusion, index) => (
            <div key={index} className="todo-item">
              <div className="todo-checkbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="todo-text">{inclusion}</span>
              <button
                type="button"
                onClick={() => handleArrayInputChange('inclusions', inclusion, 'remove')}
                className="todo-remove"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
          {formData.inclusions.length === 0 && (
            <div className="todo-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>No inclusions added yet</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Exclusions</label>
        <div className="todo-input">
          <input
            type="text"
            value={newExclusion}
            onChange={(e) => setNewExclusion(e.target.value)}
            placeholder="Add what's excluded (e.g., Park Fees)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addExclusion();
              }
            }}
          />
          <button
            type="button"
            onClick={addExclusion}
            className="add-btn"
            disabled={!newExclusion.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="todo-list">
          {formData.exclusions.map((exclusion, index) => (
            <div key={index} className="todo-item">
              <div className="todo-checkbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="todo-text">{exclusion}</span>
              <button
                type="button"
                onClick={() => handleArrayInputChange('exclusions', exclusion, 'remove')}
                className="todo-remove"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
          {formData.exclusions.length === 0 && (
            <div className="todo-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>No exclusions added yet</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Step4 = ({ formData, handleInputChange, handleArrayInputChange }) => {
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [posterPreview, setPosterPreview] = useState(null);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);

  // Cleanup object URLs when component unmounts or previews change
  useEffect(() => {
    return () => {
      if (posterPreview?.url && posterPreview.url.startsWith('blob:')) {
        URL.revokeObjectURL(posterPreview.url);
      }
      additionalPreviews.forEach(preview => {
        if (preview.url && preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [posterPreview, additionalPreviews]);

  const uploadToCloudinary = async (file) => {
    // Check if this file was already uploaded (prevent duplicates)
    const fileHash = await getFileHash(file);
    const existingImage = formData.images.find(img => img.fileHash === fileHash);
    if (existingImage) {
      console.log('Image already uploaded, skipping duplicate');
      return existingImage.url;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ryfty_images');
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return { url: data.secure_url, fileHash };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  // Simple file hash function to detect duplicates
  const getFileHash = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Simple hash based on file name, size, and last modified
        const hash = `${file.name}_${file.size}_${file.lastModified}`;
        resolve(btoa(hash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16));
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePosterImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Create immediate preview
    const previewUrl = URL.createObjectURL(file);
    setPosterPreview({
      url: previewUrl,
      file: file,
      uploading: true
    });

    setUploadingPoster(true);
    try {
      const uploadResult = await uploadToCloudinary(file);
      const imageUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
      handleInputChange('poster_image_url', imageUrl);
      setPosterPreview({
        url: imageUrl,
        file: file,
        uploading: false
      });
    } catch (error) {
      alert('Failed to upload image. Please try again.');
      setPosterPreview(null);
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleAdditionalImagesUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Create immediate previews for all files
    const newPreviews = files.map((file, index) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} is not a valid image file`);
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`${file.name} is too large (max 5MB)`);
      }

      const previewUrl = URL.createObjectURL(file);
      const previewId = `preview_${Date.now()}_${index}`;
      
      return {
        id: previewId,
        url: previewUrl,
        file: file,
        uploading: true,
        alt: `Experience image ${formData.images.length + index + 1}`
      };
    });

    // Add previews to state
    setAdditionalPreviews(prev => [...prev, ...newPreviews]);
    setUploadingImages(true);

    try {
      // Upload files one by one to show individual progress
      for (let i = 0; i < newPreviews.length; i++) {
        const preview = newPreviews[i];
        try {
          const uploadResult = await uploadToCloudinary(preview.file);
          const imageUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
          const fileHash = typeof uploadResult === 'string' ? null : uploadResult.fileHash;
          
          // Update preview to show completed upload
          setAdditionalPreviews(prev => 
            prev.map(p => 
              p.id === preview.id 
                ? { ...p, url: imageUrl, uploading: false }
                : p
            )
          );

          // Add to form data
          const newImage = {
            url: imageUrl,
            alt: preview.alt,
            publicId: preview.file.name.split('.')[0],
            fileHash: fileHash
          };
          handleArrayInputChange('images', newImage, 'add');

        } catch (error) {
          // Remove failed preview
          setAdditionalPreviews(prev => 
            prev.filter(p => p.id !== preview.id)
          );
          console.error(`Failed to upload ${preview.file.name}:`, error);
        }
      }
    } catch (error) {
      alert(`Failed to upload images: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const openImageViewer = (index) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (selectedImageIndex < formData.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const ImageViewer = () => {
    if (!showImageViewer || selectedImageIndex === null) return null;

    const currentImage = formData.images[selectedImageIndex];

    return (
      <motion.div
        className="image-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeImageViewer}
      >
        <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
          <button className="image-viewer-close" onClick={closeImageViewer}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {formData.images.length > 1 && (
            <>
              <button 
                className="image-viewer-nav image-viewer-prev" 
                onClick={prevImage}
                disabled={selectedImageIndex === 0}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button 
                className="image-viewer-nav image-viewer-next" 
                onClick={nextImage}
                disabled={selectedImageIndex === formData.images.length - 1}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}

          <div className="image-viewer-main">
            <img src={currentImage.url} alt={currentImage.alt} />
            <div className="image-viewer-info">
              <span className="image-counter">
                {selectedImageIndex + 1} of {formData.images.length}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
  <motion.div
    className="form-step"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
      <div className="step-header">
        <h2>Images</h2>
        <p>Add photos to showcase your experience</p>
      </div>

      <div className="form-group">
        <label htmlFor="poster_image">Poster Image *</label>
        <div className="image-upload-section">
          <div className="upload-area">
            <input
              type="file"
              id="poster_image"
              accept="image/*"
              onChange={handlePosterImageUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="poster_image" className="upload-button">
              {uploadingPoster ? (
                <div className="upload-loading">
                  <div className="spinner small"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="upload-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Upload Poster Image</span>
                  <small>Click to select or drag and drop</small>
                </div>
              )}
            </label>
          </div>
          
          {(posterPreview || formData.poster_image_url) && (
            <div className="image-preview-large">
              <img 
                src={posterPreview?.url || formData.poster_image_url} 
                alt="Poster preview" 
              />
              {posterPreview?.uploading && (
                <div className="upload-progress-overlay">
                  <div className="upload-progress-content">
                    <div className="spinner small"></div>
                    <span>Uploading...</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  handleInputChange('poster_image_url', '');
                  setPosterPreview(null);
                }}
                className="remove-image-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Additional Images</label>
        <div className="image-upload-section">
          <div className="upload-area">
            <input
              type="file"
              id="additional_images"
              accept="image/*"
              multiple
              onChange={handleAdditionalImagesUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="additional_images" className="upload-button">
              {uploadingImages ? (
                <div className="upload-loading">
                  <div className="spinner small"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="upload-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Upload Additional Images</span>
                  <small>Select multiple images (max 5MB each)</small>
                </div>
              )}
            </label>
          </div>
          
          {(formData.images.length > 0 || additionalPreviews.length > 0) && (
            <div className="image-grid-enhanced">
              {/* Show uploaded images */}
              {formData.images.map((image, index) => (
                <div key={`uploaded_${index}`} className="image-item-enhanced">
                  <img 
                    src={image.url} 
                    alt={image.alt} 
                    onClick={() => openImageViewer(index)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Use index-based removal for more reliability
                      setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }));
                    }}
                    className="remove-image-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="image-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
              
              {/* Show preview images */}
              {additionalPreviews.map((preview) => (
                <div key={preview.id} className="image-item-enhanced">
                  <img 
                    src={preview.url} 
                    alt={preview.alt}
                  />
                  {preview.uploading && (
                    <div className="upload-progress-overlay">
                      <div className="upload-progress-content">
                        <div className="spinner small"></div>
                        <span>Uploading...</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalPreviews(prev => 
                        prev.filter(p => p.id !== preview.id)
                      );
                    }}
                    className="remove-image-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {!preview.uploading && (
                    <div className="image-overlay">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ImageViewer />
    </motion.div>
  );
};

const Step5 = ({ formData, handleInputChange, handleNestedInputChange }) => {
  const handleLocationChange = (latitude, longitude) => {
    handleNestedInputChange('meeting_point', 'coordinates', {
      latitude,
      longitude
    });
  };

  const handleAddressChange = (address) => {
    handleNestedInputChange('meeting_point', 'address', address);
  };

  return (
    <motion.div
      className="form-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Location & Dates</h2>
        <p>Set your meeting point and experience dates</p>
      </div>

      {/* Location Section */}
      <div className="location-section">
        <h3 className="section-title">📍 Meeting Point Location</h3>
        <p className="section-description">Select the exact location where participants will meet you</p>
        
        <LocationPicker
          latitude={formData.meeting_point.coordinates.latitude}
          longitude={formData.meeting_point.coordinates.longitude}
          onLocationChange={handleLocationChange}
          onAddressChange={handleAddressChange}
        />
      </div>

      {/* Meeting Details Section */}
      <div className="meeting-details-section">
        <h3 className="section-title">📝 Meeting Details</h3>
        
        <div className="form-group">
          <label htmlFor="meeting_point_name">Meeting Point Name *</label>
          <input
            type="text"
            id="meeting_point_name"
            value={formData.meeting_point.name}
            onChange={(e) => handleNestedInputChange('meeting_point', 'name', e.target.value)}
            placeholder="e.g., Nairobi National Park Gate"
            required
          />
          <small className="field-help">Give this location a memorable name for your customers</small>
        </div>

        <div className="form-group">
          <label htmlFor="meeting_point_address">Address *</label>
          <input
            type="text"
            id="meeting_point_address"
            value={formData.meeting_point.address}
            readOnly
            className="readonly-field"
            placeholder="Address will be automatically filled from map selection"
            required
          />
          <small className="field-help">This address is automatically generated from your map selection</small>
        </div>

        <div className="form-group">
          <label htmlFor="meeting_point_instructions">Meeting Instructions</label>
          <textarea
            id="meeting_point_instructions"
            value={formData.meeting_point.instructions}
            onChange={(e) => handleNestedInputChange('meeting_point', 'instructions', e.target.value)}
            placeholder="e.g., Please arrive 30 minutes early. Look for the jeep with our logo. We'll meet at the main entrance."
            rows={3}
          />
          <small className="field-help">Provide specific instructions to help participants find you</small>
        </div>
      </div>

      {/* Experience Dates Section */}
      <div className="dates-section">
        <h3 className="section-title">📅 Experience Dates</h3>
        <p className="section-description">Set when your experience will be available</p>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_date">Start Date *</label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              required
            />
            <small className="field-help">When will your experience become available?</small>
          </div>

          <div className="form-group">
            <label htmlFor="end_date">End Date *</label>
            <input
              type="date"
              id="end_date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              required
            />
            <small className="field-help">When will your experience stop being available?</small>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Step6 = ({ formData, handleSubmit, loading }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Debug: Log image data
  console.log('Preview - Poster Image URL:', formData.poster_image_url);
  console.log('Preview - Gallery Images:', formData.images);

  return (
    <motion.div
      className="form-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="step-header">
        <h2>Preview Your Experience</h2>
        <p>Review all details before submitting your experience</p>
      </div>

      <div className="preview-container">
        {/* Basic Information */}
        <div className="preview-section">
          <h3 className="preview-section-title">📝 Basic Information</h3>
          <div className="preview-content">
            <div className="preview-item">
              <label>Title</label>
              <p>{formData.title || 'Not provided'}</p>
            </div>
            <div className="preview-item">
              <label>Description</label>
              <p>{formData.description || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Destinations & Activities */}
        <div className="preview-section">
          <h3 className="preview-section-title">🗺️ Destinations & Activities</h3>
          <div className="preview-content">
            <div className="preview-item">
              <label>Destinations</label>
              <div className="preview-list">
                {formData.destinations && formData.destinations.length > 0 ? (
                  formData.destinations.map((dest, index) => (
                    <span key={index} className="preview-tag">{dest}</span>
                  ))
                ) : (
                  <p className="preview-empty">No destinations added</p>
                )}
              </div>
            </div>
            <div className="preview-item">
              <label>Activities</label>
              <div className="preview-list">
                {formData.activities && formData.activities.length > 0 ? (
                  formData.activities.map((activity, index) => (
                    <span key={index} className="preview-tag">{activity}</span>
                  ))
                ) : (
                  <p className="preview-empty">No activities added</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="preview-section">
          <h3 className="preview-section-title">✅ What's Included</h3>
          <div className="preview-content">
            <div className="preview-item">
              <label>Inclusions</label>
              <div className="preview-list">
                {formData.inclusions && formData.inclusions.length > 0 ? (
                  formData.inclusions.map((inclusion, index) => (
                    <span key={index} className="preview-tag inclusion">{inclusion}</span>
                  ))
                ) : (
                  <p className="preview-empty">No inclusions added</p>
                )}
              </div>
            </div>
            <div className="preview-item">
              <label>Exclusions</label>
              <div className="preview-list">
                {formData.exclusions && formData.exclusions.length > 0 ? (
                  formData.exclusions.map((exclusion, index) => (
                    <span key={index} className="preview-tag exclusion">{exclusion}</span>
                  ))
                ) : (
                  <p className="preview-empty">No exclusions added</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="preview-section">
          <h3 className="preview-section-title">📸 Images</h3>
          <div className="preview-content">
            <div className="preview-item">
              <label>Poster Image</label>
              {formData.poster_image_url ? (
                <div className="preview-image">
                  <img 
                    src={formData.poster_image_url} 
                    alt="Poster" 
                    onError={(e) => {
                      console.error('Poster image error:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <p className="preview-empty">No poster image uploaded</p>
              )}
            </div>
            <div className="preview-item">
              <label>Gallery Images</label>
              <div className="preview-gallery">
                {formData.images && formData.images.length > 0 ? (
                  formData.images.map((image, index) => (
                    <div key={index} className="preview-image">
                      <img 
                        src={image.url} 
                        alt={image.alt || `Gallery ${index + 1}`} 
                        onError={(e) => {
                          console.error('Gallery image error:', e, image);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="preview-empty">No gallery images uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Dates */}
        <div className="preview-section">
          <h3 className="preview-section-title">📍 Location & Dates</h3>
          <div className="preview-content">
            <div className="preview-item">
              <label>Meeting Point Name</label>
              <p>{formData.meeting_point?.name || 'Not provided'}</p>
            </div>
            <div className="preview-item">
              <label>Address</label>
              <p>{formData.meeting_point?.address || 'Not provided'}</p>
            </div>
            <div className="preview-item">
              <label>Meeting Instructions</label>
              <p>{formData.meeting_point?.instructions || 'No instructions provided'}</p>
            </div>
            <div className="preview-item">
              <label>Coordinates</label>
              <p>
                {formData.meeting_point?.coordinates?.latitude && formData.meeting_point?.coordinates?.longitude 
                  ? `${formData.meeting_point.coordinates.latitude.toFixed(6)}, ${formData.meeting_point.coordinates.longitude.toFixed(6)}`
                  : 'Not set'
                }
              </p>
            </div>
            <div className="preview-item">
              <label>Experience Dates</label>
              <p>
                {formatDate(formData.start_date)} - {formatDate(formData.end_date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-actions">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner small"></div>
              Creating Experience...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create Experience
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const ExperienceForm = ({
  formData, 
  formStep, 
  setFormStep, 
  handleInputChange, 
  handleArrayInputChange,
  handleNestedInputChange,
  handleSubmit,
  loading,
  setCurrentStep 
}) => {
  const totalSteps = 6;

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Title and description' },
    { id: 2, title: 'Details', description: 'Destinations and activities' },
    { id: 3, title: 'What\'s Included', description: 'Inclusions and exclusions' },
    { id: 4, title: 'Images', description: 'Photos and poster image' },
    { id: 5, title: 'Location', description: 'Meeting point and dates' },
    { id: 6, title: 'Preview', description: 'Review and submit' }
  ];

  const nextStep = () => {
    if (formStep < totalSteps) setFormStep(formStep + 1);
  };

  const prevStep = () => {
    if (formStep > 1) setFormStep(formStep - 1);
  };

  const StepIndicator = () => (
    <div className="step-indicator">
      {steps.map((stepItem) => (
        <div
          key={stepItem.id}
          className={`step-item ${formStep >= stepItem.id ? 'active' : ''} ${formStep === stepItem.id ? 'current' : ''}`}
        >
          <div className="step-number">{stepItem.id}</div>
          <div className="step-info">
            <div className="step-title-create">{stepItem.title}</div>
            <div className="step-description">{stepItem.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  let currentStepComponent;
  switch (formStep) {
    case 1: currentStepComponent = <Step1 formData={formData} handleInputChange={handleInputChange} />; break;
    case 2: currentStepComponent = <Step2 formData={formData} handleArrayInputChange={handleArrayInputChange} />; break;
    case 3: currentStepComponent = <Step3 formData={formData} handleArrayInputChange={handleArrayInputChange} />; break;
    case 4: currentStepComponent = <Step4 formData={formData} handleInputChange={handleInputChange} handleArrayInputChange={handleArrayInputChange} />; break;
    case 5: currentStepComponent = <Step5 formData={formData} handleInputChange={handleInputChange} handleNestedInputChange={handleNestedInputChange} />; break;
    case 6: currentStepComponent = <Step6 formData={formData} handleSubmit={handleSubmit} loading={loading} />; break;
    default: currentStepComponent = <Step1 formData={formData} handleInputChange={handleInputChange} />;
  }
  return (
    <div className="experience-form">
      <div className="form-header">
        <button 
          className="btn btn-secondary"
          onClick={() => setCurrentStep('splash')}
        >
          ← Back to Options
        </button>
        <h1>Create Experience</h1>
      </div>

      <StepIndicator />

      <div className="form-content">
        <AnimatePresence mode="wait">
          {currentStepComponent}
        </AnimatePresence>
      </div>

      <div className="form-actions">
        <button 
          className="btn btn-secondary"
          onClick={prevStep}
          disabled={formStep === 1}
        >
          Previous
        </button>
        
        {formStep < totalSteps ? (
          <button 
            className="btn btn-primary"
            onClick={nextStep}
          >
            Next
          </button>
        ) : (
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Experience'}
          </button>
        )}
      </div>
    </div>
  );
};

// After Step5 and before ExperienceForm, add SplashScreen as a separate component:

const SplashScreen = ({ setCurrentStep, router }) => (
  <motion.div
    className="create-splash"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="splash-content">
      <div className="splash-header">
        <h1 className="splash-title">Create New Listing</h1>
        <p className="splash-subtitle">Choose what type of listing you want to create</p>
      </div>

      <div className="listing-options">
        <motion.div
          className="listing-option"
          onClick={() => setCurrentStep('experience')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* ... your existing splash screen content ... */}
        </motion.div>
        {/* ... rest of splash screen ... */}
      </div>
    </div>
  </motion.div>
);

export default function CreateListingPage() {
  const [currentStep, setCurrentStep] = useState('splash'); // splash, experience, services
  const [formStep, setFormStep] = useState(1); // Step within the experience form
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Single form state - optimized to prevent flickering
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destinations: [],
    activities: [],
    inclusions: [],
    exclusions: [],
    images: [],
    poster_image_url: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    meeting_point: {
      name: '',
      address: '',
      coordinates: {
        latitude: null,
        longitude: null
      },
      instructions: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, isProvider } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
 



  // Input handlers - use functional updates to prevent unnecessary re-renders
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      // Only update if value actually changed to prevent unnecessary re-renders
      if (prev[field] === value) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const handleNestedInputChange = useCallback((parent, field, value) => {
    setFormData(prev => {
      // Only update if value actually changed to prevent unnecessary re-renders
      if (prev[parent][field] === value) return prev;
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value
        }
      };
    });
  }, []);

  const handleArrayInputChange = useCallback((field, value, action = 'add') => {
    setFormData(prev => {
      if (action === 'add') {
        let exists = false;
        
        if (field === 'images' && typeof value === 'object') {
          // For images, check by URL
          exists = prev[field].some(item => item.url === value.url);
        } else {
          exists = prev[field].includes(value);
        }
        
        if (exists) return prev;
        return {
          ...prev,
          [field]: [...prev[field], value]
        };
      } else {
        let filtered;
        
        if (field === 'images' && typeof value === 'object') {
          // For images, filter by URL
          filtered = prev[field].filter(item => item.url !== value.url);
        } else {
          filtered = prev[field].filter(item => item !== value);
        }
        
        if (filtered.length === prev[field].length) return prev;
        return {
          ...prev,
          [field]: filtered
        };
      }
    });
  }, []);


  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Import the API function
      const { createExperience } = await import('@/utils/api');
      
      // Prepare the data for API submission
      const experienceData = {
        title: formData.title,
        description: formData.description,
        destinations: formData.destinations,
        activities: formData.activities,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        poster_image_url: formData.poster_image_url,
        images: formData.images || [],
        meeting_point: {
          name: formData.meeting_point.name,
          address: formData.meeting_point.address,
          instructions: formData.meeting_point.instructions,
          coordinates: {
            latitude: parseFloat(formData.meeting_point.coordinates.latitude),
            longitude: parseFloat(formData.meeting_point.coordinates.longitude)
          }
        }
      };
        console.log('Experience data being sent:', experienceData);

        // Make API call using the utility function (sends as JSON)
      const result = await createExperience(experienceData);
      console.log('Experience created successfully:', result);
      
      // Show success modal with slot creation instructions
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating experience:', error);
      alert('Failed to create experience. Please try again.');
    } finally {
      setLoading(false);
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


  const SplashScreen = () => (
    <motion.div
      className="create-splash"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="splash-content">
        <div className="splash-header">
          <h1 className="splash-title">Create New Listing</h1>
          <p className="splash-subtitle">Choose what type of listing you want to create</p>
        </div>

        <div className="listing-options">
          <motion.div
            className="listing-option"
            onClick={() => setCurrentStep('experience')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="option-title">Experience</h3>
            <p className="option-description">
              Create guided tours, activities, and immersive experiences for travelers
            </p>
            <div className="option-features">
              <span className="feature-tag">Tours</span>
              <span className="feature-tag">Activities</span>
              <span className="feature-tag">Adventures</span>
            </div>
          </motion.div>

          <motion.div
            className="listing-option coming-soon"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M3 3H21L19 21H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="option-title">Services</h3>
            <p className="option-description">
              Offer transportation, photography, catering, and other support services
            </p>
            <div className="coming-soon-badge">Coming Soon</div>
            <div className="option-features">
              <span className="feature-tag">Transport</span>
              <span className="feature-tag">Photography</span>
              <span className="feature-tag">Catering</span>
            </div>
          </motion.div>
        </div>

        <div className="splash-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/provider/listings')}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );

  

  // Success Modal Component
  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <motion.div
        className="success-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowSuccessModal(false)}
      >
        <motion.div
          className="success-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="success-title">Experience Created Successfully! 🎉</h2>
          
          <div className="success-message">
            <p><strong>Next step:</strong> Create time slots for your experience so customers can book from them.</p>
            
            <div className="success-steps">
              <h4>To enable bookings:</h4>
              <ul>
                <li>Go to your listings page</li>
                <li>Click "Manage" on your new experience</li>
                <li>Add available time slots</li>
                <li>Set pricing and capacity</li>
              </ul>
            </div>
            
            <p className="success-note">This will allow customers to book your experience!</p>
          </div>
          
          <div className="success-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/provider/listings');
              }}
            >
              Go to Listings
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
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

          <AnimatePresence mode="wait">
            {currentStep === 'splash' && (
              <ExperienceForm
                key="experience"
                formData={formData}
                formStep={formStep}
                setFormStep={setFormStep}
                handleInputChange={handleInputChange}
                handleArrayInputChange={handleArrayInputChange}
                handleNestedInputChange={handleNestedInputChange}
                handleSubmit={handleSubmit}
                loading={loading}
                setCurrentStep={setCurrentStep}
              />
            )}
          </AnimatePresence>
          </div>
        </motion.main>
      </div>

      <SuccessModal />
    </div>
  );
}
