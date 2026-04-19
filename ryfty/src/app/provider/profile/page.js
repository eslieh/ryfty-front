"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile } from "@/utils/api";
import { compressImageWithPreset, validateImageFile } from '@/utils/imageCompression';
import config from "@/config";
import '@/styles/provider.css';
import '@/styles/profile.css';

export default function ProviderProfile() {
  const router = useRouter();
  const { isAuthenticated, user, updateProfile, logout, isProvider, switchRole } = useAuth();
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

  // Redirect if not authenticated or not a provider
 

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
        await updateProfile(response.user);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError('Failed to refresh profile data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Apply avatar transformations
  const applyAvatarTransformations = (url) => {
    if (!url.includes('cloudinary.com')) return url;
    
    const baseUrl = url.split('/upload/')[0];
    const publicId = url.split('/upload/')[1];
    
    return `${baseUrl}/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/${publicId}`;
  };

  // Handle avatar upload with compression and Cloudinary upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.type, file.size);

    // Validate file using utility function
    const validation = validateImageFile(file, 10 * 1024 * 1024); // 10MB limit
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      // Compress image locally using utility
      console.log('Compressing image locally...');
      const compressedBlob = await compressImageWithPreset(file, 'avatar');
      
      console.log('Compression complete. Original size:', file.size, 'Compressed size:', compressedBlob.size);

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
      
      // Update user context immediately
      await updateProfile({ avatar_url: transformedUrl });
      
      console.log('Avatar uploaded to Cloudinary successfully:', transformedUrl);
      
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(`Failed to upload avatar: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  // Handle save profile
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Use AuthContext's updateProfile which handles API call and localStorage sync
      const result = await updateProfile({
        name: formData.name,
        bio: formData.bio,
        avatar_url: formData.avatar_url
      });
      
      if (result.success) {
        console.log('Profile updated successfully:', result.user);
        
        // Update local state with the returned user data
        setProfileData(result.user);
        setFormData({
          name: result.user.name || '',
          bio: result.user.bio || '',
          avatar_url: result.user.avatar_url || ''
        });
        
        setIsEditing(false);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
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

  // Handle role switching
  const handleRoleSwitch = async () => {
    router.push('/')
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

  if (!isAuthenticated || !isProvider()) {
    return null; // Will redirect
  }

  if (!profileData) {
    return (
      <div className="provider-main-page">
        <ProviderHeader variant="main" />
        <div className="provider-layout-content">
          <TabNavigation className="provider-left-nav" orientation="vertical" />
          <div className="provider-main-content">
            <div className="profile-container">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
              </div>
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
        <TabNavigation className="provider-left-nav" orientation="vertical" />

        <div 
          className="provider-main-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="profile-layout-container provider-profile-layout">
            {/* Internal Profile Sidebar - Identity & Navigation */}
            <aside className="profile-sidebar provider-profile-sidebar">
              <div className="user-brief">
                <div className="avatar-edit-section" style={{ position: 'relative' }}>
                  <div className="avatar-wrapper" style={{ width: '64px', height: '64px', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                    <NextImage
                      src={formData.avatar_url || "/placeholder-avatar.jpg"}
                      alt={formData.name || 'Profile'}
                      width={64}
                      height={64}
                      className="sidebar-avatar"
                    />
                    <div className="avatar-overlay-mini" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M23 4H19V2H5V4H1V22H23V4ZM12 18C8.685 18 6 15.315 6 12C6 8.685 8.685 6 12 6C15.315 6 18 8.685 18 12C18 15.315 15.315 18 12 18Z"/></svg>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                </div>
                
                <div className="user-identity">
                  <h2>{formData.name || 'Set Name'}</h2>
                  <p>{profileData.email}</p>
                </div>

                <button 
                  className="change-avatar-btn" 
                  onClick={() => fileInputRef.current.click()}
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
                >
                  {uploadingAvatar ? "..." : "Change photo"}
                </button>
              </div>

              <nav className="sidebar-nav">
                <button className="nav-item-p active">
                  <div className="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"/></svg>
                  </div>
                  <span>About me</span>
                </button>
              </nav>

              <div className="sidebar-actions-group" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  className="switch-role-btn"
                  onClick={handleRoleSwitch}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '12px' }}
                >
                  <div className="nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/></svg>
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>Switch to Customer</span>
                </button>
                
                <button 
                  onClick={handleLogout} 
                  className="sidebar-logout"
                  style={{ textAlign: 'center', fontSize: '0.85rem', padding: '0.5rem', borderTop: 'none', color: '#64748b' }}
                >
                  Logout
                </button>
              </div>
            </aside>

            {/* Internal Profile Content */}
            <main className="profile-main">
              <AnimatePresence mode="wait">
                <motion.div
                  key="about"
                  className="tab-content about-me"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="about-me-card" style={{ gap: '2rem' }}>
                    <div className="form-section" style={{ width: '100%', maxWidth: '100%' }}>
                      <div className="profile-form" style={{ maxWidth: '600px' }}>
                        <div className="field-group">
                          <label>Display Name</label>
                          <input
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="Your name"
                          />
                        </div>
                        <div className="field-group">
                          <label>Short Bio</label>
                          <textarea
                            value={formData.bio}
                            onChange={(e) => handleInputChange("bio", e.target.value)}
                            placeholder="Tell others about yourself"
                            rows={5}
                          />
                        </div>

                        {error && (
                          <div className="form-error" style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '1rem' }}>
                            {error}
                          </div>
                        )}

                        <button
                          className="save-btn"
                          onClick={handleSave}
                          disabled={saving}
                          style={{ background: '#00915a', color: 'white' }}
                        >
                          {saving ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
