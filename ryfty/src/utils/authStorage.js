// Authentication Storage Utilities
// Handles localStorage, sessionStorage, and cookies for auth persistence

// Simple cookie utilities - no environment bullshit
export const setCookie = (name, value, days = 7) => {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Simple cookie - no security flags, no environment detection
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
  
  console.log(`Cookie ${name} set: ${value.substring(0, 50)}...`);
};

export const getCookie = (name) => {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = c.substring(nameEQ.length, c.length);
      return decodeURIComponent(value);
    }
  }
  return null;
};

export const deleteCookie = (name) => {
  if (typeof window === 'undefined') return;
  
  // Simple cookie deletion
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  console.log(`Cookie ${name} deleted`);
};

// Authentication storage keys
const AUTH_KEYS = {
  TOKEN: 'ryfty-token',
  USER: 'ryfty-user',
  REFRESH_TOKEN: 'ryfty-refresh-token'
};

// Token management - COOKIES ONLY
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    console.log('Setting auth token in COOKIE:', token ? `${token.substring(0, 20)}...` : 'null');
    setCookie(AUTH_KEYS.TOKEN, token, 7);
    console.log('Auth token saved to cookie');
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = getCookie(AUTH_KEYS.TOKEN);
    console.log('Getting auth token from COOKIE:', token ? 'FOUND' : 'NOT FOUND');
    return token;
  }
  return null;
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    deleteCookie(AUTH_KEYS.TOKEN);
    console.log('Auth token removed from cookie');
  }
};

// User data management - COOKIES ONLY
export const setUserData = (user) => {
  if (typeof window !== 'undefined') {
    console.log('Setting user data in COOKIE:', user);
    const userData = JSON.stringify(user);
    setCookie(AUTH_KEYS.USER, userData, 7);
    console.log('User data saved to cookie');
  }
};

export const getUserData = () => {
  if (typeof window !== 'undefined') {
    const userData = getCookie(AUTH_KEYS.USER);
    if (userData) {
      console.log('Getting user data from COOKIE: FOUND');
      return JSON.parse(userData);
    }
    console.log('Getting user data from COOKIE: NOT FOUND');
    return null;
  }
  return null;
};

export const removeUserData = () => {
  if (typeof window !== 'undefined') {
    deleteCookie(AUTH_KEYS.USER);
    console.log('User data removed from cookie');
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

// Complete auth cleanup - COOKIES ONLY
export const clearAuthData = () => {
  removeAuthToken();
  removeUserData();
  console.log('All auth data cleared from cookies');
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

// Simple debug function
export const debugStorageStatus = () => {
  if (typeof window === 'undefined') {
    console.log('Storage debugging not available on server side');
    return;
  }
  
  console.log('=== COOKIE STATUS ===');
  console.log('Token cookie:', !!getCookie(AUTH_KEYS.TOKEN));
  console.log('User cookie:', !!getCookie(AUTH_KEYS.USER));
  console.log('All cookies:', document.cookie);
  console.log('===================');
};

// Simple cookie test
export const testCookies = () => {
  if (typeof window === 'undefined') {
    console.log('Cookie testing not available on server side');
    return;
  }
  
  console.log('=== TESTING COOKIES ===');
  const testData = { test: 'cookie works', timestamp: Date.now() };
  setCookie('test-cookie', JSON.stringify(testData), 1);
  
  setTimeout(() => {
    const retrieved = getCookie('test-cookie');
    console.log('Cookie test:', retrieved ? 'SUCCESS' : 'FAILED');
    deleteCookie('test-cookie');
    console.log('=====================');
  }, 1000);
};
