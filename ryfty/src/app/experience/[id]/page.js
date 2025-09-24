"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import "../../../styles/experience-detail.css";

export default function ExperienceDetail({ params }) {
  const router = useRouter();
  const [experience, setExperience] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Sample experience data (in a real app, this would come from an API)
  const experiences = [
    {
      id: "1",
      title: "Explore Nairobi National Park Safari Tour",
      subtitle: "The world's only wildlife capital that plays host to a wide variety of wildlife & birdlife",
      duration: "4.5 hours",
      rating: 4.98,
      reviewCount: 141,
      price: 17474,
      currency: "KSh",
      originalPrice: 85, // USD equivalent for reference
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80",
        "https://images.unsplash.com/photo-1549366021-9f761d040a94?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1581852017103-68ac65514cf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
      ],
      location: "Nairobi, Nairobi County",
      category: "Wildlife",
      freeCancellation: true,
      meetingPoint: "Nairobi county",
      meetingDetails: "Free Pick up from your Airbnb or Hotel accommodation within Nairobi",
      description: "Experience the park's diverse wildlife on the morning drive. The world's only wildlife capital that plays host to a wide variety of wildlife & birdlife against the backdrop of Kenya's capital city skyline.",
      whatYoullDo: [
        "Pick up from hotel - Free Pick up from your Airbnb or Hotel accommodation within Nairobi",
        "Drive to park - Enjoy a short drive to Nairobi National Park",
        "Register at entrance - You will Purchase your own entrance fees- not included $43 adults and $22 child - No cash, credit card accepted",
        "Explore the park - Experience the park's diverse wildlife on the morning drive",
        "Return to hotel - After the safari, I'll drop you back at your hotel or in case you were leaving I can as well a drop you off at Jomo Kenyatta International Airport",
        "Transportation - N/B I use both customized safari Van and land cruiser subject to availability",
        "Elephant orphanage - A bonus If you already have the tickets for Elephant Sheldrick visit, I will be more than happy to take you there"
      ],
      highlights: [
        "Customized safari vehicle with Pop up roof for game viewing",
        "See the famous Big Four animals in their natural habitat",
        "Professional guide with extensive wildlife knowledge",
        "Small group experience (max 8 people)",
        "Hotel pickup and drop-off included",
        "Optional visit to Elephant Orphanage with existing tickets"
      ],
      includes: ["Professional guide", "Transportation", "Hotel pickup/drop-off", "Safari vehicle with pop-up roof"],
      excludes: ["Park entrance fees ($43 adults, $22 children)", "Personal expenses", "Tips", "Elephant orphanage tickets"],
      hostName: "Dennis",
      hostImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      hostExperience: "Wildlife enthusiast and student",
      hostDescription: "I am a sustainable Tourism and Wildlife Management student. Nature and Wildlife Enthusiast. I have engaged with various tour operators in Nairobi on safari and itinerary planning helping me sharpen my tour guiding skills. I have managed to visit numerous wildlife destinations in Kenya therefor I just don't create travels - I create memorable experiences",
      languages: ["English"],
      hostedIn: "English",
      maxGuests: 10,
      minimumAge: 5,
      availableDates: [
        { date: "September 25", time: "2:00 – 6:30 PM", spots: 10 },
        { date: "September 26", time: "6:00 – 10:30 AM", spots: 10 },
        { date: "September 26", time: "2:00 – 6:30 PM", spots: 10 },
        { date: "September 27", time: "6:00 – 10:30 AM", spots: 10 },
        { date: "September 27", time: "2:00 – 6:30 PM", spots: 10 }
      ],
      reviews: [
        {
          name: "Tobias",
          timeAgo: "5 days ago",
          text: "Great tour of Nairobi National Park with Denis and his driver. They were very knowledgable and did everything to ensure we would get to see the wildlife in the park (which we did, a lion and rhinos included!). I fell ill for my original tour date and only cancelled a few hours in advance but Denis took me on a later date without any charge. Will gladly take the tour again if I'm ever back in Nairobi."
        },
        {
          name: "Daniel",
          location: "Newark, NJ",
          timeAgo: "1 week ago",
          text: "What an amazing day i had with Dennis...I thought about this on a last minute and that was the best decision i ever made while traveling. This was an unforgettable safari for me. Dennis was an outstanding safari host and i really appreciate him so much.I highly recommend him to anyone that wants to enjoy an exclusive experience."
        },
        {
          name: "Julianne",
          timeAgo: "1 week ago",
          text: "Dennis was the best. He came & picked us up & from the start was very welcoming & warm. We had an amazing tour of Nairobi National Park, with a stop at Sheldrick Elephant Sanctuary, before Dennis dropped us back to our accommodation. Thanks so much for a great day."
        },
        {
          name: "Cami",
          location: "Detroit, MI",
          timeAgo: "1 week ago",
          text: "I was happy to be able to have a solo safari experience. My host was prompt and arriving for my pick up. We arrived to the park and within 10 minutes we saw three lions. This is actually unusual so I felt very privileged. Dennis was very knowledgeable about the animals and about the flora in the park. I was very satisfied with the Safari. We saw many Rhino, hippos, gazelle, zebras and many other animals and birds. I would definitely recommend this experience."
        }
      ]
    },
    {
      id: "2",
      title: "Wildlife excursion through Hell's Gate",
      duration: "5.5 hours", 
      rating: 4.98,
      reviewCount: 89,
      price: 120,
      image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1551073541-6229667afc85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1574029972918-ad9be5c58e6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
      ],
      location: "Hell's Gate, Kenya",
      description: "Experience the dramatic landscapes of Hell's Gate National Park through this exciting wildlife excursion. Walk among zebras and giraffes, explore towering cliffs, and discover the geothermal wonders that inspired Disney's Lion King.",
      highlights: [
        "Walk freely among wildlife in this unique park",
        "Explore dramatic gorges and towering cliffs", 
        "Visit the geothermal spa for a relaxing soak",
        "Rock climbing opportunities for adventurers",
        "Scenic cycling through the park"
      ],
      itinerary: [
        { time: "8:00 AM", activity: "Departure from Nairobi" },
        { time: "10:00 AM", activity: "Arrive at Hell's Gate National Park" },
        { time: "10:30 AM - 2:30 PM", activity: "Walking safari and exploration" },
        { time: "3:00 PM", activity: "Geothermal spa experience" },
        { time: "4:30 PM", activity: "Return journey to Nairobi" }
      ],
      includes: ["Transportation", "Park fees", "Professional guide", "Spa entry", "Refreshments"],
      excludes: ["Lunch", "Personal expenses", "Rock climbing equipment"],
      hostName: "Grace Wanjiku", 
      hostImage: "https://images.unsplash.com/photo-1494790108755-2616b612b9cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      hostExperience: "Adventure guide for 6 years",
      languages: ["English", "Swahili"],
      maxGuests: 12,
      minimumAge: 8
    }
    // Add more experiences as needed
  ];

  useEffect(() => {
    const foundExperience = experiences.find(exp => exp.id === params.id);
    setExperience(foundExperience);
    
    // Check if favorited (in real app, this would come from user preferences)
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorited(favorites.includes(params.id));
  }, [params.id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = favorites.filter(id => id !== params.id);
    } else {
      newFavorites = [...favorites, params.id];
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Experience not found</h1>
          <button 
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            Back to Experiences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="experience-detail-container">
        {/* Back Button */}
        <motion.button
          className="back-button"
          onClick={() => router.push('/')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to experiences
        </motion.button>

        {/* Title and Favorite */}
        <motion.div 
          className="experience-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="experience-title-section">
            <h1 className="experience-detail-title">{experience.title}</h1>
            <div className="experience-meta">
              <div className="rating-section">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="star-icon">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
                <span className="rating-text">{experience.rating} ({experience.reviewCount} reviews)</span>
              </div>
              <span className="location-text">{experience.location}</span>
            </div>
          </div>
          
          <motion.button
            className={`experience-detail-heart ${isFavorited ? 'favorited' : ''}`}
            onClick={toggleFavorite}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={isFavorited ? "currentColor" : "none"}
              />
            </svg>
          </motion.button>
        </motion.div>

        {/* Image Gallery */}
        <motion.div 
          className="image-gallery"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="main-image">
            <Image
              src={experience.image}
              alt={experience.title}
              fill
              style={{ objectFit: 'cover' }}
              className="gallery-image"
            />
          </div>
          <div className="gallery-grid">
            {experience.gallery.slice(1, 3).map((img, index) => (
              <div key={index} className="gallery-item">
                <Image
                  src={img}
                  alt={`${experience.title} ${index + 2}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="gallery-image"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="experience-content-section">
          <div className="main-content">
            {/* Host Info */}
            <motion.div 
              className="host-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="host-avatar">
                <Image
                  src={experience.hostImage}
                  alt={experience.hostName}
                  width={56}
                  height={56}
                  className="host-image"
                />
              </div>
              <div className="host-info">
                <h3 className="host-name">Hosted by {experience.hostName}</h3>
                <p className="host-experience">{experience.hostExperience}</p>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div 
              className="description-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="section-title">About this experience</h2>
              <p className="description-text">{experience.description}</p>
            </motion.div>

            {/* What you'll do */}
            <motion.div 
              className="highlights-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="section-title">What you&apos;ll do</h2>
              <ul className="highlights-list">
                {experience.whatYoullDo.map((item, index) => (
                  <li key={index} className="highlight-item">{item}</li>
                ))}
              </ul>
            </motion.div>

            {/* Where we'll meet */}
            <motion.div 
              className="meeting-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="section-title">Where we&apos;ll meet</h2>
              <div className="meeting-info">
                <p className="meeting-point">{experience.meetingPoint}</p>
                <p className="meeting-details">{experience.meetingDetails}</p>
              </div>
            </motion.div>

            {/* Host Description */}
            <motion.div 
              className="host-description-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="section-title">About me</h2>
              <p className="host-description">{experience.hostDescription}</p>
            </motion.div>

            {/* Reviews */}
            {experience.reviews && experience.reviews.length > 0 && (
              <motion.div 
                className="reviews-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <h2 className="section-title">
                  {experience.rating} out of 5 stars, from {experience.reviewCount} reviews
                </h2>
                <div className="reviews-grid">
                  {experience.reviews.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">{review.name}</span>
                        {review.location && (
                          <span className="reviewer-location">{review.location}</span>
                        )}
                        <span className="review-time">{review.timeAgo}</span>
                      </div>
                      <p className="review-text">{review.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Booking Card */}
          <motion.div 
            className="booking-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="price-section">
              <span className="price-amount">From {experience.currency} {experience.price.toLocaleString()}</span>
              <span className="price-per">per guest</span>
            </div>
            
            {experience.freeCancellation && (
              <div className="cancellation-policy">
                <span>Free cancellation</span>
              </div>
            )}
            
            <div className="booking-details">
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{experience.duration}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Max guests:</span>
                <span className="detail-value">{experience.maxGuests} people</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Languages:</span>
                <span className="detail-value">{experience.languages.join(', ')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Minimum age:</span>
                <span className="detail-value">{experience.minimumAge} years</span>
              </div>
            </div>

            <button className="book-button">
              Book this experience
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

