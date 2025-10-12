import config from '../config';
import { getAuthToken } from './authStorage';
import { getDeviceToken } from './deviceToken';

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

  // Use localhost if forceLocalhost is enabled, otherwise use configured baseUrl
  const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
  const url = `${baseUrl}${endpoint}`;
  
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
export const createExperience = async (experienceData) => {
  try {
    const token = getAuthToken();
    
    const headers = {};
    
    // Add auth header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (!(experienceData instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    console.log('Experience data:', experienceData);
    const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
    const response = await fetch(`${baseUrl}/experiences`, {
      method: 'POST',
      headers,
      body: JSON.stringify(experienceData),
    });
    console.log('Response:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating experience:', error);
    throw error;
  }
};

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

/**
 * Fetch a single experience by ID (requires authentication)
 * @param {string} id - Experience ID
 * @returns {Promise<Object>} - Experience data
 */
export const fetchProviderExperience = async (id) => {
  return await apiCall(`/experiences/${id}`);
};

/**
 * Update an experience (requires authentication)
 * @param {string} id - Experience ID
 * @param {Object} data - Experience data to update
 * @returns {Promise<Object>} - Updated experience data
 */
export const updateExperience = async (id, data) => {
  return await apiCall(`/experiences/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

/**
 * Fetch reservations for a specific experience (requires authentication)
 * @param {string} experienceId - Experience ID
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 10)
 * @returns {Promise<Object>} - Reservations data with pagination
 */
export const fetchExperienceReservations = async (experienceId, page = 1, perPage = 10) => {
  return await apiCall(`/provider/reservations/${experienceId}?page=${page}&per_page=${perPage}`);
};


/**
 * Fetch slots for a specific experience (requires authentication)
 * @param {string} experienceId - Experience ID
 * @param {number} page - Page number (default: 1)
 * @param {Object} filters - Filter options (start_date, end_date, sort)
 * @returns {Promise<Object>} - Slots data with pagination
 */
export const fetchExperienceSlots = async (experienceId, page = 1, filters = {}, perPage = 20) => {
  const params = new URLSearchParams();
  
  // Add pagination
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  
  // Add filters
  if (filters.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters.end_date) {
    params.append('end_date', filters.end_date);
  }
  if (filters.sort) {
    params.append('sort', filters.sort);
  }
  
  const queryString = params.toString();
  const url = `/experiences/${experienceId}/slots${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(url);
};

/**
 * Create a new slot for an experience (requires authentication)
 * @param {string} experienceId - Experience ID
 * @param {Object} slotData - Slot data
 * @returns {Promise<Object>} - Created slot data
 */
export const createSlot = async (experienceId, slotData) => {
  console.log('Creating slot:', slotData);
  return await apiCall(`/experiences/${experienceId}/slots`, {
    method: 'POST',
    body: JSON.stringify(slotData)
  });
};

/**
 * Update a slot (requires authentication)
 * @param {string} slotId - Slot ID
 * @param {Object} slotData - Updated slot data
 * @returns {Promise<Object>} - Updated slot data
 */
export const updateSlot = async (slotId, slotData) => {
  return await apiCall(`/slots/${slotId}`, {
    method: 'PATCH',
    body: JSON.stringify(slotData)
  });
};

/**
 * Delete a slot (requires authentication)
 * @param {string} slotId - Slot ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteSlot = async (slotId) => {
  return await apiCall(`/slots/${slotId}`, {
    method: 'DELETE'
  });
};

/**
 * Fetch wallet data (requires authentication)
 * @returns {Promise<Object>} - Wallet data including balance, payment methods, settlements, and refunds
 */
export const fetchWalletData = async () => {
  return await apiCall('/wallet');
};

/**
 * Create a new payment method (requires authentication)
 * @param {Object} paymentData - Payment method data
 * @returns {Promise<Object>} - Created payment method data
 */
export const createPaymentMethod = async (paymentData) => {
  return await apiCall('/wallet/payment-method', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

/**
 * Update an existing payment method (requires authentication)
 * @param {string} methodId - Payment method ID
 * @param {Object} paymentData - Updated payment method data
 * @returns {Promise<Object>} - Updated payment method data
 */
export const updatePaymentMethod = async (methodId, paymentData) => {
  return await apiCall(`/wallet/payment-method/${methodId}`, {
    method: 'PUT',
    body: JSON.stringify(paymentData)
  });
};

/**
 * Delete a payment method (requires authentication)
 * @param {string} methodId - Payment method ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deletePaymentMethod = async (methodId) => {
  return await apiCall(`/wallet/payment-method/${methodId}`, {
    method: 'DELETE'
  });
};

/**
 * Initiate a withdrawal (requires authentication)
 * @param {number} amount - Amount to withdraw
 * @returns {Promise<Object>} - Withdrawal response
 */
export const initiateWithdrawal = async (amount) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
  const response = await fetch(`${baseUrl}/api/payment/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });

  const responseData = await response.json();

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 400) {
      throw new Error(responseData.error || 'Invalid withdrawal request');
    } else if (response.status === 404) {
      throw new Error(responseData.error || 'Wallet not found');
    } else if (response.status === 500) {
      throw new Error(responseData.error || 'Server error occurred');
    } else {
      throw new Error(`Withdrawal failed: ${response.status} ${response.statusText}`);
    }
  }

  return responseData;
};

/**
 * Fetch user profile data (requires authentication)
 * @returns {Promise<Object>} - User profile data
 */
export const fetchUserProfile = async () => {
  return await apiCall('/user');
};

/**
 * Update user profile data (requires authentication)
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} - Updated user profile data
 */
export const updateUserProfile = async (profileData) => {
  return await apiCall('/user', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
};

// Reservations API functions
export const fetchUserReservations = async (page = 1, perPage = 10) => {
  return await apiCall(`/public/experiences/my?page=${page}&per_page=${perPage}`);
};

export const fetchReservationDetail = async (reservationId) => {
  return await apiCall(`/public/experiences/my/${reservationId}`);
};

export const completePayment = async (reservationId, paymentData) => {
  return await apiCall(`/public/experiences/my/${reservationId}/payment`, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

// Provider API functions
export const fetchProviderExperiences = async (page = 1, perPage = 20, filters = {}) => {
  const params = new URLSearchParams();
  
  // Add pagination
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  
  // Add filters
  if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.sort) {
    params.append('sort', filters.sort);
  }
  
  const queryString = params.toString();
  const url = `/experiences${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(url);
};

/**
 * Fetch slot reservations for a specific experience and slot (requires authentication)
 * @param {string} experienceId - Experience ID
 * @param {string} slotId - Slot ID
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @returns {Promise<Object>} - Reservations data with pagination
 */
export const fetchSlotReservations = async (experienceId, slotId, page = 1, perPage = 10) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  
  const queryString = params.toString();
  const url = `/provider/reservations/${experienceId}/${slotId}${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(url);
};

/**
 * Fetch slot details (requires authentication)
 * @param {string} slotId - Slot ID
 * @returns {Promise<Object>} - Slot details
 */
export const fetchSlotDetails = async (slotId) => {
  return await apiCall(`/provider/slots/${slotId}`);
};

// Device Management API functions

/**
 * Authorize a device for check-in (requires authentication)
 * @param {string} experienceId - Experience ID
 * @param {string} slotId - Slot ID
 * @param {string} deviceName - Device name
 * @returns {Promise<Object>} - Device token and expiration info
 */
export const authorizeDevice = async (experienceId, slotId, deviceName) => {
  return await apiCall('/device/auth', {
    method: 'POST',
    body: JSON.stringify({
      experience_id: experienceId,
      slot_id: slotId,
      device_name: deviceName
    })
  });
};

/**
 * Fetch authorized devices (requires authentication)
 * @returns {Promise<Object>} - List of authorized devices
 */
export const fetchAuthorizedDevices = async () => {
  return await apiCall('/device/authorized');
};

/**
 * Deauthorize a device (requires authentication)
 * @param {string} deviceName - Device name to deauthorize
 * @returns {Promise<Object>} - Success message
 */
export const deauthorizeDevice = async (deviceName) => {
  return await apiCall('/device/deauthorize', {
    method: 'POST',
    body: JSON.stringify({
      device_name: deviceName
    })
  });
};

/**
 * Verify device token (standalone check-in flow)
 * @param {string} token - Device token to verify
 * @returns {Promise<Object>} - Device verification response
 */
export const verifyDeviceToken = async (token) => {
  const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
  const response = await fetch(`${baseUrl}/device/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: token
    })
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Device verification failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// Device check-in API
export const deviceCheckin = async (reservationId) => {
  const token = getDeviceToken();
  if (!token) {
    throw new Error('Device token not found');
  }

  const baseUrl = config.api.forceLocalhost ? 'http://localhost:5000' : config.api.baseUrl;
  const response = await fetch(`${baseUrl}/device/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      reservation_id: reservationId
    })
  });

  const responseData = await response.json();

  // Handle different response statuses
  if (response.status === 200 || response.status === 201) {
    // Success - customer checked in
    return { ...responseData, status: 'success' };
  } else if (response.status === 400) {
    // Already checked in - return as normal response
    return { ...responseData, status: 'already_checked_in' };
  } else if (response.status === 404) {
    // Reservation not found - return as normal response
    return { ...responseData, status: 'reservation_not_found' };
  } else {
    // Other errors
    throw new Error(`Check-in failed: ${response.status} ${response.statusText}`);
  }
};
