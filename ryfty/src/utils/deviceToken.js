// Device Token Management Utilities

const DEVICE_TOKEN_KEY = 'ryfty_device_token';
const DEVICE_INFO_KEY = 'ryfty_device_info';

/**
 * Save device token to localStorage
 * @param {string} token - Device token
 * @param {Object} deviceInfo - Device information
 */
export const saveDeviceToken = (token, deviceInfo) => {
  try {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
    console.log('Device token saved to localStorage');
  } catch (error) {
    console.error('Failed to save device token:', error);
  }
};

/**
 * Get device token from localStorage
 * @returns {string|null} - Device token or null if not found
 */
export const getDeviceToken = () => {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get device token:', error);
    return null;
  }
};

/**
 * Get device info from localStorage
 * @returns {Object|null} - Device info or null if not found
 */
export const getDeviceInfo = () => {
  try {
    const deviceInfo = localStorage.getItem(DEVICE_INFO_KEY);
    return deviceInfo ? JSON.parse(deviceInfo) : null;
  } catch (error) {
    console.error('Failed to get device info:', error);
    return null;
  }
};

/**
 * Remove device token from localStorage
 */
export const removeDeviceToken = () => {
  try {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    localStorage.removeItem(DEVICE_INFO_KEY);
    console.log('Device token removed from localStorage');
  } catch (error) {
    console.error('Failed to remove device token:', error);
  }
};

/**
 * Check if device token exists in localStorage
 * @returns {boolean} - True if token exists
 */
export const hasDeviceToken = () => {
  return getDeviceToken() !== null;
};

/**
 * Check if device token is expired (basic JWT expiration check)
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true; // Assume expired if we can't parse
  }
};
