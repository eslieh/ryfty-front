# Ryfty Metadata System Documentation

## Overview
This document outlines the comprehensive metadata system implemented for all Ryfty pages to improve SEO, social media sharing, and user experience.

## Metadata Structure

### Core Pages

#### 1. Home Page (`/`)
- **Title**: "Ryfty - Discover Amazing Local Experiences"
- **Description**: "Find and book unique local experiences, from cooking classes to adventure tours. Connect with passionate hosts and create unforgettable memories in your city."
- **Keywords**: "local experiences, activities, tours, cooking classes, adventure, travel, booking, hosts, authentic experiences"

#### 2. Authentication (`/auth`)
- **Title**: "Sign In to Ryfty - Access Your Account"
- **Description**: "Sign in to your Ryfty account to manage your bookings, host experiences, and discover amazing local activities. Join thousands of users exploring their cities."
- **Keywords**: "sign in, login, account, authentication, user access, Ryfty login"

#### 3. Host Experience (`/host-experience`)
- **Title**: "Host Experiences on Ryfty - Turn Your Passion Into Income"
- **Description**: "Become a Ryfty host and share your passion with others. Create unique experiences, earn money, and connect with people who love what you do. Start hosting today!"
- **Keywords**: "host experiences, become a host, share passion, earn money, create experiences, hosting platform, local business"

#### 4. Host Pricing (`/host-experience/pricing`)
- **Title**: "Ryfty Host Pricing - Simple 5% Platform Fee"
- **Description**: "Transparent pricing for Ryfty hosts. Only 5% platform fee, instant M-Pesa payouts, no hidden costs. See exactly how much you'll earn from each reservation."
- **Keywords**: "host pricing, platform fees, M-Pesa payouts, transparent pricing, earnings calculator, host costs"

#### 5. Provider Dashboard (`/provider`)
- **Title**: "Provider Dashboard - Manage Your Ryfty Experiences"
- **Description**: "Manage your hosted experiences, bookings, and earnings on Ryfty. Access your provider dashboard to track reservations, update listings, and grow your business."
- **Keywords**: "provider dashboard, manage experiences, bookings, earnings, host management, experience listings"

#### 6. Check-in System (`/checkin`)
- **Title**: "Guest Check-in - Ryfty QR Scanner"
- **Description**: "Scan QR codes to check in guests for Ryfty experiences. Secure, fast, and reliable check-in system for hosts and their customers."
- **Keywords**: "guest check-in, QR scanner, experience check-in, host tools, customer management"

#### 7. User Profile (`/profile`)
- **Title**: "My Profile - Manage Your Ryfty Account"
- **Description**: "Update your Ryfty profile, manage account settings, and view your experience history. Keep your information current for the best experience."
- **Keywords**: "user profile, account settings, profile management, user information, account details"

#### 8. Reservations (`/reservations`)
- **Title**: "My Reservations - Manage Your Bookings"
- **Description**: "View and manage all your Ryfty experience reservations. Check booking details, modify dates, and track your upcoming adventures."
- **Keywords**: "my reservations, booking management, experience bookings, upcoming trips, reservation details"

#### 9. Experience Details (`/experience/[id]`)
- **Title**: "Experience Details - Book Your Next Adventure"
- **Description**: "Discover detailed information about this amazing local experience. Read reviews, check availability, and book your spot for an unforgettable adventure."
- **Keywords**: "experience details, book experience, local activity, adventure booking, experience reviews"

### Legal Pages

#### 10. Terms of Use (`/terms-of-use`)
- **Title**: "Terms of Use - Ryfty Legal Information"
- **Description**: "Read Ryfty's terms of use and service agreement. Understand your rights and responsibilities when using our platform for experiences and bookings."
- **Keywords**: "terms of use, legal terms, service agreement, user agreement, platform terms"

#### 11. Privacy Policy (`/privacy-policy`)
- **Title**: "Privacy Policy - How Ryfty Protects Your Data"
- **Description**: "Learn how Ryfty protects your privacy and personal information. Our comprehensive privacy policy explains data collection, usage, and protection practices."
- **Keywords**: "privacy policy, data protection, personal information, privacy rights, data security"

