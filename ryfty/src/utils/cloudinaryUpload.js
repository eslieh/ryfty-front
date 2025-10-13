/**
 * Cloudinary upload utility for review images
 * Handles image uploads to Cloudinary with proper error handling and progress tracking
 * 
 * Images are uploaded as-is without any transformations.
 * The images will be compressed locally before upload using the imageCompression utility.
 */

import config from '@/config';

/**
 * Upload an image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} folder - Cloudinary folder (default: 'reviews')
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<string>} - Cloudinary URL of uploaded image
 */
export const uploadToCloudinary = async (file, folder = 'reviews', onProgress = null) => {
  if (!config.upload.cloudinary.cloudName) {
    throw new Error('Cloudinary configuration is missing');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.upload.cloudinary.uploadPreset);
  formData.append('folder', folder);
  formData.append('cloud_name', config.upload.cloudinary.cloudName);

  // Note: No transformations are applied during upload
  // Images are uploaded as-is after local compression

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.upload.cloudinary.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files to upload
 * @param {string} folder - Cloudinary folder (default: 'reviews')
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<string[]>} - Array of Cloudinary URLs
 */
export const uploadMultipleToCloudinary = async (files, folder = 'reviews', onProgress = null) => {
  const uploadPromises = files.map(async (file, index) => {
    try {
      const url = await uploadToCloudinary(file, folder, onProgress);
      if (onProgress) {
        onProgress(index + 1, files.length);
      }
      return url;
    } catch (error) {
      console.error(`Failed to upload image ${index + 1}:`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
};

/**
 * Validate image files for review upload
 * @param {File[]} files - Array of files to validate
 * @param {number} maxFiles - Maximum number of files allowed (default: 2)
 * @param {number} maxSize - Maximum file size per file in bytes (default: 5MB)
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateReviewImages = (files, maxFiles = 2, maxSize = 5 * 1024 * 1024) => {
  if (!files || files.length === 0) {
    return { isValid: true, error: null }; // No images is valid
  }

  if (files.length > maxFiles) {
    return { isValid: false, error: `Maximum ${maxFiles} images allowed` };
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select valid image files only' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: `Image ${i + 1} is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` };
    }

    // Check for supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.type.toLowerCase())) {
      return { isValid: false, error: `Image ${i + 1} format not supported. Please use JPEG, PNG, or WebP` };
    }
  }

  return { isValid: true, error: null };
};
