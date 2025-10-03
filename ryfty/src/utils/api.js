import config from '../config';
import { getAuthToken } from './authStorage';

/**
 * Base API utility function
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response
 */
export const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = `${config.api.baseUrl}${endpoint}`;
  
  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

/**
 * Fetch experiences from the backend
 * @param {string} search - Optional search query
 * @returns {Promise<Object>} - Experiences data
 */
export const fetchExperiences = async (search = '') => {
  const endpoint = search 
    ? `/public/experiences?search=${encodeURIComponent(search)}`
    : '/public/experiences';
    
  return await apiCall(endpoint);
};

/**
 * Fetch a single experience by ID
 * @param {string} id - Experience ID
 * @returns {Promise<Object>} - Experience data
 */
export const fetchExperience = async (id) => {
  return await apiCall(`/public/experiences/${id}`);
};
