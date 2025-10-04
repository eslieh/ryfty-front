"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile, updateUserProfile } from "@/utils/api";
import config from "@/config";
import "@/styles/profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, setUserData, logout, isProvider } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar_url: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const fileInputRef = useRef(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, router]);

  // Initialize profile data from AuthContext
  useEffect(() => {
    if (user) {
      setProfileData(user);
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  // Pull to refresh functionality
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 100));
      setIsPulling(distance > 50);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    if (isPulling) {
      await refreshProfileData();
    }
    
    setPullDistance(0);
    setIsPulling(false);
  };

  // Refresh profile data from API
  const refreshProfileData = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      const response = await fetchUserProfile();
      console.log('Profile refresh response:', response);
      
      if (response.user) {
        setProfileData(response.user);
        setFormData({
          name: response.user.name || '',
          bio: response.user.bio || '',
          avatar_url: response.user.avatar_url || ''
        });
        
        // Update AuthContext with fresh data
        setUserData(response.user);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError('Failed to refresh profile data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Image compression function - returns compressed blob
  const compressImage = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('Image compressed:', {
                  originalSize: file.size,
                  compressedSize: blob.size,
                  compressionRatio: Math.round(((file.size - blob.size) / file.size) * 100) + '%'
                });
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle avatar upload with compression and Cloudinary upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(`Please select a valid image file. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`);
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      // Compress image locally
      console.log('Compressing image locally...');
      const compressedBase64 = await compressImage(file, 400, 0.8);
      
      // Convert base64 to blob with proper MIME type
      let compressedBlob;
      try {
        // Method 1: Manual conversion
        const byteCharacters = atob(compressedBase64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        compressedBlob = new Blob([byteArray], { type: 'image/jpeg' });
      } catch (conversionError) {
        console.warn('Manual conversion failed, trying fetch method:', conversionError);
        // Method 2: Fetch method as fallback
        const response = await fetch(compressedBase64);
        compressedBlob = await response.blob();
      }
      
      console.log('Compression complete. Original size:', file.size, 'Compressed size:', compressedBlob.size);
      console.log('Blob type:', compressedBlob.type, 'Blob size:', compressedBlob.size);

      // Upload to Cloudinary
      if (!config.upload.cloudinary.cloudName || !config.upload.cloudinary.uploadPreset) {
        throw new Error('Cloudinary configuration missing');
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', compressedBlob, 'avatar.jpg');
      uploadFormData.append('upload_preset', config.upload.cloudinary.uploadPreset);
      uploadFormData.append('folder', 'avatars');

      console.log('Uploading to Cloudinary...', {
        cloudName: config.upload.cloudinary.cloudName,
        uploadPreset: config.upload.cloudinary.uploadPreset,
        blobType: compressedBlob.type,
        blobSize: compressedBlob.size
      });

      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.upload.cloudinary.cloudName}/image/upload`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();
      console.log('Upload successful:', result);
      
      if (!result.secure_url) {
        throw new Error('No secure URL returned from Cloudinary');
      }
      
      // Apply transformations to the URL for avatar display
      const transformedUrl = applyAvatarTransformations(result.secure_url);
      
      // Update form data with Cloudinary URL
      setFormData(prev => ({
        ...prev,
        avatar_url: transformedUrl
      }));
      
      console.log('Avatar uploaded to Cloudinary successfully:', transformedUrl);
      
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(`Failed to upload avatar: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  // Apply avatar transformations
  const applyAvatarTransformations = (url) => {
    if (!url.includes('cloudinary.com')) return url;
    
    const baseUrl = url.split('/upload/')[0];
    const publicId = url.split('/upload/')[1];
    
    return `${baseUrl}/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/${publicId}`;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Handle save profile
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await updateUserProfile(formData);
      console.log('Profile update response:', response);
      
      // Update local state with form data
      setProfileData(prev => ({
        ...prev,
        name: formData.name,
        bio: formData.bio,
        avatar_url: formData.avatar_url
      }));
      
      // Update AuthContext
      setUserData({
        ...user,
        name: formData.name,
        bio: formData.bio,
        avatar_url: formData.avatar_url
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      name: profileData?.name || '',
      bio: profileData?.bio || '',
      avatar_url: profileData?.avatar_url || ''
    });
    setIsEditing(false);
    setError(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="profile-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div 
        className="profile-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        <AnimatePresence>
          {(isPulling || isRefreshing) && (
            <motion.div 
              className="pull-refresh-indicator"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              style={{ transform: `translateY(${pullDistance}px)` }}
            >
              <div className="refresh-icon">
                {isRefreshing ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12A9 9 0 0 1 12 3A9 9 0 0 1 21 12M21 12A9 9 0 0 1 12 21A9 9 0 0 1 3 12M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span>{isRefreshing ? 'Refreshing...' : 'Pull to refresh'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <motion.div 
          className="profile-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account settings</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              {formData.avatar_url ? (
                <NextImage
                  src={formData.avatar_url}
                  alt={formData.name || 'Profile'}
                  width={120}
                  height={120}
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              
              {/* Upload Overlay - Always visible when editing */}
              {isEditing && (
                <div 
                  className="avatar-upload-overlay"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="avatar-upload-input"
                  />
                  <div className="upload-content">
                    {uploadingAvatar ? (
                      <div className="upload-loading">
                        <div className="loading-spinner"></div>
                        <span className="upload-text">Uploading...</span>
                      </div>
                    ) : (
                      <div className="upload-prompt">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="upload-icon">
                          <path d="M14.5 4H20C20.5523 4 21 4.44772 21 5V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V5C3 4.44772 3.44772 4 4 4H9.5M14.5 4V2C14.5 1.44772 14.0523 1 13.5 1H10.5C9.94772 1 9.5 1.44772 9.5 2V4M14.5 4H9.5M9 12L12 9L15 12M12 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="upload-text">Change Photo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="avatar-info">
              <h2 className="profile-name">{formData.name || 'No name set'}</h2>
              <p className="profile-email">{profileData.email}</p>
              <p className="profile-role">{profileData.role}</p>
            
            </div>
          </div>

          {/* Profile Menu */}
          <div className="profile-menu">
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio" className="form-label">Bio</label>
                  <textarea
                    id="bio"
                    className="form-textarea"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>

                {error && (
                  <div className="form-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="loading-spinner"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="menu-items">
                {/* Menu Items */}
                <div className="menu-section">
                  <button className="menu-item" onClick={() => setIsEditing(true)}>
                    <div className="menu-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="menu-text">Account settings</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="menu-arrow">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <button className="menu-item" onClick={() => setIsEditing(true)}>
                    <div className="menu-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="menu-text">View profile</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="menu-arrow">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <button className="menu-item">
                    <div className="menu-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="menu-text">Privacy</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="menu-arrow">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <button className="menu-item">
                    <div className="menu-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91494 12.4272 7.02451C13.1255 7.13408 13.7588 7.48223 14.2151 8.00001C14.6713 8.51779 14.9211 9.16936 14.92 9.84C14.92 12 12.92 13.5 12 13.5C11.08 13.5 9.08 12 9.08 9.84C9.08 9.28 9.08 9 9.09 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="menu-text">Get help</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="menu-arrow">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Separator */}
                <div className="menu-separator"></div>

                {/* Additional Menu Items */}
                <div className="menu-section">
                  <button className="menu-item">
                    <div className="menu-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15C10.9391 15 9.92172 15.4214 9.17157 16.1716C8.42143 16.9217 8 17.9391 8 19V21M12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 12L18 8M22 12L18 16M22 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="menu-text">Refer a friend</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="menu-arrow">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <button className="menu-item">
                    <div className="menu-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M9 7C11.2091 7 13 8.79086 13 11C13 13.2091 11.2091 15 9 15C6.79086 15 5 13.2091 5 11C5 8.79086 6.79086 7 9 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M23 21V19C23 17.9391 22.5786 16.9217 21.8284 16.1716C21.0783 15.4214 20.0609 15 19 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="menu-text">Find experiences</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="menu-arrow">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  {!isProvider() && (
                    <button 
                      className="btn btn-primary btn-become-provider"
                      onClick={() => router.push('/provider')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Become an Experience Provider
                    </button>
                  )}

                  <button 
                    className="btn btn-logout"
                    onClick={handleLogout}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
