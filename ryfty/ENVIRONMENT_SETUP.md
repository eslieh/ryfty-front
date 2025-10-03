# Environment Variables Setup Guide

## Quick Setup for Cloudinary

### 1. Create your .env.local file

Create a file named `.env.local` in your project root directory with the following content:

```bash
# ===========================================
# CLOUDINARY CONFIGURATION (REQUIRED)
# ===========================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ryfty_images

# ===========================================
# BASIC APPLICATION SETTINGS
# ===========================================
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 2. Get your Cloudinary credentials

1. **Sign up/Login to Cloudinary**: Go to [https://cloudinary.com](https://cloudinary.com)
2. **Access Dashboard**: Click on "Dashboard" in the top navigation
3. **Find your credentials**: Look for the "Product Environment Credentials" section
4. **Copy the values**:
   - **Cloud Name**: Usually something like `dxyz123abc`
   - **API Key**: A numeric value like `123456789012345`
   - **API Secret**: A long string like `abcdefghijklmnopqrstuvwxyz123456`

### 3. Create an Upload Preset

1. **Go to Settings**: In your Cloudinary dashboard, click "Settings" (gear icon)
2. **Upload Presets**: Click on "Upload" in the left sidebar
3. **Add Upload Preset**: Click "Add upload preset"
4. **Configure the preset**:
   - **Preset name**: `ryfty_images`
   - **Signing Mode**: `Unsigned` (for client-side uploads)
   - **Folder**: `ryfty/experiences` (optional, for organization)
   - **Transformation**: 
     - **Quality**: `auto`
     - **Format**: `auto`
   - **Access Mode**: `Public`
5. **Save**: Click "Save" to create the preset

### 4. Update your .env.local file

Replace the placeholder values with your actual Cloudinary credentials:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ryfty_images
```

### 5. Test the setup

1. **Start your development server**: `npm run dev` or `yarn dev`
2. **Navigate to**: `http://localhost:3000/provider/listings/create`
3. **Go to Step 4**: Click through to the Images step
4. **Try uploading an image**: The upload should work with progress indicators

## Complete Environment Variables (Optional)

If you want to set up other features, here's the complete list:

```bash
# ===========================================
# APPLICATION SETTINGS
# ===========================================
NODE_ENV=development
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# ===========================================
# CLOUDINARY CONFIGURATION (REQUIRED)
# ===========================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ryfty_images

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL=postgresql://username:password@localhost:5432/ryfty_db
DB_MAX_CONNECTIONS=10

# ===========================================
# AUTHENTICATION & SECURITY
# ===========================================
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12

# ===========================================
# GOOGLE OAUTH (Optional)
# ===========================================
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google

# ===========================================
# PHONE AUTHENTICATION (Optional)
# ===========================================
PHONE_AUTH_PROVIDER=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id

# ===========================================
# EMAIL CONFIGURATION (Optional)
# ===========================================
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@ryfty.com
SENDGRID_FROM_NAME=Ryfty

# ===========================================
# FEATURE FLAGS
# ===========================================
ENABLE_GOOGLE_AUTH=true
ENABLE_PHONE_AUTH=false
ENABLE_EMAIL_VERIFICATION=false
ENABLE_2FA=false
ENABLE_PROVIDER_APPROVAL=true

# ===========================================
# SECURITY & CORS
# ===========================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
SUPPORT_EMAIL=support@ryfty.com
```

## Important Notes

1. **Never commit .env.local**: Add `.env.local` to your `.gitignore` file
2. **Restart server**: After changing environment variables, restart your development server
3. **Production setup**: For production, use your hosting platform's environment variable settings
4. **Security**: Keep your API secrets secure and never expose them in client-side code

## Troubleshooting

### Upload not working?
- Check that your Cloudinary credentials are correct
- Verify the upload preset exists and is set to "Unsigned"
- Check browser console for error messages
- Ensure your Cloudinary account is active

### Images not displaying?
- Check that `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly
- Verify the uploaded images are public in Cloudinary
- Check network tab for failed image requests

### Environment variables not loading?
- Make sure the file is named exactly `.env.local`
- Restart your development server
- Check that variable names match exactly (case-sensitive)
