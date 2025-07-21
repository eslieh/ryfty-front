import React, { useState } from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";
import { useNavigate } from "react-router-dom";

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("plate");
  const navigate = useNavigate();
  // Sample vehicle data
  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      plate: "KDB 123A",
      type: "Motorcycle",
      brand: "Honda",
      model: "CB150R",
      driver: "John Kamau",
      status: "active",
      currentRoute: "Westlands - CBD",
      deliveries: 235,
      avgDeliveryTime: "28 min",
      fuelEfficiency: "4.8L/100km",
      lastMaintenance: "2025-02-12",
      year: 2023,
    },
    {
      id: 2,
      plate: "KCK 784D",
      type: "Car",
      brand: "Toyota",
      model: "Vitz",
      driver: "Sarah Wanjiku",
      status: "active",
      currentRoute: "Kilimani - Lavington",
      deliveries: 187,
      avgDeliveryTime: "35 min",
      fuelEfficiency: "6.3L/100km",
      lastMaintenance: "2025-03-05",
      year: 2022,
    },
    {
      id: 3,
      plate: "KDE 456B",
      type: "Motorcycle",
      brand: "Yamaha",
      model: "YBR125",
      driver: "James Odhiambo",
      status: "inactive",
      currentRoute: "None",
      deliveries: 156,
      avgDeliveryTime: "31 min",
      fuelEfficiency: "3.9L/100km",
      lastMaintenance: "2025-03-14",
      year: 2024,
    },
    {
      id: 4,
      plate: "KDL 902F",
      type: "Van",
      brand: "Nissan",
      model: "NV200",
      driver: "George Mutua",
      status: "active",
      currentRoute: "Industrial Area - Eastlands",
      deliveries: 312,
      avgDeliveryTime: "42 min",
      fuelEfficiency: "8.5L/100km",
      lastMaintenance: "2025-01-25",
      year: 2021,
    },
    {
      id: 5,
      plate: "KCA 320G",
      type: "Motorcycle",
      brand: "Bajaj",
      model: "Boxer 150",
      driver: "Daniel Kipchoge",
      status: "maintenance",
      currentRoute: "None",
      deliveries: 201,
      avgDeliveryTime: "29 min",
      fuelEfficiency: "4.2L/100km",
      lastMaintenance: "2025-03-18",
      year: 2022,
    },
    {
      id: 6,
      plate: "KDD 547H",
      type: "Car",
      brand: "Mazda",
      model: "Demio",
      driver: "Lucy Waithira",
      status: "active",
      currentRoute: "Karen - Ngong Road",
      deliveries: 178,
      avgDeliveryTime: "38 min",
      fuelEfficiency: "5.9L/100km",
      lastMaintenance: "2025-02-28",
      year: 2023,
    },
  ]);

  // Filter vehicles based on search term and status
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.currentRoute.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || vehicle.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Sort vehicles based on selected sort option
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (sortBy === "plate") {
      return a.plate.localeCompare(b.plate);
    } else if (sortBy === "deliveries") {
      return b.deliveries - a.deliveries;
    } else if (sortBy === "driver") {
      return a.driver.localeCompare(b.driver);
    } else {
      return a.id - b.id;
    }
  });

  // Function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "status-badge active";
      case "inactive":
        return "status-badge inactive";
      case "maintenance":
        return "status-badge maintenance";
      default:
        return "status-badge";
    }
  };

  // Function to get vehicle icon
  const getVehicleIcon = (type) => {
    switch (type.toLowerCase()) {
      case "motorcycle":
        return "fa-motorcycle";
      case "car":
        return "fa-car";
      case "van":
        return "fa-truck";
      default:
        return "fa-truck";
    }
  };

  return (
    <div className="dashboard">
      <CourierNav />
      <div className="rest-body">
        <div className="tab-header">
          <div className="tab-label">Vehicles</div>
          <div className="tab-actions">
            <button className="action-btn refresh-btn">
              <i className="fas fa-sync-alt"></i>
            </button>
            <button className="action-btn">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>

        <div className="vehicle-dashboard">
          <div className="fleet-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-car-side"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{vehicles.length}</div>
                <div className="stat-label">Total Vehicles</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon active">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {vehicles.filter((v) => v.status === "active").length}
                </div>
                <div className="stat-label">Active Vehicles</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon maintenance">
                <i className="fas fa-tools"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {vehicles.filter((v) => v.status === "maintenance").length}
                </div>
                <div className="stat-label">In Maintenance</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-box"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {vehicles.reduce((sum, v) => sum + v.deliveries, 0)}
                </div>
                <div className="stat-label">Total Deliveries</div>
              </div>
            </div>
          </div>

          <div className="filter-search-container">
            <div className="search-box">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search by plate, driver, route or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <i
                  className="fas fa-times clear-icon"
                  onClick={() => setSearchTerm("")}
                ></i>
              )}
            </div>
            <div className="filter-actions">
              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Vehicles</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">In Maintenance</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="plate">Plate Number</option>
                  <option value="deliveries">Deliveries</option>
                  <option value="driver">Driver Name</option>
                </select>
              </div>
            </div>
          </div>

          <div className="vehicles-container">
            {sortedVehicles.length > 0 ? (
              sortedVehicles.map((vehicle) => (
                <div className="vehicle-card" key={vehicle.id}>
                  <div className="vehicle-header">
                    <div className="vehicle-plate">
                      <i className={`fas ${getVehicleIcon(vehicle.type)}`}></i>
                      {vehicle.plate}
                    </div>
                    <div className={getStatusBadgeClass(vehicle.status)}>
                      {vehicle.status === "active" && (
                        <i className="fas fa-circle status-dot"></i>
                      )}
                      {vehicle.status === "maintenance" && (
                        <i className="fas fa-tools status-icon"></i>
                      )}
                      {vehicle.status === "inactive" && (
                        <i className="fas fa-power-off status-icon"></i>
                      )}
                      {vehicle.status.charAt(0).toUpperCase() +
                        vehicle.status.slice(1)}
                    </div>
                  </div>

                  <div className="vehicle-details">
                    <div className="vehicle-model">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </div>
                    <div className="vehicle-driver">
                      <i className="fas fa-user driver-icon"></i>
                      {vehicle.driver}
                    </div>
                  </div>

                  <div className="route-section">
                    <div className="section-label">Current Route</div>
                    <div className="route-value">
                      {vehicle.status === "active" ? (
                        <>
                          <i className="fas fa-route route-icon"></i>{" "}
                          {vehicle.currentRoute}
                        </>
                      ) : (
                        <span className="no-route">No active route</span>
                      )}
                    </div>
                  </div>

                  <div className="delivery-stats">
                    <div className="delivery-item">
                      <div className="delivery-icon">
                        <i className="fas fa-box"></i>
                      </div>
                      <div className="delivery-info">
                        <div className="delivery-value">
                          {vehicle.deliveries}
                        </div>
                        <div className="delivery-label">Deliveries</div>
                      </div>
                    </div>
                    <div className="delivery-item">
                      <div className="delivery-icon">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div className="delivery-info">
                        <div className="delivery-value">
                          {vehicle.avgDeliveryTime}
                        </div>
                        <div className="delivery-label">Avg. Time</div>
                      </div>
                    </div>
                  </div>

                  <div className="vehicle-actions">
                    <button
                      className="vehicle-action-btn"
                      onClick={() => navigate(`/courier/vehicle/${vehicle.plate}/activity`)}
                    >
                      <i className="fas fa-history"></i>
                      View Activity
                    </button>
                    <button
                      className="vehicle-action-btn"
                      onClick={() => navigate(`/courier/vehicle/${vehicle.plate}/edit`)}
                    >
                      <i className="fas fa-edit"></i>
                      Edit Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-vehicles-message">
                <i className="fas fa-car-crash"></i>
                <p>No vehicles match your search criteria</p>
                <button
                  className="reset-search-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;
