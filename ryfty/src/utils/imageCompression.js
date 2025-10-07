/**
 * Image compression utility for local compression before upload
 * Compresses images locally to reduce file size and improve upload performance
 */

/**
 * Compress an image file locally using canvas
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width for the compressed image (default: 1200)
 * @param {number} quality - Compression quality 0-1 (default: 0.8)
 * @param {string} outputFormat - Output format ('image/jpeg', 'image/png', 'image/webp')
 * @returns {Promise<Blob>} - Compressed image as blob
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.8, outputFormat = 'image/jpeg') => {
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
                compressionRatio: Math.round(((file.size - blob.size) / file.size) * 100) + '%',
                originalDimensions: `${img.naturalWidth}x${img.naturalHeight}`,
                compressedDimensions: `${width}x${height}`
              });
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          outputFormat,
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

/**
 * Compress image with different presets for different use cases
 * @param {File} file - The image file to compress
 * @param {string} preset - Compression preset ('avatar', 'poster', 'gallery', 'thumbnail')
 * @returns {Promise<Blob>} - Compressed image as blob
 */
export const compressImageWithPreset = (file, preset = 'gallery') => {
  const presets = {
    avatar: { maxWidth: 400, quality: 0.8, format: 'image/jpeg' },
    poster: { maxWidth: 1200, quality: 0.85, format: 'image/jpeg' },
    gallery: { maxWidth: 1000, quality: 0.8, format: 'image/jpeg' },
    thumbnail: { maxWidth: 300, quality: 0.7, format: 'image/jpeg' }
  };
  
  const config = presets[preset] || presets.gallery;
  return compressImage(file, config.maxWidth, config.quality, config.format);
};

/**
 * Validate image file before compression
 * @param {File} file - The file to validate
 * @param {number} maxSize - Maximum file size in bytes (default: 5MB)
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: `Image size should be less than ${Math.round(maxSize / (1024 * 1024))}MB` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Create a file hash for duplicate detection
 * @param {File} file - The file to hash
 * @returns {Promise<string>} - File hash
 */
export const getFileHash = async (file) => {
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
