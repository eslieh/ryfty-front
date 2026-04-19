"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { fetchUserReservations } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";
import "@/styles/reservations.css";

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth?mode=login");
    }
  }, [isAuthenticated, router]);

  // Fetch reservations
  useEffect(() => {
    const loadReservations = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetchUserReservations(currentPage, 10);

        if (response.reservations) {
          // Filter out passed reservations as they should be seen in Profile
          setReservations(
            response.reservations.filter((r) => !isPassedReservation(r)),
          );
          setPagination(response.pagination);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError(err.message || "Failed to load reservations");
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [isAuthenticated, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
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

  // Helper function to check if a reservation is passed
  const isPassedReservation = (reservation) => {
    const now = new Date();
    const reservationDate = new Date(reservation.slot?.date);
    return reservationDate < now && !reservation.checked_in;
  };

  const ReservationItem = ({ reservation, isLast }) => {
    return (
      <div className="timeline-item">
        <div className="timeline-marker">
          <div className="marker-dot"></div>
          {!isLast && <div className="marker-line"></div>}
        </div>

        <motion.div
          className="trip-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ y: -4 }}
          onClick={() => router.push(`/reservations/d/${reservation.id}`)}
        >
          <div className="trip-image">
            <Image
              src={
                reservation.experience.poster_image_url ||
                "/placeholder-image.jpg"
              }
              alt={reservation.experience.title}
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="trip-content">
            <div className="trip-info">
              <h3 className="trip-title">{reservation.experience.title}</h3>
              <p className="trip-description">
                {reservation.experience.description}
              </p>
              <p className="trip-date">{formatDate(reservation.slot?.date)}</p>
            </div>

            <div className="trip-status">
              <span
                className="status-pill"
                style={{
                  backgroundColor: `${getStatusColor(reservation.status)}15`,
                  color: getStatusColor(reservation.status),
                }}
              >
                {reservation.status}
              </span>
            </div>

            <div className="trip-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    );
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="reservations-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your reservations...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="reservations-container">
        <motion.div
          className="reservations-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="reservations-title">My Reservations</h1>
        </motion.div>

        {reservations.length > 0 ? (
          <div className="trips-content">
            <div className="timeline-container">
              {reservations.map((reservation, index) => (
                <ReservationItem
                  key={reservation.id}
                  reservation={reservation}
                  isLast={index === reservations.length - 1}
                />
              ))}
            </div>

            {/* Past trips banner */}
            <motion.div
              className="past-trips-banner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => router.push("/profile?tab=past-trips")}
            >
              <div className="banner-left">
                <span>Find past reservations in your profile</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="banner-right">
                <div className="suitcase-icon">
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
            </motion.div>
          </div>
        ) : (
          <div className="empty-trips-container">
            <div className="empty-left">
              <div className="decoration-timeline">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="decoration-item">
                    <div className="marker">
                      <div className="dot"></div>
                      {i !== 3 && <div className="line"></div>}
                    </div>
                    <div className="skeleton-card">
                      <div className="skeleton-image"></div>
                      <div className="skeleton-lines">
                        <div className="line-long"></div>
                        <div className="line-short"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="empty-right">
              <h2 className="empty-title">Build the perfect trip</h2>
              <p className="empty-text">
                Explore homes, experiences, and services. When you book, your
                reservations will show up here.
              </p>
              <button
                className="get-started-btn"
                onClick={() => router.push("/")}
              >
                Get started
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
