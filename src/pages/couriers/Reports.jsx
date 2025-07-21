import React, { useState } from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";
import "../../styles/Reports.css";
const Reports = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [fulfillmentCenter, setFulfillmentCenter] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Sample data - in a real app, this would come from an API
  const deliveryData = {
    week: [
      { date: "Mon", completed: 156, failed: 12, pending: 8 },
      { date: "Tue", completed: 142, failed: 9, pending: 6 },
      { date: "Wed", completed: 165, failed: 11, pending: 7 },
      { date: "Thu", completed: 178, failed: 14, pending: 10 },
      { date: "Fri", completed: 194, failed: 8, pending: 5 },
      { date: "Sat", completed: 210, failed: 13, pending: 9 },
      { date: "Sun", completed: 125, failed: 7, pending: 4 },
    ],
    month: [/* Similar structure but for a month */],
    "6month": [/* Data for 6 months */],
    year: [/* Data for a year */],
  };

  const fulfillmentCenters = [
    { id: "fc1", name: "Downtown Hub" },
    { id: "fc2", name: "Northside Center" },
    { id: "fc3", name: "East Terminal" },
    { id: "fc4", name: "West Depot" },
    { id: "fc5", name: "South Gate" },
  ];

  const vehicleTypes = [
    { id: "bike", name: "Bicycle" },
    { id: "scooter", name: "Scooter" },
    { id: "car", name: "Car" },
    { id: "van", name: "Van" },
    { id: "truck", name: "Truck" },
  ];

  // Calculate summary statistics
  const totalDeliveries = deliveryData[timeRange].reduce(
    (acc, day) => acc + day.completed + day.failed + day.pending, 0
  );
  const completedDeliveries = deliveryData[timeRange].reduce(
    (acc, day) => acc + day.completed, 0
  );
  const failedDeliveries = deliveryData[timeRange].reduce(
    (acc, day) => acc + day.failed, 0
  );
  const completionRate = ((completedDeliveries / totalDeliveries) * 100).toFixed(1);

  return (
    <div className="dashboard">
      <CourierNav />
      <div className="rest-body">
        <div className="reports-header">
          <div className="tab-label">Reports</div>
          <div className="period-tabs">
            <button 
              className={timeRange === "week" ? "active" : ""} 
              onClick={() => setTimeRange("week")}
            >
              Week
            </button>
            <button 
              className={timeRange === "month" ? "active" : ""} 
              onClick={() => setTimeRange("month")}
            >
              Month
            </button>
            <button 
              className={timeRange === "6month" ? "active" : ""} 
              onClick={() => setTimeRange("6month")}
            >
              6 Months
            </button>
            <button 
              className={timeRange === "year" ? "active" : ""} 
              onClick={() => setTimeRange("year")}
            >
              Year
            </button>
            <div className="date-range-picker">
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <span>to</span>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Fulfillment Center:</label>
            <select 
              value={fulfillmentCenter} 
              onChange={(e) => setFulfillmentCenter(e.target.value)}
            >
              <option value="all">All Centers</option>
              {fulfillmentCenters.map(center => (
                <option key={center.id} value={center.id}>{center.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Vehicle Type:</label>
            <select 
              value={vehicleType} 
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="all">All Vehicles</option>
              {vehicleTypes.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
              ))}
            </select>
          </div>
          <button className="export-btn">
            <i className="fas fa-download"></i> Export Report
          </button>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-truck-loading"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalDeliveries}</div>
              <div className="stat-label">Total Deliveries</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{completedDeliveries}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{failedDeliveries}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info">
              <i className="fas fa-percent"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{completionRate}%</div>
              <div className="stat-label">Completion Rate</div>
            </div>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Delivery Performance</h3>
              <div className="chart-legend">
                <span><i className="fas fa-circle success"></i> Completed</span>
                <span><i className="fas fa-circle warning"></i> Failed</span>
                <span><i className="fas fa-circle info"></i> Pending</span>
              </div>
            </div>
            <div className="chart-body delivery-chart">
              {/* Chart would be rendered here with a library like Chart.js or Recharts */}
              <div className="chart-placeholder">
                {deliveryData[timeRange].map((day, index) => (
                  <div className="chart-bar" key={index}>
                    <div className="bar-completed" style={{height: `${day.completed / 3}px`}}></div>
                    <div className="bar-failed" style={{height: `${day.failed / 3}px`}}></div>
                    <div className="bar-pending" style={{height: `${day.pending / 3}px`}}></div>
                    <div className="bar-label">{day.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Fulfillment Center Distribution</h3>
            </div>
            <div className="chart-body fc-chart">
              {/* Pie chart placeholder for fulfillment centers */}
              <div className="pie-chart-placeholder">
                <div className="pie-segment" style={{transform: 'rotate(0deg)', backgroundColor: '#4A90E2'}}></div>
                <div className="pie-segment" style={{transform: 'rotate(60deg)', backgroundColor: '#50E3C2'}}></div>
                <div className="pie-segment" style={{transform: 'rotate(120deg)', backgroundColor: '#F5A623'}}></div>
                <div className="pie-segment" style={{transform: 'rotate(220deg)', backgroundColor: '#D0021B'}}></div>
                <div className="pie-segment" style={{transform: 'rotate(280deg)', backgroundColor: '#9013FE'}}></div>
              </div>
              <div className="pie-chart-legend">
                {fulfillmentCenters.map((center, index) => (
                  <div className="legend-item" key={index}>
                    <span className="legend-color" style={{backgroundColor: ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE'][index]}}></span>
                    <span className="legend-label">{center.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <h3>Delivery Details</h3>
            <div className="table-actions">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search deliveries..." />
              </div>
              <div className="period-tabs">
                <button><i className="fas fa-filter"></i> Filter</button>
                <button><i className="fas fa-sort"></i> Sort</button>
              </div>
            </div>
          </div>
          <table className="deliveries-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Courier</th>
                <th>Fulfillment Center</th>
                <th>Vehicle</th>
                <th>Distance</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#12345</td>
                <td>2025-03-21</td>
                <td>John Smith</td>
                <td>Downtown Hub</td>
                <td>Bicycle</td>
                <td>2.4 km</td>
                <td>18 min</td>
                <td><span className="status-completed">Completed</span></td>
              </tr>
              <tr>
                <td>#12346</td>
                <td>2025-03-21</td>
                <td>Jane Doe</td>
                <td>Northside Center</td>
                <td>Scooter</td>
                <td>4.7 km</td>
                <td>25 min</td>
                <td><span className="status-completed">Completed</span></td>
              </tr>
              <tr>
                <td>#12347</td>
                <td>2025-03-21</td>
                <td>Mike Johnson</td>
                <td>East Terminal</td>
                <td>Car</td>
                <td>8.2 km</td>
                <td>32 min</td>
                <td><span className="status-failed">Failed</span></td>
              </tr>
              <tr>
                <td>#12348</td>
                <td>2025-03-21</td>
                <td>Sarah Wilson</td>
                <td>West Depot</td>
                <td>Van</td>
                <td>12.5 km</td>
                <td>45 min</td>
                <td><span className="status-pending">Pending</span></td>
              </tr>
              <tr>
                <td>#12349</td>
                <td>2025-03-21</td>
                <td>David Lee</td>
                <td>South Gate</td>
                <td>Truck</td>
                <td>15.8 km</td>
                <td>55 min</td>
                <td><span className="status-completed">Completed</span></td>
              </tr>
            </tbody>
          </table>
          <div className="table-pagination">
            <button className="page-btn"><i className="fas fa-chevron-left"></i></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn"><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;