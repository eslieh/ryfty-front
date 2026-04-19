"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile, fetchUserReservations } from "@/utils/api";
import {
  compressImageWithPreset,
  validateImageFile,
} from "@/utils/imageCompression";
import config from "@/config";
import "@/styles/profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    updateProfile,
    logout,
    isProvider,
    switchRole,
  } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar_url: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("about"); // 'about', 'past-trips', 'connections'
  const [pastTrips, setPastTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const isUserProvider = isProvider();

  const fileInputRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth?mode=login");
    }
  }, [isAuthenticated, router]);

  // Handle URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["about", "past-trips", "connections"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Initialize profile data from AuthContext
  useEffect(() => {
    if (user) {
      setProfileData(user);
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  // Fetch past trips when switching to past-trips tab
  useEffect(() => {
    if (activeTab === "past-trips" && isAuthenticated) {
      loadPastTrips();
    }
  }, [activeTab, isAuthenticated]);

  const loadPastTrips = async () => {
    setLoadingTrips(true);
    try {
      const response = await fetchUserReservations(1, 100);
      if (response.reservations) {
        // Filter for passed/checked-in trips
        const now = new Date();
        const passed = response.reservations.filter((r) => {
          const reservationDate = new Date(r.slot?.date);
          return (
            reservationDate < now || r.checked_in || r.status === "completed"
          );
        });
        setPastTrips(passed);
      }
    } catch (err) {
      console.error("Error loading past reservations:", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Group past trips by year
  const groupedTrips = pastTrips.reduce((acc, trip) => {
    const dateStr = trip.slot?.date;
    if (!dateStr) return acc;
    const year = new Date(dateStr).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(trip);
    return acc;
  }, {});

  const years = Object.keys(groupedTrips).sort((a, b) => b - a);

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file, 10 * 1024 * 1024);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const compressedBlob = await compressImageWithPreset(file, "avatar");

      const uploadFormData = new FormData();
      uploadFormData.append("file", compressedBlob, "avatar.jpg");
      uploadFormData.append(
        "upload_preset",
        config.upload.cloudinary.uploadPreset,
      );
      uploadFormData.append("folder", "avatars");

      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.upload.cloudinary.cloudName}/image/upload`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const result = await uploadResponse.json();
      const transformedUrl = applyAvatarTransformations(result.secure_url);

      setFormData((prev) => ({ ...prev, avatar_url: transformedUrl }));
      await updateProfile({ avatar_url: transformedUrl });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(`Failed to upload avatar: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const applyAvatarTransformations = (url) => {
    if (!url.includes("cloudinary.com")) return url;
    const parts = url.split("/upload/");
    if (parts.length < 2) return url;
    return `${parts[0]}/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/${parts[1]}`;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setProfileData(result.user);
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "#28a745";
      case "pending":
        return "#ffc107";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  if (!isAuthenticated || !profileData) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="profile-layout-container">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="user-brief">
            <div className="avatar-wrapper">
              <NextImage
                src={profileData.avatar_url || "/placeholder-avatar.jpg"}
                alt={profileData.name}
                width={64}
                height={64}
                className="sidebar-avatar"
              />
            </div>
          </div>

          <div className="sidebar-cta-section">
            {!isUserProvider ? (
              <div className="provider-cta-card">
                <div className="cta-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>Earn as a provider</h3>
                <p>Share your passion and earn money hosting experiences.</p>
                <button
                  className="become-provider-btn"
                  onClick={() => router.push("/host-experience")}
                >
                  Get started
                </button>
              </div>
            ) : (
              <button
                className="switch-role-btn"
                onClick={async () => {
                  setSwitchingRole(true);
                  try {
                    const result = await switchRole("provider");
                    if (result.success) {
                      router.push("/provider");
                    }
                  } catch (err) {
                    console.error("Error switching role:", err);
                  } finally {
                    setSwitchingRole(false);
                  }
                }}
                disabled={switchingRole}
              >
                <div className="nav-icon">
                  {switchingRole ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span>{switchingRole ? "Switching..." : "Switch to providing"}</span>
              </button>
            )}
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item-p ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              <div className="nav-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>About me</span>
            </button>

            <button
              className={`nav-item-p ${activeTab === "past-trips" ? "active" : ""}`}
              onClick={() => setActiveTab("past-trips")}
            >
              <div className="nav-icon">
                <div className="icon-image-mini">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7M7 7H17M7 7V5M17 7V5M5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9C3 7.89543 3.89543 7 5 7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <span>Past Experiences</span>
            </button>

            <button
              className={`nav-item-p ${activeTab === "connections" ? "active" : ""}`}
              onClick={() => setActiveTab("connections")}
            >
              <div className="nav-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M9 7C11.2091 7 13 8.79086 13 11C13 13.2091 11.2091 15 9 15C6.79086 15 5 13.2091 5 11C5 8.79086 6.79086 7 9 7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>Connections</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button onClick={handleLogout} className="sidebar-logout">
              Logout
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="profile-main">
          <AnimatePresence mode="wait">
            {activeTab === "about" && (
              <motion.div
                key="about"
                className="tab-content about-me"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="content-title">About me</h1>

                <div className="about-me-card">
                  <div className="avatar-edit-section">
                    <div className="avatar-big-container">
                      <NextImage
                        src={formData.avatar_url || "/placeholder-avatar.jpg"}
                        alt={formData.name}
                        width={120}
                        height={120}
                        className="avatar-big"
                      />
                      <button
                        className="change-avatar-btn"
                        onClick={() => fileInputRef.current.click()}
                      >
                        {uploadingAvatar ? "..." : "Change photo"}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleAvatarUpload}
                        hidden
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="profile-form">
                      <div className="field-group">
                        <label>Name</label>
                        <input
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="Your name"
                        />
                      </div>
                      <div className="field-group">
                        <label>Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) =>
                            handleInputChange("bio", e.target.value)
                          }
                          placeholder="Tell others about yourself"
                          rows={5}
                        />
                      </div>
                      <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "past-trips" && (
              <motion.div
                key="past-trips"
                className="tab-content past-trips"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="content-title">Past Experiences</h1>

                {loadingTrips ? (
                  <div className="loading-state">
                    Loading your Experience history...
                  </div>
                ) : years.length > 0 ? (
                  <div className="years-container">
                    {years.map((year) => (
                      <div key={year} className="year-section">
                        <div className="year-badge">{year}</div>
                        <div className="timeline-container">
                          {groupedTrips[year].map((trip, index) => (
                            <div key={trip.id} className="timeline-item">
                              <div className="timeline-marker">
                                <div className="marker-dot"></div>
                                {index !== groupedTrips[year].length - 1 && (
                                  <div className="marker-line"></div>
                                )}
                              </div>

                              <motion.div
                                className="trip-card"
                                whileHover={{ y: -4 }}
                                onClick={() =>
                                  router.push(`/reservations/d/${trip.id}`)
                                }
                              >
                                <div className="trip-image">
                                  <NextImage
                                    src={
                                      trip.experience.poster_image_url ||
                                      "/placeholder-image.jpg"
                                    }
                                    alt={trip.experience.title}
                                    fill
                                    style={{ objectFit: "cover" }}
                                  />
                                </div>

                                <div className="trip-content">
                                  <div className="trip-info">
                                    <h3 className="trip-title">
                                      {trip.experience.title}
                                    </h3>
                                    <p className="trip-description">
                                      {trip.experience.description}
                                    </p>
                                    <p className="trip-date">
                                      {formatDate(trip.slot?.date)}
                                    </p>
                                  </div>

                                  <div className="trip-status">
                                    <span
                                      className="status-pill"
                                      style={{
                                        backgroundColor: `${getStatusColor(trip.status)}15`,
                                        color: getStatusColor(trip.status),
                                      }}
                                    >
                                      {trip.status}
                                    </span>
                                  </div>

                                  <div className="trip-arrow">
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        d="M9 18L15 12L9 6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-trips">
                    You haven't taken any Experiences yet.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "connections" && (
              <motion.div
                key="connections"
                className="tab-content connections"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="content-title">Connections</h1>
                <div className="placeholder-content">
                  <div className="coming-soon">Coming Soon</div>
                  <p>
                    Stay tuned for easier ways to connect with fellow travelers
                    and hosts.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Footer />
    </div>
  );
}
