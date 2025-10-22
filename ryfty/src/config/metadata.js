// Static metadata configuration for all pages
export const pageMetadata = {
  // Home page
  home: {
    title: "Ryfty - Discover Amazing Local Experiences",
    description: "Find and book unique local experiences, from cooking classes to adventure tours. Connect with passionate hosts and create unforgettable memories in your city.",
    keywords: "local experiences, activities, tours, cooking classes, adventure, travel, booking, hosts, authentic experiences"
  },

  // Authentication pages
  auth: {
    title: "Sign In to Ryfty - Access Your Account",
    description: "Sign in to your Ryfty account to manage your bookings, host experiences, and discover amazing local activities. Join thousands of users exploring their cities.",
    keywords: "sign in, login, account, authentication, user access, Ryfty login"
  },

  // Host Experience pages
  hostExperience: {
    title: "Host Experiences on Ryfty - Turn Your Passion Into Income",
    description: "Become a Ryfty host and share your passion with others. Create unique experiences, earn money, and connect with people who love what you do. Start hosting today!",
    keywords: "host experiences, become a host, share passion, earn money, create experiences, hosting platform, local business"
  },

  hostExperiencePricing: {
    title: "Ryfty Host Pricing - Simple 5% Platform Fee",
    description: "Transparent pricing for Ryfty hosts. Only 5% platform fee, instant M-Pesa payouts, no hidden costs. See exactly how much you'll earn from each reservation.",
    keywords: "host pricing, platform fees, M-Pesa payouts, transparent pricing, earnings calculator, host costs"
  },

  // Provider Dashboard
  provider: {
    title: "Provider Dashboard - Manage Your Ryfty Experiences",
    description: "Manage your hosted experiences, bookings, and earnings on Ryfty. Access your provider dashboard to track reservations, update listings, and grow your business.",
    keywords: "provider dashboard, manage experiences, bookings, earnings, host management, experience listings"
  },

  // Experience pages
  experience: {
    title: "Experience Details - Book Your Next Adventure",
    description: "Discover detailed information about this amazing local experience. Read reviews, check availability, and book your spot for an unforgettable adventure.",
    keywords: "experience details, book experience, local activity, adventure booking, experience reviews"
  },

  // Check-in system
  checkin: {
    title: "Guest Check-in - Ryfty QR Scanner",
    description: "Scan QR codes to check in guests for Ryfty experiences. Secure, fast, and reliable check-in system for hosts and their customers.",
    keywords: "guest check-in, QR scanner, experience check-in, host tools, customer management"
  },

  // Reservations
  reservations: {
    title: "My Reservations - Manage Your Bookings",
    description: "View and manage all your Ryfty experience reservations. Check booking details, modify dates, and track your upcoming adventures.",
    keywords: "my reservations, booking management, experience bookings, upcoming trips, reservation details"
  },

  // Profile
  profile: {
    title: "My Profile - Manage Your Ryfty Account",
    description: "Update your Ryfty profile, manage account settings, and view your experience history. Keep your information current for the best experience.",
    keywords: "user profile, account settings, profile management, user information, account details"
  },

  // Legal pages
  termsOfUse: {
    title: "Terms of Use - Ryfty Legal Information",
    description: "Read Ryfty's terms of use and service agreement. Understand your rights and responsibilities when using our platform for experiences and bookings.",
    keywords: "terms of use, legal terms, service agreement, user agreement, platform terms"
  },

  privacyPolicy: {
    title: "Privacy Policy - How Ryfty Protects Your Data",
    description: "Learn how Ryfty protects your privacy and personal information. Our comprehensive privacy policy explains data collection, usage, and protection practices.",
    keywords: "privacy policy, data protection, personal information, privacy rights, data security"
  }
};

// Helper function to generate metadata for a page
export const generateMetadata = (pageKey, customData = {}) => {
  const baseMetadata = pageMetadata[pageKey];
  if (!baseMetadata) {
    console.warn(`No metadata found for page: ${pageKey}`);
    return {};
  }

  return {
    title: customData.title || baseMetadata.title,
    description: customData.description || baseMetadata.description,
    keywords: customData.keywords || baseMetadata.keywords,
    openGraph: {
      title: customData.title || baseMetadata.title,
      description: customData.description || baseMetadata.description,
      type: 'website',
      siteName: 'Ryfty',
      images: [
        {
          url: '/main.png',
          width: 1200,
          height: 630,
          alt: baseMetadata.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: customData.title || baseMetadata.title,
      description: customData.description || baseMetadata.description,
      images: ['/main.png']
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  };
};
