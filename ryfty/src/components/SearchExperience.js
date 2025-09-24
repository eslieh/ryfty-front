"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function SearchExperience() {
  const [searchData, setSearchData] = useState({
    where: "",
    when: "",
  });
  const [activeField, setActiveField] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sample destination suggestions
  const destinationSuggestions = [
    "New York, NY",
    "Los Angeles, CA", 
    "Paris, France",
    "Tokyo, Japan",
    "London, UK",
    "Barcelona, Spain",
    "Amsterdam, Netherlands",
    "Berlin, Germany"
  ];

  const filteredSuggestions = destinationSuggestions.filter(destination =>
    destination.toLowerCase().includes(searchData.where.toLowerCase())
  );

  const handleFieldClick = (field) => {
    setActiveField(field);
    if (field === 'where') {
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'where') {
      setShowSuggestions(value.length > 0);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchData(prev => ({
      ...prev,
      where: suggestion
    }));
    setShowSuggestions(false);
    setActiveField(null);
  };

  const handleSearch = () => {
    if (searchData.where || searchData.when) {
      console.log("Searching with:", searchData);
      // Here you would typically call your search API
      alert(`Searching for experiences in: ${searchData.where || 'Any location'} ${searchData.when ? `on ${searchData.when}` : ''}`);
    } else {
      alert("Please enter a destination or date to search");
    }
  };

  const formatDatePlaceholder = () => {
    return searchData.when ? new Date(searchData.when).toLocaleDateString() : "Add dates";
  };

  return (
    <div className="search-experience-container">
      <motion.div 
        className="search-experience-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Where Section */}
        <motion.div 
          className={`search-experience-item ${activeField === 'where' ? 'active' : ''}`}
          onClick={() => handleFieldClick('where')}
          whileHover={{ backgroundColor: "#f7f7f7" }}
          transition={{ duration: 0.2 }}
        >
          <div className="search-experience-label">Where</div>
          <input
            type="text"
            className="search-experience-input"
            placeholder="Search destinations"
            value={searchData.where}
            onChange={(e) => handleInputChange('where', e.target.value)}
            onFocus={() => handleFieldClick('where')}
            onBlur={() => {
              setTimeout(() => {
                setActiveField(null);
                setShowSuggestions(false);
              }, 150);
            }}
          />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && activeField === 'where' && filteredSuggestions.length > 0 && (
            <motion.div 
              className="search-suggestions"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  className="search-suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="suggestion-icon">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                  </svg>
                  {suggestion}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="search-experience-divider"></div>

        {/* When Section */}
        <motion.div 
          className={`search-experience-item ${activeField === 'when' ? 'active' : ''}`}
          onClick={() => handleFieldClick('when')}
          whileHover={{ backgroundColor: "#f7f7f7" }}
          transition={{ duration: 0.2 }}
        >
          <div className="search-experience-label">When</div>
          <input
            type="date"
            className="search-experience-input"
            placeholder={formatDatePlaceholder()}
            value={searchData.when}
            onChange={(e) => handleInputChange('when', e.target.value)}
            onFocus={() => setActiveField('when')}
            onBlur={() => setActiveField(null)}
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
          />
        </motion.div>

        {/* Search Button */}
        <motion.button 
          className="search-experience-button"
          onClick={handleSearch}
          whileHover={{ scale: 1.05, backgroundColor: "var(--primary-hover)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path 
              d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  );
}