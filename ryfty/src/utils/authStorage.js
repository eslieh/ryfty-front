// Authentication Storage Utilities
// Handles localStorage, sessionStorage, and cookies for auth persistence

// Cookie utilities
export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Authentication storage keys
const AUTH_KEYS = {
  TOKEN: 'ryfty-token',
  USER: 'ryfty-user',
  REFRESH_TOKEN: 'ryfty-refresh-token'
};

// Token management
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    console.log('Setting auth token:', token);
    localStorage.setItem(AUTH_KEYS.TOKEN, token);
    setCookie(AUTH_KEYS.TOKEN, token, 7); // 7 days
    console.log('Auth token set in localStorage and cookies');
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_KEYS.TOKEN) || getCookie(AUTH_KEYS.TOKEN);
  }
  return null;
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    deleteCookie(AUTH_KEYS.TOKEN);
  }
};

// User data management
export const setUserData = (user) => {
  if (typeof window !== 'undefined') {
    console.log('Setting user data:', user);
    const userData = JSON.stringify(user);
    localStorage.setItem(AUTH_KEYS.USER, userData);
    sessionStorage.setItem(AUTH_KEYS.USER, userData);
    setCookie(AUTH_KEYS.USER, userData, 7); // 7 days
    console.log('User data set in localStorage, sessionStorage, and cookies');
  }
};

export const getUserData = () => {
  if (typeof window !== 'undefined') {
    try {
      // Try localStorage first
      let userData = localStorage.getItem(AUTH_KEYS.USER);
      if (userData) {
        return JSON.parse(userData);
      }
      
      // Fallback to sessionStorage
      userData = sessionStorage.getItem(AUTH_KEYS.USER);
      if (userData) {
        return JSON.parse(userData);
      }
      
      // Fallback to cookie
      userData = getCookie(AUTH_KEYS.USER);
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  return null;
};

export const removeUserData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEYS.USER);
    sessionStorage.removeItem(AUTH_KEYS.USER);
    deleteCookie(AUTH_KEYS.USER);
  }
};

// Refresh token management
export const setRefreshToken = (refreshToken) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    setCookie(AUTH_KEYS.REFRESH_TOKEN, refreshToken, 30); // 30 days
  }
};

export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN) || getCookie(AUTH_KEYS.REFRESH_TOKEN);
  }
  return null;
};

export const removeRefreshToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    deleteCookie(AUTH_KEYS.REFRESH_TOKEN);
  }
};

// Complete auth cleanup
export const clearAuthData = () => {
  removeAuthToken();
  removeUserData();
  removeRefreshToken();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUserData();
  return !!(token && user);
};

// Initialize auth from storage
export const initializeAuthFromStorage = () => {
  console.log('Initializing auth from storage...');
  const token = getAuthToken();
  const user = getUserData();
  
  console.log('Retrieved from storage:', { token: !!token, user });
  
  if (token && user) {
    console.log('Found valid auth data in storage');
    return { token, user, isAuthenticated: true };
  }
  
  console.log('No valid auth data found in storage');
  return { token: null, user: null, isAuthenticated: false };
};
