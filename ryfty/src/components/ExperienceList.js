"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function ExperienceList() {
  const [favorites, setFavorites] = useState(new Set());

  // Sample experience data based on the image
  const experiences = [
    {
      id: 1,
      title: "Explore Nairobi National Park Safari Tour",
      duration: "4.5 hours",
      rating: 4.98,
      price: 85,
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80",
      location: "Nairobi, Kenya"
    },
    {
      id: 2,
      title: "Wildlife excursion through Hell's Gate",
      duration: "5.5 hours",
      rating: 4.98,
      price: 120,
      image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Hell's Gate, Kenya"
    },
    {
      id: 3,
      title: "Lunch with fashion icon Lenny Niemeyer in her home",
      duration: "2 hours",
      rating: 5.0,
      price: 180,
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Rio de Janeiro, Brazil"
    },
    {
      id: 4,
      title: "Take in the rich history of Mombasa",
      duration: "3.5 hours",
      rating: 4.96,
      price: 95,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Mombasa, Kenya"
    },
    {
      id: 5,
      title: "Cooking class with local chef in Tuscany",
      duration: "4 hours",
      rating: 4.95,
      price: 150,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Tuscany, Italy"
    },
    {
      id: 6,
      title: "Street art tour through colorful neighborhoods",
      duration: "3 hours",
      rating: 4.92,
      price: 65,
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2058&q=80",
      location: "Berlin, Germany"
    }
  ];

  const toggleFavorite = (experienceId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(experienceId)) {
        newFavorites.delete(experienceId);
      } else {
        newFavorites.add(experienceId);
      }
      return newFavorites;
    });
  };

  return (
    <div className="experience-list-container">
      <motion.div 
        className="experience-grid"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {experiences.map((experience, index) => (
          <motion.div
            key={experience.id}
            className="experience-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut" 
            }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            {/* Image Container */}
            <div className="experience-image-container">
              <Image 
                src={experience.image} 
                alt={experience.title}
                className="experience-image"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
              />
              
              {/* Heart Icon */}
              <motion.button
                className={`experience-heart ${favorites.has(experience.id) ? 'favorited' : ''}`}
                onClick={() => toggleFavorite(experience.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={favorites.has(experience.id) ? "currentColor" : "none"}
                  />
                </svg>
              </motion.button>
            </div>

            {/* Card Content */}
            <div className="experience-content">
              <h3 className="experience-title">{experience.title}</h3>
              
              <div className="experience-details">
                <span className="experience-duration">{experience.duration}</span>
                <div className="experience-rating">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="star-icon">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="rating-score">{experience.rating}</span>
                </div>
              </div>
              
              <div className="experience-price">
                <span className="price-amount">${experience.price}</span>
                <span className="price-person">per person</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}