## Technical Implementation

### File Structure
```
src/
├── config/
│   └── metadata.js          # Central metadata configuration
├── app/
│   ├── layout.js            # Root layout with default metadata
│   ├── page.js              # Home page
│   ├── auth/
│   │   ├── metadata.js      # Auth page metadata
│   │   └── page.js
│   ├── host-experience/
│   │   ├── metadata.js      # Host experience metadata
│   │   ├── page.js
│   │   └── pricing/
│   │       ├── metadata.js  # Pricing page metadata
│   │       └── page.js
│   ├── provider/
│   │   ├── metadata.js      # Provider dashboard metadata
│   │   └── page.js
│   ├── checkin/
│   │   ├── metadata.js      # Check-in system metadata
│   │   └── page.js
│   ├── profile/
│   │   ├── metadata.js      # User profile metadata
│   │   └── page.js
│   ├── reservations/
│   │   ├── metadata.js      # Reservations metadata
│   │   └── page.js
│   ├── experience/
│   │   ├── metadata.js      # Experience details metadata
│   │   └── [id]/
│   │       └── page.js
│   ├── terms-of-use/
│   │   ├── metadata.js      # Terms of use metadata
│   │   └── page.js
│   └── privacy-policy/
│       ├── metadata.js      # Privacy policy metadata
│       └── page.js
```

### SEO Features

#### 1. Open Graph Tags
- **og:title**: Page-specific titles
- **og:description**: Page-specific descriptions
- **og:type**: "website" for all pages
- **og:site_name**: "Ryfty"
- **og:image**: Relevant images for each page type

#### 2. Twitter Cards
- **twitter:card**: "summary_large_image"
- **twitter:title**: Page-specific titles
- **twitter:description**: Page-specific descriptions
- **twitter:image**: Relevant images

#### 3. Meta Tags
- **title**: Optimized for search engines and user experience
- **description**: Compelling descriptions under 160 characters
- **keywords**: Relevant keywords for each page
- **robots**: Proper indexing instructions

#### 4. Sitemap Configuration
- **next-sitemap.config.js**: Updated to include all major pages
- **robots.txt**: Generated automatically with proper directives
- **sitemap.xml**: Comprehensive sitemap for search engines

## Benefits

### 1. SEO Improvements
- **Better Search Rankings**: Optimized titles and descriptions
- **Rich Snippets**: Structured data for better search results
- **Crawlability**: Comprehensive sitemap and robots.txt

### 2. Social Media Sharing
- **Facebook/LinkedIn**: Open Graph tags for rich previews
- **Twitter**: Twitter Card optimization
- **Consistent Branding**: Unified appearance across platforms

### 3. User Experience
- **Clear Page Titles**: Users know exactly what each page contains
- **Descriptive Meta**: Better understanding before clicking
- **Professional Appearance**: Consistent, polished presentation

## Usage Guidelines

### 1. Adding New Pages
1. Create a `metadata.js` file in the page directory
2. Export a metadata object with title, description, keywords
3. Include Open Graph and Twitter Card data
4. Update sitemap configuration if needed

### 2. Updating Existing Pages
1. Modify the relevant `metadata.js` file
2. Ensure titles are under 60 characters
3. Keep descriptions under 160 characters
4. Use relevant, targeted keywords

### 3. Best Practices
- **Titles**: Include primary keyword, be descriptive
- **Descriptions**: Write compelling copy that encourages clicks
- **Keywords**: Use 5-10 relevant keywords per page
- **Images**: Use high-quality, relevant images for social sharing

## Monitoring and Analytics

### 1. SEO Tools
- Google Search Console for search performance
- Google Analytics for user behavior
- Social media insights for sharing performance

### 2. Key Metrics
- **Click-through rates** from search results
- **Social media engagement** on shared links
- **Page load times** and Core Web Vitals
- **Search rankings** for target keywords

This metadata system provides a solid foundation for Ryfty's SEO and social media presence, ensuring each page is optimized for both search engines and users.
