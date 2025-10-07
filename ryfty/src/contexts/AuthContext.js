"use client";

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import config from '@/config';
import { 
  setAuthToken, 
  getAuthToken, 
  removeAuthToken, 
  setUserData, 
  getUserData, 
  removeUserData,
  clearAuthData,
  initializeAuthFromStorage,
  debugStorageStatus
} from '@/utils/authStorage';

// Auth states
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initializeAuth = useCallback(async () => {
    try {
      console.log('Initializing auth...');
      
      // Debug storage status
      debugStorageStatus();
      
      // Initialize from storage (localStorage, sessionStorage, cookies)
      const { token, user: storedUser, isAuthenticated: hasStoredAuth } = initializeAuthFromStorage();
      console.log('Stored auth data:', { token: !!token, user: storedUser, hasStoredAuth });
      
      if (hasStoredAuth && token && storedUser) {
        setUserData(storedUser);
        setAuthToken(token);
        dispatch({ type: 'SET_USER', payload: storedUser });
        console.log('Found stored auth data, validating token...', token, storedUser);
      } else {
        console.log('No stored auth data found');
        // No stored auth data, clear any partial data
        clearAuthData();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      clearAuthData();
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login with email and password
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await fetch(`${config.api.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          identifier: email, 
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.access_token);
        setUserData(data.user);
        dispatch({ type: 'SET_USER', payload: data.user });
        return { success: true, user: data.user };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Login failed' });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const payload = {
        password: userData.password,
        name: userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
        role: userData.role || userData.userType || 'customer'
      };

      // Include email or phone (at least one is required)
      if (userData.email) {
        payload.email = userData.email;
      }
      if (userData.phone) {
        payload.phone = userData.phone;
      }

      const response = await fetch(`${config.api.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { 
          success: true, 
          message: data.message || 'Registration successful. Please check your email/phone for verification code.',
          needsVerification: true,
          email: userData.email,
          phone: userData.phone
        };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Registration failed' });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Verify account with email and token
  const verifyAccount = async (email, token) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await fetch(`${config.api.baseUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          token: token
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.access_token);
        setUserData(data.user);
        dispatch({ type: 'SET_USER', payload: data.user });
        return { 
          success: true, 
          user: data.user, 
          message: data.message || 'Account verified successfully!' 
        };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Verification failed' });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await fetch(`${config.api.baseUrl}/auth/reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { 
          success: true, 
          message: data.message || 'Password reset code sent to your email.' 
        };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to send reset code' });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Reset password with token
  const resetPassword = async (email, token, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await fetch(`${config.api.baseUrl}/auth/reset/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          token: token,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { 
          success: true, 
          message: data.message || 'Password reset successfully!' 
        };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Password reset failed' });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Login with token (for Google auth callback)
  const loginWithToken = async (token, userData) => {
    try {
      console.log('loginWithToken called with:', { token, userData });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Ensure user data has all required fields
      const completeUserData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || null,
        avatar_url: userData.avatar_url || null,
        role: userData.role || 'customer'
      };
      
      console.log('Complete user data:', completeUserData);
      
      // Store token and user data in multiple storage locations
      setAuthToken(token);
      setUserData(completeUserData);
      dispatch({ type: 'SET_USER', payload: completeUserData });
      
      console.log('Auth data stored, dispatching SET_USER');
      
      // Debug storage after setting
      debugStorageStatus();
      
      return { success: true, user: completeUserData };
    } catch (error) {
      console.error('loginWithToken error:', error);
      const errorMessage = 'Authentication failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Google OAuth login
  const loginWithGoogle = async (googleToken) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await fetch(`${config.api.baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: googleToken })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.access_token);
        setUserData(data.user);
        dispatch({ type: 'SET_USER', payload: data.user });
        return { success: true, user: data.user };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Google login failed' });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Google login failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Phone authentication
  const sendPhoneVerification = async (phoneNumber) => {
    try {
      const response = await fetch(`${config.api.baseUrl}/auth/phone/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      return { success: false, error: 'Failed to send verification code' };
    }
  };

  const verifyPhoneCode = async (phoneNumber, code) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await fetch(`${config.api.baseUrl}/auth/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, code })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.access_token);
        setUserData(data.user);
        dispatch({ type: 'SET_USER', payload: data.user });
        return { success: true, user: data.user };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Phone verification failed' });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Phone verification failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${config.api.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all authentication data from all storage locations
      clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${config.api.baseUrl}/user`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        // Update stored user data
        setUserData(data.user);
        dispatch({ type: 'UPDATE_PROFILE', payload: data.user });
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update profile' };
    }
  };

  // Upload profile photo
  const uploadProfilePhoto = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.upload.cloudinary.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.upload.cloudinary.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update user profile with new photo URL
        const updateResult = await updateProfile({ profilePhoto: data.secure_url });
        return { success: true, url: data.secure_url, user: updateResult.user };
      } else {
        return { success: false, error: 'Failed to upload photo' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to upload photo' };
    }
  };

  // Role-based access control
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const isProvider = () => hasRole(config.roles.PROVIDER);
  const isCustomer = () => hasRole(config.roles.CUSTOMER);
  const isAdmin = () => hasRole(config.roles.ADMIN);

  // Switch between customer and provider roles
  const switchRole = async (newRole) => {
    if (!state.user) return { success: false, error: 'Not authenticated' };
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${config.api.baseUrl}/auth/switch-role`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();

      if (response.ok) {
        // Update stored user data with new role
        const updatedUser = { ...state.user, role: newRole };
        setUserData(updatedUser);
        dispatch({ type: 'UPDATE_PROFILE', payload: { role: newRole } });
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to switch role' };
    }
  };

  const value = {
    ...state,
    login,
    loginWithToken,
    register,
    verifyAccount,
    requestPasswordReset,
    resetPassword,
    loginWithGoogle,
    sendPhoneVerification,
    verifyPhoneCode,
    logout,
    updateProfile,
    uploadProfilePhoto,
    hasRole,
    isProvider,
    isCustomer,
    isAdmin,
    switchRole,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
