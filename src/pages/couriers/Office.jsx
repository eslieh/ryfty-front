import React, { useState } from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";
import { useNavigate } from "react-router-dom";

const Office = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const navigate = useNavigate();

  // Dummy data including device information
  const [data, setData] = useState({
    summary: [
      { icon: "fa-money-bill-wave", label: "Gross Earnings", value: "KES 50,000" },
      { icon: "fa-box", label: "Total Deliveries", value: "120" },
      { icon: "fa-clock", label: "Average Delivery Time", value: "45 min" },
      { icon: "fa-star", label: "Customer Rating", value: "4.8 / 5" },
      { icon: "fa-chart-line", label: "Monthly Growth", value: "+12%" },
    ],
    center: {
      id: 1,
      name: "Nairobi Main Hub",
      location: "Nairobi, Kenya",
      totalShipments: 4500,
      successfulDeliveries: 4200,
      pendingDeliveries: 200,
      failedDeliveries: 100,
      revenue: "KES 2,500,000",
      averageDeliveryTime: "2h 30m",
      activeRiders: 50,
      manager: "Eslieh Victor",
      shortcode: "1234567",
      phone: "+254712345678",
      device: {
        model: "Samsung Galaxy S21",
        lastLogin: "2025-03-21 10:45 AM",
        ipAddress: "102.68.123.45",
        status: "Active",
        batteryLevel: "85%",
        appVersion: "v2.5.3",
        os: "Android 13"
      }
    },
  });
  
  const [formData, setFormData] = useState({
    manager: data.center.manager,
    phone: data.center.phone
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSave = () => {
    setData({
      ...data,
      center: {
        ...data.center,
        manager: formData.manager,
        phone: formData.phone
      }
    });
    setIsEditing(false);
  };

  return (
    <div className="dashboard">
      <CourierNav />
      <div className="rest-body">
        <div className="tab-header">
          <div className="tab-label">
            <i
              id="backbtn"
              onClick={() => navigate("/courier/offices")}
              className="fas fa-chevron-left"
            ></i>
            {data.center.name}
          </div>
          <div className="tab-actions">
            <button className="action-btn refresh-btn">
              <i className="fas fa-sync-alt"></i>
            </button>
            <button className="action-btn">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
        
        <div className="nav-tabs">
          <div 
            className={`nav-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <i className="fas fa-info-circle"></i> Office Details
          </div>
          <div 
            className={`nav-tab ${activeTab === 'deliveries' ? 'active' : ''}`}
            onClick={() => setActiveTab('deliveries')}
          >
            <i className="fas fa-truck"></i> Deliveries
          </div>
        </div>
        
        <div className="data-to-cnters">
          <div className="dashboad-summury-data">
            {data.summary.map((summary, index) => (
              <div key={index} className="dashboard-c-containe">
                <div className="dashbpard-icon-flex">
                  <div className="icon-holder">
                    <i className={`fa-solid ${summary.icon}`}></i>
                  </div>
                  <div className="summ-lable">{summary.label}</div>
                </div>
                <div className="dashboard-data">{summary.value}</div>
              </div>
            ))}
          </div>
          
          <div className="office-details">
            <div className="office-details-header">
              <h2>Office Management</h2>
              {!isEditing && (
                <button 
                  className="edit-btn" 
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
              )}
            </div>
            
            <div className="office-info-container">
              <div className="office-info-section">
                <h3>Office Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">
                      <i className="fas fa-map-marker-alt info-icon"></i> {data.center.location}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Shortcode</span>
                    <span className="info-value">
                      <i className="fas fa-hashtag info-icon"></i> {data.center.shortcode}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total Shipments</span>
                    <span className="info-value highlight-value">
                      <i className="fas fa-box info-icon"></i> {data.center.totalShipments.toLocaleString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Active Riders</span>
                    <span className="info-value highlight-value">
                      <i className="fas fa-motorcycle info-icon"></i> {data.center.activeRiders}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="office-info-section">
                <h3>Management</h3>
                {isEditing ? (
                  <div className="edit-form">
                    <div className="form-row">
                      <label>Manager Name:</label>
                      <div className="input-with-icon">
                        <i className="fas fa-user input-icon"></i>
                        <input 
                          type="text" 
                          name="manager" 
                          value={formData.manager} 
                          onChange={handleInputChange} 
                          placeholder="Manager Name"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <label>Phone Number:</label>
                      <div className="input-with-icon">
                        <i className="fas fa-phone input-icon"></i>
                        <input 
                          type="text" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleInputChange} 
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button 
                        className="save-btn" 
                        onClick={handleSave}
                      >
                        <i className="fas fa-check"></i> Save Changes
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            manager: data.center.manager,
                            phone: data.center.phone
                          });
                        }}
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Manager</span>
                      <span className="info-value">
                        <i className="fas fa-user info-icon"></i> {data.center.manager}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone</span>
                      <span className="info-value">
                        <i className="fas fa-phone info-icon"></i> {data.center.phone}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="office-info-section device-section">
                <div className="device-header">
                  <h3>Manager Device</h3>
                  <div className={`device-status-badge ${data.center.device.status.toLowerCase()}`}>
                    {data.center.device.status}
                  </div>
                </div>
                
                <div className="device-info">
                  <div className="device-image">
                    <i className="fas fa-mobile-alt"></i>
                    <div className="battery-indicator">
                      <div className="battery-level" style={{width: data.center.device.batteryLevel}}></div>
                      <span>{data.center.device.batteryLevel}</span>
                    </div>
                  </div>
                  
                  <div className="device-details">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Device</span>
                        <span className="info-value">{data.center.device.model}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">OS</span>
                        <span className="info-value">{data.center.device.os}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">App Version</span>
                        <span className="info-value">{data.center.device.appVersion}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Last Active</span>
                        <span className="info-value">{data.center.device.lastLogin}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">IP Address</span>
                        <span className="info-value">{data.center.device.ipAddress}</span>
                      </div>
                    </div>
                    
                    <div className="device-actions">
                      <button className="device-action-btn">
                        <i className="fas fa-bell"></i> Send Alert
                      </button>
                      <button className="device-action-btn">
                        <i className="fas fa-sync"></i> Refresh Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Office;