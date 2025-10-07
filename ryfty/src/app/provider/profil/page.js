"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { setUserData } from '@/utils/authStorage';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { fetchUserProfile, updateUserProfile } from '@/utils/api';
import { compressImageWithPreset, validateImageFile } from '@/utils/imageCompression';
import config from '@/config';
import '@/styles/provider.css';
import '@/styles/profile.css';

export default function ProviderProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar_url: ''
  });
  
  const { isAuthenticated, user, isProvider, updateProfile } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a provider
 

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !isProvider()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchUserProfile();
        setProfileData(response);
        setFormData({
          name: response.user.name || '',
          bio: response.user.bio || '',
          avatar_url: response.user.avatar_url || ''
        });
        
        // Debug: Log configuration
        console.log('Cloudinary config:', {
          cloudName: config.upload.cloudinary.cloudName,
          uploadPreset: config.upload.cloudinary.uploadPreset,
          allowedTypes: config.upload.allowedTypes,
          maxFileSize: config.upload.maxFileSize
        });
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isProvider]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAuthContextUser = (updatedData) => {
    // Update stored user data
    const updatedUser = {
      ...user,
      ...updatedData
    };
    setUserData(updatedUser);
    console.log('AuthContext user data updated:', updatedUser);
  };

  const handleFallbackUpload = async (file) => {
    setUploadingAvatar(true);
    
    try {
      // Convert file to base64 for testing
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64 = e.target.result;
        console.log('Fallback upload successful (base64)');
        handleInputChange('avatar_url', base64);
        setUploadingAvatar(false);
      };
      
      reader.onerror = () => {
        console.error('Failed to read file');
        alert('Failed to process image file');
        setUploadingAvatar(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('Fallback upload error:', err);
      alert('Failed to process image file');
      setUploadingAvatar(false);
    }
  };

  const applyAvatarTransformations = (url) => {
    // Apply transformations for avatar display
    // Format: https://res.cloudinary.com/cloud_name/image/upload/transformations/public_id
    const transformations = 'w_300,h_300,c_fill,q_auto,f_auto';
    
    // Check if URL already has transformations
    if (url.includes('/upload/')) {
      // Insert transformations after /upload/
      return url.replace('/upload/', `/upload/${transformations}/`);
    }
    
    return url;
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.type, file.size);

    // Validate file using utility function
    const validation = validateImageFile(file, config.upload.maxFileSize);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    // Check if Cloudinary is configured
    if (!config.upload.cloudinary.cloudName || !config.upload.cloudinary.uploadPreset) {
      console.warn('Cloudinary not configured, using fallback method');
      // Fallback: Convert to base64 for testing
      await handleFallbackUpload(file);
      return;
    }

    setUploadingAvatar(true);

    try {
      // Compress image locally before upload
      console.log('Compressing avatar image locally...');
      const compressedBlob = await compressImageWithPreset(file, 'avatar');
      
      // Create FormData for Cloudinary upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', compressedBlob, 'avatar.jpg');
      uploadFormData.append('upload_preset', config.upload.cloudinary.uploadPreset);
      uploadFormData.append('folder', 'avatars');
      
      console.log('Uploading compressed avatar to Cloudinary:', {
        cloudName: config.upload.cloudinary.cloudName,
        uploadPreset: config.upload.cloudinary.uploadPreset,
        originalSize: file.size,
        compressedSize: compressedBlob.size
      });

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.upload.cloudinary.cloudName}/image/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFormData
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      if (!result.secure_url) {
        throw new Error('No secure URL returned from Cloudinary');
      }
      
      // Apply transformations to the URL for avatar display
      const transformedUrl = applyAvatarTransformations(result.secure_url);
      
      // Update form data with transformed avatar URL
      handleInputChange('avatar_url', transformedUrl);
      
      // Show success message
      console.log('Avatar uploaded successfully:', transformedUrl);
      
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert(`Failed to upload avatar: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await updateUserProfile(formData);
      console.log('Profile update response:', response);
      
      // Since the PUT response only contains success message, update profileData with formData
      // Alternative approach: Fetch user data again
      // const updatedProfile = await fetchUserProfile();
      // setProfileData(updatedProfile);
      
      // Current approach: Update DOM directly with form data
      setProfileData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          name: formData.name,
          bio: formData.bio,
          avatar_url: formData.avatar_url
        }
      }));
      
      // Also update AuthContext so changes are reflected throughout the app
      updateAuthContextUser({
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

  const handleCancel = () => {
    setFormData({
      name: profileData.user.name || '',
      bio: profileData.user.bio || '',
      avatar_url: profileData.user.avatar_url || ''
    });
    setIsEditing(false);
    setError(null);
  };

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
            <div className="profile-loading">
              <div className="spinner large"></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
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
              <h3 className="error-title">Failed to Load Profile</h3>
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
            <div className="profile-header">
              <h1 className="page-title">Profile Settings</h1>
              <p className="page-subtitle">
                Manage your personal information and profile
              </p>
            </div>

            {/* Profile Card */}
            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="profile-content">
                {/* Avatar Section */}
                <div className="avatar-section">
                  <div className="avatar-container">
                    {formData.avatar_url ? (
                      <img 
                        src={formData.avatar_url} 
                        alt="Profile Avatar" 
                        className="profile-avatar"
                      />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="avatar-upload-overlay">
                        <input
                          type="file"
                          accept={config.upload.allowedTypes.join(',')}
                          onChange={handleAvatarUpload}
                          className="avatar-upload-input"
                          id="avatar-upload"
                          disabled={uploadingAvatar}
                        />
                        <label htmlFor="avatar-upload" className="avatar-upload-btn">
                          {uploadingAvatar ? (
                            <div className="spinner small"></div>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V5C1 3.9 1.9 3 3 3H7L9 1H15L17 3H21C22.1 3 23 3.9 23 5V19ZM12 8C9.8 8 8 9.8 8 12S9.8 16 12 16S16 14.2 16 12S14.2 8 12 8Z" fill="currentColor"/>
                            </svg>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="avatar-help">
                      <p>Click the camera icon to upload a new profile picture</p>
                      {uploadingAvatar && (
                        <div className="upload-status">
                          <div className="spinner small"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <div className="profile-details">
                  {isEditing ? (
                    <div className="profile-form">
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          className="form-input"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="bio" className="form-label">Bio</label>
                        <textarea
                          id="bio"
                          className="form-textarea"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows="4"
                        />
                        <div className="form-help">
                          Share a brief description about yourself and your experiences
                        </div>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="form-error">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {error}
                        </div>
                      )}

                      {/* Form Actions */}
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <div className="spinner small"></div>
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-info">
                      <div className="profile-info-item">
                        <span className="info-label">Name</span>
                        <span className="info-value">{profileData.user.name || 'Not set'}</span>
                      </div>
                      
                      <div className="profile-info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{profileData.user.email}</span>
                      </div>
                      
                      <div className="profile-info-item">
                        <span className="info-label">Role</span>
                        <span className="info-value capitalize">{profileData.user.role}</span>
                      </div>
                      
                      <div className="profile-info-item">
                        <span className="info-label">Bio</span>
                        <span className="info-value">
                          {profileData.user.bio || 'No bio added yet'}
                        </span>
                      </div>

                      <div className="profile-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => setIsEditing(true)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
