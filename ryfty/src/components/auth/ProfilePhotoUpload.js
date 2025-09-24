"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import config from '@/config';

export default function ProfilePhotoUpload({ onPhotoUpload, currentPhoto = null }) {
  const [uploadedPhoto, setUploadedPhoto] = useState(currentPhoto);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadProfilePhoto } = useAuth();

  const validateFile = (file) => {
    // Check file type
    if (!config.upload.allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }

    // Check file size
    if (file.size > config.upload.maxFileSize) {
      return `File size must be less than ${config.upload.maxFileSize / (1024 * 1024)}MB`;
    }

    return null;
  };

  const handleFileUpload = async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadProfilePhoto(file);
      
      if (result.success) {
        setUploadedPhoto(result.url);
        onPhotoUpload(result.url);
      } else {
        alert(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setUploadedPhoto(null);
    onPhotoUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="profile-photo-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={config.upload.allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="file-input-hidden"
        aria-label="Upload profile photo"
      />

      {uploadedPhoto ? (
        <motion.div 
          className="photo-preview"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="photo-container">
            <img src={uploadedPhoto} alt="Profile preview" className="photo-image" />
            <div className="photo-overlay">
              <button
                type="button"
                className="photo-action-button change-button"
                onClick={openFileDialog}
                disabled={isUploading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V8C1 6.89543 1.89543 6 3 6H7L9 4H15L17 6H21C22.1046 6 23 6.89543 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Change
              </button>
              <button
                type="button"
                className="photo-action-button remove-button"
                onClick={removePhoto}
                disabled={isUploading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Remove
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className={`photo-upload-area ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isUploading ? (
            <div className="upload-loading">
              <div className="upload-spinner"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="upload-text">
                <span className="upload-primary">Click to upload</span>
                <span className="upload-secondary">or drag and drop</span>
              </div>
              <div className="upload-hint">
                JPEG, PNG or WebP (max {config.upload.maxFileSize / (1024 * 1024)}MB)
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
