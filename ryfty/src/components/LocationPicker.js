"use client";

/**
 * LocationPicker Component
 * 
 * An interactive map component using OpenStreetMap that allows users to:
 * - Search for places using OpenStreetMap's Nominatim API
 * - Click on the map to select a location
 * - Use their current location via geolocation API
 * - Automatically reverse geocode coordinates to get address
 * 
 * Features:
 * - Place search with autocomplete dropdown
 * - Interactive map with click-to-select functionality
 * - Current location detection with permission handling
 * - Reverse geocoding to display address
 * - Responsive design for mobile and desktop
 * - Debounced search to prevent excessive API calls
 * - Automatic coordinate population (no manual input required)
 * 
 * @param {number} latitude - Current latitude value
 * @param {number} longitude - Current longitude value
 * @param {function} onLocationChange - Callback when location changes (lat, lng)
 * @param {function} onAddressChange - Callback when address changes (address)
 * @param {string} className - Additional CSS classes
 */

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for selected location
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map click events
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to handle map view updates
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom || 13, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  
  return null;
}

const LocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  onAddressChange,
  className = '' 
}) => {
  const [position, setPosition] = useState([latitude || -1.2921, longitude || 36.8219]); // Default to Nairobi
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Reverse geocoding function with improved address formatting - Kenya focused
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=en`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        let formattedAddress = '';
        
        // Build address from most specific to general
        const addressParts = [];
        
        // Prioritize place names and specific locations
        if (addr.tourism) {
          addressParts.push(addr.tourism);
        } else if (addr.amenity) {
          addressParts.push(addr.amenity);
        } else if (addr.leisure) {
          addressParts.push(addr.leisure);
        } else if (addr.shop) {
          addressParts.push(addr.shop);
        } else if (addr.building) {
          addressParts.push(addr.building);
        } else if (addr.house_number) {
          addressParts.push(addr.house_number);
        }
        
        // Add road/street name for context
        if (addr.road && !addressParts.includes(addr.road)) {
          addressParts.push(addr.road);
        } else if (addr.pedestrian && !addressParts.includes(addr.pedestrian)) {
          addressParts.push(addr.pedestrian);
        } else if (addr.footway && !addressParts.includes(addr.footway)) {
          addressParts.push(addr.footway);
        } else if (addr.path && !addressParts.includes(addr.path)) {
          addressParts.push(addr.path);
        }
        
        // Add suburb/neighbourhood
        if (addr.suburb) {
          addressParts.push(addr.suburb);
        } else if (addr.neighbourhood) {
          addressParts.push(addr.neighbourhood);
        } else if (addr.hamlet) {
          addressParts.push(addr.hamlet);
        }
        
        // Add city/town
        if (addr.city) {
          addressParts.push(addr.city);
        } else if (addr.town) {
          addressParts.push(addr.town);
        } else if (addr.village) {
          addressParts.push(addr.village);
        }
        
        // Add county (modern Kenya administrative division)
        if (addr.county) {
          addressParts.push(addr.county + ' County');
        }
        
        // Add country
        if (addr.country) {
          addressParts.push(addr.country);
        }
        
        // Join parts with commas
        formattedAddress = addressParts.join(', ');
        
        // Fallback to display_name if our formatting is too short
        if (formattedAddress.length < 10) {
          formattedAddress = data.display_name;
        }
        
        setAddress(formattedAddress);
        onAddressChange && onAddressChange(formattedAddress);
        return formattedAddress;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    return '';
  };

  // Helper function to format search result addresses - prioritize place names
  const formatSearchAddress = (place) => {
    const addr = place.address;
    if (!addr) return place.display_name;
    
    const addressParts = [];
    
    // Prioritize place names over road addresses
    if (place.name && place.name !== addr.road) {
      // Use the place name if it's different from the road
      addressParts.push(place.name);
    } else if (addr.tourism) {
      // Tourism attractions (parks, monuments, etc.)
      addressParts.push(addr.tourism);
    } else if (addr.amenity) {
      // Amenities (restaurants, hotels, etc.)
      addressParts.push(addr.amenity);
    } else if (addr.leisure) {
      // Leisure facilities (parks, sports, etc.)
      addressParts.push(addr.leisure);
    } else if (addr.shop) {
      // Shops
      addressParts.push(addr.shop);
    } else if (addr.building) {
      // Building names
      addressParts.push(addr.building);
    } else if (addr.house_number) {
      // House numbers
      addressParts.push(addr.house_number);
    }
    
    // Add road/street name for context
    if (addr.road && !addressParts.includes(addr.road)) {
      addressParts.push(addr.road);
    } else if (addr.pedestrian && !addressParts.includes(addr.pedestrian)) {
      addressParts.push(addr.pedestrian);
    }
    
    // Add suburb/neighbourhood for context
    if (addr.suburb && !addressParts.includes(addr.suburb)) {
      addressParts.push(addr.suburb);
    } else if (addr.neighbourhood && !addressParts.includes(addr.neighbourhood)) {
      addressParts.push(addr.neighbourhood);
    }
    
    // Add city/town
    if (addr.city && !addressParts.includes(addr.city)) {
      addressParts.push(addr.city);
    } else if (addr.town && !addressParts.includes(addr.town)) {
      addressParts.push(addr.town);
    } else if (addr.village && !addressParts.includes(addr.village)) {
      addressParts.push(addr.village);
    }
    
    // Add county
    if (addr.county && !addressParts.includes(addr.county + ' County')) {
      addressParts.push(addr.county + ' County');
    }
    
    // Add country
    if (addr.country && !addressParts.includes(addr.country)) {
      addressParts.push(addr.country);
    }
    
    const formattedAddress = addressParts.join(', ');
    return formattedAddress.length > 10 ? formattedAddress : place.display_name;
  };

  // Forward geocoding function for search - Kenya focused
  const searchPlaces = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // First search specifically in Kenya with place-focused parameters
      const kenyaResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke&limit=6&addressdetails=1&bounded=1&viewbox=33.9,-4.7,41.9,5.5&featuretype=settlement,country,state,county,district,locality,neighbourhood,suburb,quarter,hamlet,village,town,city,municipality,island,archipelago,airport,station,poi&class=place,amenity,tourism,leisure,shop,building`
      );
      const kenyaData = await kenyaResponse.json();
      
      let allResults = [];
      
      // Process Kenya results first
      if (kenyaData && Array.isArray(kenyaData)) {
        const kenyaResults = kenyaData.map(place => ({
          id: place.place_id,
          name: formatSearchAddress(place),
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
          type: place.type,
          importance: place.importance,
          country: 'Kenya',
          isKenya: true
        }));
        allResults = [...kenyaResults];
      }
      
        // If we have less than 5 results, search globally for more
        if (allResults.length < 5) {
          const globalResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&exclude_place_ids=${allResults.map(r => r.id).join(',')}&featuretype=settlement,country,state,county,district,locality,neighbourhood,suburb,quarter,hamlet,village,town,city,municipality,island,archipelago,airport,station,poi&class=place,amenity,tourism,leisure,shop,building`
          );
        const globalData = await globalResponse.json();
        
        if (globalData && Array.isArray(globalData)) {
          const globalResults = globalData.map(place => ({
            id: place.place_id,
            name: formatSearchAddress(place),
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
            type: place.type,
            importance: place.importance,
            country: place.address?.country || 'Unknown',
            isKenya: place.address?.country === 'Kenya'
          }));
          
          // Add global results, but prioritize Kenya ones
          const nonKenyaResults = globalResults.filter(r => !r.isKenya);
          allResults = [...allResults, ...nonKenyaResults];
        }
      }
      
      // Sort results: Kenya first, then by importance
      const sortedResults = allResults.sort((a, b) => {
        if (a.isKenya && !b.isKenya) return -1;
        if (!a.isKenya && b.isKenya) return 1;
        return b.importance - a.importance;
      });
      
      setSearchResults(sortedResults.slice(0, 5)); // Limit to 5 results
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(query);
    }, 300); // 300ms debounce
  };

  // Handle search result selection
  const handleSearchResultSelect = async (result) => {
    setPosition([result.lat, result.lng]);
    onLocationChange(result.lat, result.lng);
    setAddress(result.name);
    onAddressChange && onAddressChange(result.name);
    setSearchQuery(result.name);
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Set appropriate zoom level based on place type
    let zoomLevel = 13; // Default zoom
    if (result.type === 'country') zoomLevel = 6;
    else if (result.type === 'state' || result.type === 'region') zoomLevel = 8;
    else if (result.type === 'city' || result.type === 'town') zoomLevel = 11;
    else if (result.type === 'suburb' || result.type === 'neighbourhood') zoomLevel = 14;
    else if (result.type === 'building' || result.type === 'house') zoomLevel = 18;
    
    setMapZoom(zoomLevel);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.location-search')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Handle location selection from map click
  const handleLocationSelect = async (lat, lng) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
    
    // Reverse geocode to get address
    await reverseGeocode(lat, lng);
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        onLocationChange(latitude, longitude);
        
        // Reverse geocode to get address
        await reverseGeocode(latitude, longitude);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to retrieve your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        alert(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };


  return (
    <div className={`location-picker ${className}`}>
      <div className="location-picker-header">
        <h3>Select Location</h3>
        <p>Choose your meeting point by searching, clicking on the map, or using your current location</p>
      </div>

      <div className="location-search">
        <div className="search-input-container">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for a place in Kenya (e.g., Nairobi National Park, Maasai Mara, Mombasa)"
            className="search-input"
          />
          {isSearching && (
            <div className="search-loading">
              <div className="spinner small"></div>
            </div>
          )}
        </div>
        
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="search-result-item"
                onClick={() => handleSearchResultSelect(result)}
              >
                <div className="result-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="result-content">
                  <div className="result-name">{result.name}</div>
                  <div className="result-type">
                    {result.type} {result.isKenya && <span className="kenya-badge">🇰🇪 Kenya</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="location-picker-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <>
              <div className="spinner small"></div>
              Getting Location...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" fill="currentColor"/>
              </svg>
              Use Current Location
            </>
          )}
        </button>
      </div>

      <div className="map-container">
        <MapContainer
          center={position}
          zoom={mapZoom}
          style={{ height: '400px', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={position} icon={customIcon}>
            <Popup>
              <div className="marker-popup">
                <strong>Selected Location</strong>
                {address && (
                  <>
                    <br />
                    <small>{address}</small>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
          
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <MapViewUpdater center={position} zoom={mapZoom} />
        </MapContainer>
      </div>

      {address && (
        <div className="selected-address">
          <label>Selected Address:</label>
          <p>{address}</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
