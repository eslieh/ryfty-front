import React, { useState } from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";
import "../../styles/company.css";
const Company = () => {
  // Sample company data - in a real app, this would come from an API or context
  const [companyData, setCompanyData] = useState({
    name: "Eslieh Courier",
    logo: "https://i.pinimg.com/736x/74/8b/ad/748bad27dd3994530d272927aba611a4.jpg", // Path to company logo
    established: "2018",
    subscription: {
      plan: "Professional",
      price: "$199/month",
      billingCycle: "Monthly",
      nextBilling: "April 21, 2025",
      features: [
        "Up to 1,000 deliveries/month",
        "10 fulfillment centers",
        "50 courier accounts",
        "Real-time tracking",
        "Advanced analytics",
        "API access",
        "24/7 support"
      ]
    },
    contact: {
      email: "info@expressdelivery.com",
      phone: "+1 (555) 123-4567",
      address: "123 Logistics Way, Shipping District, NY 10001"
    },
    stats: {
      fulfillmentCenters: 7,
      activeVehicles: 68,
      totalCouriers: 42
    }
  });

  // Toggle for password change form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Handler for password form
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  // Handler for password form submission
  const submitPasswordChange = (e) => {
    e.preventDefault();
    // Password validation and API call would go here
    alert("Password changed successfully!");
    setShowPasswordForm(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  // Handler for logout
  const handleLogout = () => {
    // Logout logic would go here (clear tokens, redirect, etc.)
    alert("Logging out...");
    // window.location.href = "/login";
  };

  return (
    <div className="dashboard bolt-theme">
      <CourierNav />
      
      {/* Top Bar with User Controls */}
      <div className="bolt-top-bar">
        <div className="bolt-top-left">
          <h2>Company Profile</h2>
        </div>
        <div className="bolt-top-right">
          <button className="bolt-btn bolt-btn-password" onClick={() => setShowPasswordForm(true)}>
            <i className="fas fa-key"></i>
            <span>Change Password</span>
          </button>
          <button className="bolt-btn bolt-btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      <div className="rest-body">
        <div className="bolt-company-container">
          {/* Company Header Section */}
          <div className="bolt-company-header">
            <div className="bolt-company-logo-container">
              {companyData.logo ? (
                <img src={companyData.logo} alt="Company Logo" className="bolt-company-logo" />
              ) : (
                <div className="bolt-company-logo-placeholder">
                  <i className="fas fa-truck-loading"></i>
                </div>
              )}
              <button className="bolt-update-logo-btn">
                <i className="fas fa-camera"></i>
              </button>
            </div>
            <div className="bolt-company-title">
              <h1>{companyData.name}</h1>
              <p>Established {companyData.established}</p>
              <div className="bolt-company-badges">
                <span className="bolt-badge bolt-verified">
                  <i className="fas fa-check-circle"></i> Verified
                </span>
                <span className="bolt-badge bolt-subscription">
                  <i className="fas fa-star"></i> {companyData.subscription.plan}
                </span>
              </div>
            </div>
            <div className="bolt-company-actions">
              <button className="bolt-btn-primary">
                <i className="fas fa-edit"></i> Edit Details
              </button>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="bolt-quick-stats">
            <div className="bolt-stat-item">
              <i className="fas fa-warehouse"></i>
              <div className="bolt-stat-details">
                <span className="bolt-stat-value">{companyData.stats.fulfillmentCenters}</span>
                <span className="bolt-stat-label">Fulfillment Centers</span>
              </div>
            </div>
            <div className="bolt-stat-item">
              <i className="fas fa-truck"></i>
              <div className="bolt-stat-details">
                <span className="bolt-stat-value">{companyData.stats.activeVehicles}</span>
                <span className="bolt-stat-label">Active Vehicles</span>
              </div>
            </div>
            <div className="bolt-stat-item">
              <i className="fas fa-users"></i>
              <div className="bolt-stat-details">
                <span className="bolt-stat-value">{companyData.stats.totalCouriers}</span>
                <span className="bolt-stat-label">Couriers</span>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="bolt-company-content">
            {/* Left Column - Company Info */}
            <div className="bolt-company-info">
              <div className="bolt-card">
                <div className="bolt-card-header">
                  <h2>Contact Information</h2>
                  <button className="bolt-btn-icon">
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
                <div className="bolt-card-body">
                  <div className="bolt-info-item">
                    <i className="fas fa-envelope"></i>
                    <div>
                      <span className="bolt-info-label">Email</span>
                      <span className="bolt-info-value">{companyData.contact.email}</span>
                    </div>
                  </div>
                  <div className="bolt-info-item">
                    <i className="fas fa-phone"></i>
                    <div>
                      <span className="bolt-info-label">Phone</span>
                      <span className="bolt-info-value">{companyData.contact.phone}</span>
                    </div>
                  </div>
                  <div className="bolt-info-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <div>
                      <span className="bolt-info-label">Address</span>
                      <span className="bolt-info-value">{companyData.contact.address}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bolt-card">
                <div className="bolt-card-header">
                  <h2>Documents</h2>
                </div>
                <div className="bolt-card-body">
                  <div className="bolt-document-item">
                    <i className="fas fa-file-pdf"></i>
                    <div>
                      <span className="bolt-doc-name">Business Registration</span>
                      <span className="bolt-doc-date">Uploaded on Feb 12, 2025</span>
                    </div>
                    <button className="bolt-btn-icon">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                  <div className="bolt-document-item">
                    <i className="fas fa-file-contract"></i>
                    <div>
                      <span className="bolt-doc-name">Service Agreement</span>
                      <span className="bolt-doc-date">Uploaded on Jan 05, 2025</span>
                    </div>
                    <button className="bolt-btn-icon">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                  <div className="bolt-document-item">
                    <i className="fas fa-file-invoice"></i>
                    <div>
                      <span className="bolt-doc-name">Latest Invoice</span>
                      <span className="bolt-doc-date">Generated on Mar 01, 2025</span>
                    </div>
                    <button className="bolt-btn-icon">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                  <button className="bolt-btn-outline bolt-upload-btn">
                    <i className="fas fa-upload"></i> Upload New Document
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Column - Subscription & Quick Actions */}
            <div className="bolt-company-controls">
              <div className="bolt-card bolt-subscription-card">
                <div className="bolt-subscription-header">
                  <div>
                    <h2>Subscription Plan</h2>
                    <span className="bolt-plan-name">{companyData.subscription.plan}</span>
                  </div>
                  <div className="bolt-plan-price">
                    <span>{companyData.subscription.price}</span>
                    <small>({companyData.subscription.billingCycle})</small>
                  </div>
                </div>
                <div className="bolt-subscription-details">
                  <div className="bolt-next-billing">
                    <span className="bolt-label">Next billing date:</span>
                    <span className="bolt-value">{companyData.subscription.nextBilling}</span>
                  </div>
                  <div className="bolt-plan-features">
                    <h3>Plan Features</h3>
                    <ul>
                      {companyData.subscription.features.map((feature, index) => (
                        <li key={index}>
                          <i className="fas fa-check"></i> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="bolt-btn-primary bolt-upgrade-btn">
                    <i className="fas fa-arrow-up"></i> Upgrade Plan
                  </button>
                </div>
              </div>
              
              <div className="bolt-card">
                <div className="bolt-card-header">
                  <h2>Quick Actions</h2>
                </div>
                <div className="bolt-quick-actions">
                  <button className="bolt-action-btn">
                    <i className="fas fa-warehouse"></i>
                    <span>Add Fulfillment Center</span>
                  </button>
                  <button className="bolt-action-btn">
                    <i className="fas fa-truck"></i>
                    <span>Add Vehicle</span>
                  </button>
                  <button className="bolt-action-btn">
                    <i className="fas fa-user-plus"></i>
                    <span>Invite Courier</span>
                  </button>
                  <button className="bolt-action-btn" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                    <i className="fas fa-key"></i>
                    <span>Change Password</span>
                  </button>
                  <button className="bolt-action-btn">
                    <i className="fas fa-bell"></i>
                    <span>Notification Settings</span>
                  </button>
                  <button className="bolt-action-btn">
                    <i className="fas fa-credit-card"></i>
                    <span>Billing Information</span>
                  </button>
                  <button className="bolt-action-btn bolt-logout-btn" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
              
              {/* Password Change Form */}
              {showPasswordForm && (
                <div className="bolt-card bolt-password-form">
                  <div className="bolt-card-header">
                    <h2>Change Password</h2>
                    <button className="bolt-btn-icon" onClick={() => setShowPasswordForm(false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="bolt-card-body">
                    <form onSubmit={submitPasswordChange}>
                      <div className="bolt-form-group">
                        <label>Current Password</label>
                        <div className="bolt-password-input">
                          <input 
                            type="password" 
                            name="currentPassword" 
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                          <i className="fas fa-eye-slash"></i>
                        </div>
                      </div>
                      <div className="bolt-form-group">
                        <label>New Password</label>
                        <div className="bolt-password-input">
                          <input 
                            type="password" 
                            name="newPassword" 
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                          <i className="fas fa-eye-slash"></i>
                        </div>
                      </div>
                      <div className="bolt-form-group">
                        <label>Confirm New Password</label>
                        <div className="bolt-password-input">
                          <input 
                            type="password" 
                            name="confirmPassword" 
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                          <i className="fas fa-eye-slash"></i>
                        </div>
                      </div>
                      <div className="bolt-form-actions">
                        <button type="button" className="bolt-btn-outline" onClick={() => setShowPasswordForm(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="bolt-btn-primary">
                          Change Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Company;