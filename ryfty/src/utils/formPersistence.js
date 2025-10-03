// Form persistence utilities using cookies
const COOKIE_NAME = 'ryfty_form_draft';
const COOKIE_EXPIRY_DAYS = 7; // Keep draft for 7 days

// Cookie utility functions
export const setCookie = (name, value, days = COOKIE_EXPIRY_DAYS) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
      } catch (error) {
        console.warn('Failed to parse cookie:', error);
        return null;
      }
    }
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Form data persistence functions
export const saveFormData = (formData, currentStep = 1) => {
  const formState = {
    data: formData,
    currentStep: currentStep,
    timestamp: Date.now(),
    version: '1.0'
  };
  
  try {
    setCookie(COOKIE_NAME, formState);
    console.log('Form data saved to cookie');
  } catch (error) {
    console.error('Failed to save form data:', error);
  }
};

export const loadFormData = () => {
  try {
    const formState = getCookie(COOKIE_NAME);
    if (formState && formState.data) {
      // Check if the draft is not too old (optional: you can add expiry check here)
      const isRecent = Date.now() - formState.timestamp < (7 * 24 * 60 * 60 * 1000); // 7 days
      if (isRecent) {
        console.log('Form data loaded from cookie');
        return {
          formData: formState.data,
          currentStep: formState.currentStep || 1
        };
      } else {
        // Clean up old draft
        deleteCookie(COOKIE_NAME);
      }
    }
  } catch (error) {
    console.error('Failed to load form data:', error);
  }
  
  return null;
};

export const clearFormData = () => {
  deleteCookie(COOKIE_NAME);
  console.log('Form data cleared from cookie');
};

// Check if there's a draft available
export const hasDraftData = () => {
  const formState = getCookie(COOKIE_NAME);
  return formState && formState.data;
};

// Get draft info for UI display
export const getDraftInfo = () => {
  const formState = getCookie(COOKIE_NAME);
  if (formState && formState.data) {
    const draftDate = new Date(formState.timestamp);
    return {
      hasDraft: true,
      lastSaved: draftDate.toLocaleString(),
      currentStep: formState.currentStep || 1,
      title: formState.data.title || 'Untitled Experience'
    };
  }
  return { hasDraft: false };
};
