# Backend API Requirements for Ryfty Authentication

This document outlines the backend API endpoints required for the Ryfty authentication system using a **redirect-based Google OAuth flow**.

## Base URL
Your backend should be running on: `http://localhost:5000`

## Authentication Flow Overview

1. **User clicks "Continue with Google"** in frontend
2. **Frontend redirects** to your backend endpoint: `GET /login/google`
3. **Backend handles Google OAuth** (redirect to Google, handle callback)
4. **Backend redirects back** to frontend with result: `GET /auth/callback`

## Required Endpoints

### 1. Email/Password Sign In
**Endpoint:** `POST /auth/signin`

**Request Body:**
```json
{
  "identifier": "heartframed@gmail.com",
  "password": "eslieh.com"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1ODc0Mjg2MywianRpIjoiNDM1YmIxZmYtZjVhOS00NDI1LWFjZjAtZDRmYWY1MDE5YzYwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjY4NjFhNTA1LWRjZDQtNGY1NS1iODIwLTc0Y2RiZjVlODk3ZCIsIm5iZiI6MTc1ODc0Mjg2MywiY3NyZiI6IjcwYTcwZmI1LWI5NjMtNDAzNy1hZmM3LWMwOGJjNDg4YzU4NCIsImV4cCI6MTc2MjE5ODg2M30.0b6SgVV-LhTI8U4qbAuqETjrZcQJ85I2OaKNmEje3ko",
  "user": {
    "id": "6861a505-dcd4-4f55-b820-74cdbf5e897d",
    "email": "heartframed@gmail.com",
    "phone": null,
    "name": "eslieh chau",
    "avatar_url": null
  }
}
```

**Error Response (400/401):**
```json
{
  "message": "Invalid credentials"
}
```

### 2. User Registration/Signup
**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+254712345678",
  "password": "securePass123",
  "name": "John Doe",
  "role": "customer"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully"
}
```

**Error Response (400/422):**
```json
{
  "message": "Email already exists"
}
```

### 3. Verify Account
**Endpoint:** `POST /auth/verify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

**Success Response (200):**
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid-or-int",
    "email": "user@example.com",
    "phone": "+254712345678",
    "name": "John Doe",
    "avatar_url": null
  },
  "message": "Email verified successfully"
}
```

**Error Response (400/401):**
```json
{
  "message": "Invalid verification code"
}
```

### 4. Request Password Reset
**Endpoint:** `POST /auth/reset/request`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset code sent to email"
}
```

**Error Response (404):**
```json
{
  "message": "Email not found"
}
```

### 5. Reset Password
**Endpoint:** `POST /auth/reset/verify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "654321",
  "password": "newStrongPass456"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Response (400/401):**
```json
{
  "message": "Invalid reset code"
}
```

### 6. Google OAuth Initiation
**Endpoint:** `GET /login/google`

**Query Parameters:**
```
userType=user          // or "provider"
mode=login            // or "signup"  
redirect=/dashboard   // optional, where to redirect after success
```

**Example Request:**
```
GET /login/google?userType=user&mode=login&redirect=/dashboard
```

**Backend Should:**
1. Store the `userType`, `mode`, and `redirect` in session/state
2. Redirect user to Google OAuth with your Google app credentials
3. Handle the Google OAuth callback
4. After successful authentication, redirect back to frontend

### 7. Frontend Callback (Your Backend Redirects Here)
**Endpoint:** `GET /auth/callback` (Frontend route)

**Success URL Format:**
```
http://localhost:3000/auth/callback?token=JWT_ACCESS_TOKEN&email=user@example.com&id=6861a505-dcd4-4f55-b820-74cdbf5e897d&name=John%20Doe&avatar_url=https://example.com/avatar.jpg&role=customer
```

**Error URL Format:**
```
http://localhost:3000/auth/callback?error=Authentication%20failed
```

**Query Parameters for Success:**
- `token`: JWT token for the authenticated user
- `email`: User's email address
- `id`: User's unique identifier
- `name`: User's full name
- `avatar_url`: User's avatar URL (if available)
- `role`: User role ("customer" or "provider")

**Query Parameters for Error:**
- `error`: URL-encoded error message

## Backend Implementation Guide

### Step 1: Google OAuth Setup
```javascript
// Example using Express.js and Passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { urlencode } = require('querystring');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  // Handle user authentication here
  return done(null, profile);
}));
```

### Step 2: Initiation Endpoint
```javascript
app.get('/login/google', (req, res, next) => {
  // Store user preferences in session
  req.session.userType = req.query.userType || 'user';
  req.session.authMode = req.query.mode || 'login';
  req.session.redirectUrl = req.query.redirect;
  
  // Redirect to Google OAuth
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});
```

### Step 3: Google Callback Handler
```javascript
app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const userType = req.session.userType;
      const authMode = req.session.authMode;
      const redirectUrl = req.session.redirectUrl;
      
      // Extract user data from Google profile
      const googleUser = {
        googleId: req.user.id,
        email: req.user.emails[0].value,
        firstName: req.user.name.givenName,
        lastName: req.user.name.familyName,
        profilePhoto: req.user.photos[0].value
      };
      
      // Check if user exists or create new user
      let user = await findUserByEmail(googleUser.email);
      let isNewUser = false;
      
      if (!user && authMode === 'signup') {
        // Create new user
        user = await createUser({
          ...googleUser,
          role: userType
        });
        isNewUser = true;
      } else if (!user && authMode === 'login') {
        // User doesn't exist, redirect with error
        return res.redirect(`http://localhost:3000/auth/callback?error=${encodeURIComponent('Account not found. Please sign up first.')}`);
      } else if (user && authMode === 'signup') {
        // User exists but trying to sign up
        return res.redirect(`http://localhost:3000/auth/callback?error=${encodeURIComponent('Account already exists. Please log in instead.')}`);
      }
      
      // Generate JWT token
      const token = generateJwtToken(user);
      
      // Redirect back to frontend with success
      const redirectUrl = `${FRONTEND_URL}/auth/callback?${urlencode({
        token: token,
        email: user.email,
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role
      })}`;
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('Google auth error:', error);
      res.redirect(`http://localhost:3000/auth/callback?error=${encodeURIComponent('Authentication failed')}`);
    }
  }
);
```

## Environment Variables Needed

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

## Testing the Integration

1. Set up your backend with the above endpoints
2. Configure Google OAuth in your Google Cloud Console
3. Add your Google Client ID to your frontend environment variables
4. Test the authentication flow:
   - Visit `/auth` in your frontend
   - Click "Continue with Google"
   - Verify the token is sent to your backend
   - Check that user data is returned and stored properly

## Error Handling

Make sure your backend handles these error cases:
- Invalid Google token
- Network errors
- Database connection issues
- Duplicate user registration attempts
- Missing required fields

## Security Considerations

1. **Always verify Google tokens** on the backend
2. **Use HTTPS** in production
3. **Implement rate limiting** for auth endpoints
4. **Validate and sanitize** all input data
5. **Use secure JWT tokens** with proper expiration
6. **Store sensitive data securely** (hashed passwords, etc.)
