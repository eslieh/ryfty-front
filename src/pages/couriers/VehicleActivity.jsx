import React, { useState, useEffect } from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";

const VehicleActivity = () => {
  // Sample data - in a real app, you would fetch this from an API
  const [vehicle, setVehicle] = useState({
    id: "V-8572",
    type: "truck",
    name: "Courier Truck 572",
    licensePlate: "ABC 123",
    make: "Mercedes-Benz",
    model: "Sprinter",
    year: 2022,
    driver: "John Smith",
    status: "active",
    fuelEfficiency: "8.7L/100km",
    totalRevenue: 38475.50,
    totalTrips: 287,
    totalDistance: 12483,
    maintenanceStatus: "Good",
    nextService: "2025-04-15"
  });
  
  const [activityPeriod, setActivityPeriod] = useState("week");
  const [routeData, setRouteData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sample activity metrics
  const activityMetrics = {
    day: { trips: 4, distance: 287, revenue: 520.75, fuelUsed: 28.5 },
    week: { trips: 26, distance: 1824, revenue: 3245.50, fuelUsed: 174.3 },
    month: { trips: 104, distance: 7392, revenue: 12980, fuelUsed: 697.2 },
    year: { trips: 1248, distance: 88704, revenue: 155760, fuelUsed: 8366.4 }
  };
  
  // Mock route data
  const mockRouteData = [
    {
      id: 1,
      date: "2025-03-21",
      startTime: "08:30",
      endTime: "10:45",
      origin: "Central Warehouse",
      destination: "Downtown Mall",
      distance: 42,
      duration: 135,
      packages: 18,
      revenue: 245.00,
      status: "completed"
    },
    {
      id: 2,
      date: "2025-03-21",
      startTime: "11:30",
      endTime: "13:15",
      origin: "Downtown Mall",
      destination: "North District Hub",
      distance: 28,
      duration: 105,
      packages: 12,
      revenue: 165.50,
      status: "completed"
    },
    {
      id: 3,
      date: "2025-03-20",
      startTime: "09:15",
      endTime: "12:30",
      origin: "Central Warehouse",
      destination: "Airport Logistics Center",
      distance: 56,
      duration: 195,
      packages: 24,
      revenue: 320.00,
      status: "completed"
    },
    {
      id: 4,
      date: "2025-03-20",
      startTime: "14:00",
      endTime: "16:30",
      origin: "Airport Logistics Center",
      destination: "Central Warehouse",
      distance: 52,
      duration: 150,
      packages: 14,
      revenue: 285.00,
      status: "completed"
    },
    {
      id: 5,
      date: "2025-03-19",
      startTime: "08:00",
      endTime: "14:30",
      origin: "Central Warehouse",
      destination: "Multiple Destinations",
      distance: 98,
      duration: 390,
      packages: 32,
      revenue: 540.00,
      status: "completed"
    }
  ];
  
  // Simulate loading data
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setRouteData(mockRouteData);
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  const goBack = () => {
    window.history.back();
  };
  return (
    <div className="dashboard">
      <CourierNav />
      <div className="rest-body">
        <div className="vehicle-activity-container">
          {/* Back button */}
          <div className="back-button" onClick={goBack}>
            <i className="fas fa-arrow-left"></i>
            <span>Back to Vehicles</span>
          </div>
          
          {/* Vehicle header */}
          <div className="vehicle-header">
            <div className="vehicle-icon-container">
              <i className={`fas ${vehicle.type === "truck" ? "fa-truck" : "fa-bus"} vehicle-icon`}></i>
            </div>
            <div className="vehicle-info">
              <h1>{vehicle.name}</h1>
              <div className="vehicle-meta">
                <span className="license-plate">{vehicle.licensePlate}</span>
                <span className="divider">•</span>
                <span className="make-model">{vehicle.make} {vehicle.model} ({vehicle.year})</span>
              </div>
              <div className="vehicle-status">
                <span className={`status-indicator ${vehicle.status}`}></span>
                <span className="status-text">{vehicle.status === "active" ? "Active" : vehicle.status}</span>
                <span className="divider">•</span>
                <span className="driver-name">
                  <i className="fas fa-user"></i> {vehicle.driver}
                </span>
              </div>
            </div>
          </div>
          
          {/* Performance metrics */}
          <div className="metrics-period-selector">
            <h2>Performance Overview</h2>
            <div className="period-tabs">
              <button 
                className={activityPeriod === "day" ? "active" : ""} 
                onClick={() => setActivityPeriod("day")}
              >
                Today
              </button>
              <button 
                className={activityPeriod === "week" ? "active" : ""} 
                onClick={() => setActivityPeriod("week")}
              >
                This Week
              </button>
              <button 
                className={activityPeriod === "month" ? "active" : ""} 
                onClick={() => setActivityPeriod("month")}
              >
                This Month
              </button>
              <button 
                className={activityPeriod === "year" ? "active" : ""} 
                onClick={() => setActivityPeriod("year")}
              >
                This Year
              </button>
            </div>
          </div>
          
          {/* Metrics cards */}
          <div className="metrics-cards">
            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="metric-content">
                <div className="metric-value">{formatCurrency(activityMetrics[activityPeriod].revenue)}</div>
                <div className="metric-label">Revenue</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-route"></i>
              </div>
              <div className="metric-content">
                <div className="metric-value">{activityMetrics[activityPeriod].trips}</div>
                <div className="metric-label">Trips</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-road"></i>
              </div>
              <div className="metric-content">
                <div className="metric-value">{activityMetrics[activityPeriod].distance} km</div>
                <div className="metric-label">Total Distance</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-gas-pump"></i>
              </div>
              <div className="metric-content">
                <div className="metric-value">{activityMetrics[activityPeriod].fuelUsed} L</div>
                <div className="metric-label">Fuel Used</div>
              </div>
            </div>
          </div>
          
          {/* Vehicle details cards */}
          <div className="vehicle-details-section">
            <h2>Vehicle Details</h2>
            <div className="vehicle-details-cards">
              <div className="vehicle-detail-card">
                <div className="detail-header">
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Performance</span>
                </div>
                <div className="detail-content">
                  <div className="detail-item">
                    <span className="detail-label">Fuel Efficiency</span>
                    <span className="detail-value">{vehicle.fuelEfficiency}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Revenue</span>
                    <span className="detail-value">{formatCurrency(vehicle.totalRevenue)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Trips</span>
                    <span className="detail-value">{vehicle.totalTrips}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Distance</span>
                    <span className="detail-value">{vehicle.totalDistance} km</span>
                  </div>
                </div>
              </div>
              
              <div className="vehicle-detail-card">
                <div className="detail-header">
                  <i className="fas fa-wrench"></i>
                  <span>Maintenance</span>
                </div>
                <div className="detail-content">
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">{vehicle.maintenanceStatus}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Next Service</span>
                    <span className="detail-value">{new Date(vehicle.nextService).toLocaleDateString()}</span>
                  </div>
                  <div className="maintenance-action">
                    <button className="secondary-btn">
                      <i className="fas fa-calendar-plus"></i> Schedule Maintenance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Route history */}
          <div className="route-history-section">
            <div className="section-header">
              <h2>Recent Routes</h2>
              <button className="link-btn">
                <i className="fas fa-external-link-alt"></i> View All
              </button>
            </div>
            
            {isLoading ? (
              <div className="loading-indicator">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Loading route data...</span>
              </div>
            ) : (
              <div className="route-table-container">
                <table className="route-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Route</th>
                      <th>Time</th>
                      <th>Distance</th>
                      <th>Packages</th>
                      <th>Revenue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeData.map((route) => (
                      <tr key={route.id}>
                        <td>{new Date(route.date).toLocaleDateString()}</td>
                        <td className="route-path">
                          <div className="route-start">{route.origin}</div>
                          <div className="route-arrow"><i className="fas fa-long-arrow-alt-right"></i></div>
                          <div className="route-end">{route.destination}</div>
                        </td>
                        <td>{route.startTime} - {route.endTime}</td>
                        <td>{route.distance} km</td>
                        <td>{route.packages}</td>
                        <td className="revenue-cell">{formatCurrency(route.revenue)}</td>
                        <td>
                          <span className={`status-badge ${route.status}`}>
                            {route.status === "completed" ? "Completed" : route.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleActivity;