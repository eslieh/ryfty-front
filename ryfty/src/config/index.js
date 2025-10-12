// Ryfty Configuration
const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
    timeout: 30000,
    version: 'v1',
    // Force localhost even in production (set to true to use localhost in production)
    forceLocalhost: process.env.NEXT_PUBLIC_FORCE_LOCALHOST === 'true' || true
  },

  defaultAvatar: 'https://i.pinimg.com/736x/9d/16/4e/9d164e4e074d11ce4de0a508914537a8.jpg',
  // Authentication Configuration
  auth: {
    // JWT Configuration
    jwt: {
      secret: process.env.JWT_SECRET || 'ryfty-dev-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },

    // Google OAuth Configuration
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback/google'
    },

    // Phone Authentication (Firebase/Twilio)
    phone: {
      provider: process.env.PHONE_AUTH_PROVIDER || 'firebase', // 'firebase' or 'twilio'
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioServiceSid: process.env.TWILIO_SERVICE_SID,
      firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    },

    // Session Configuration
    session: {
      cookieName: 'ryfty-session',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  },

  // File Upload Configuration
  upload: {
    // Cloudinary Configuration
    cloudinary: {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ryfty_profiles'
    },

    // File size limits
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    
    // Profile photo specific
    profile: {
      maxWidth: 800,
      maxHeight: 800,
      quality: 90
    }
  },

  // Role Configuration
  roles: {
    CUSTOMER: 'customer',
    PROVIDER: 'provider',
    ADMIN: 'admin'
  },

  // Application Configuration
  app: {
    name: 'Ryfty',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@ryfty.com'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
    ssl: process.env.NODE_ENV === 'production'
  },

  // Email Configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid', // 'sendgrid', 'mailgun', 'ses'
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@ryfty.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'Ryfty'
    },
    templates: {
      welcome: process.env.WELCOME_EMAIL_TEMPLATE_ID,
      verification: process.env.VERIFICATION_EMAIL_TEMPLATE_ID,
      passwordReset: process.env.PASSWORD_RESET_TEMPLATE_ID
    }
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimiting: {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5
      },
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      }
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }
  },

  // Feature Flags
  features: {
    googleAuth: process.env.ENABLE_GOOGLE_AUTH !== 'false', // Default enabled, disable with ENABLE_GOOGLE_AUTH=false
    phoneAuth: process.env.ENABLE_PHONE_AUTH === 'true',
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    twoFactorAuth: process.env.ENABLE_2FA === 'true',
    providerApproval: process.env.ENABLE_PROVIDER_APPROVAL === 'true'
  }
};

// Validation function to check required environment variables
export const validateConfig = () => {
  const required = [];
  
  if (config.features.googleAuth && !config.auth.google.clientId) {
    required.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID');
  }
  
  if (config.features.phoneAuth && !config.auth.phone.firebaseApiKey && !config.auth.phone.twilioAccountSid) {
    required.push('NEXT_PUBLIC_FIREBASE_API_KEY or TWILIO_ACCOUNT_SID');
  }
  
  if (!config.upload.cloudinary.cloudName) {
    required.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
  }
  
  if (required.length > 0) {
    console.warn('Missing required environment variables:', required);
  }
  
  return required.length === 0;
};

// Helper functions
export const getApiUrl = (endpoint) => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${baseUrl}/${config.api.version}/${cleanEndpoint}`;
};

export const isProduction = () => config.app.environment === 'production';
export const isDevelopment = () => config.app.environment === 'development';

export default config;
