import React, { useState } from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";

const EditVehicle = () => {
  const [vehicleData, setVehicleData] = useState({
    vehicleType: "van",
    make: "",
    model: "",
    year: "",
    color: "",
    licensePlate: "",
    registrationNumber: "",
    insuranceValid: true,
    insuranceExpiry: "",
    vehicleCapacity: "",
    fuelType: "diesel",
    maintenanceDate: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value,
    });
  };

  const handleVehicleTypeChange = (type) => {
    setVehicleData({
      ...vehicleData,
      vehicleType: type,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would save the data to your backend
    console.log("Vehicle data submitted:", vehicleData);
    alert("Vehicle details updated successfully!");
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="dashboard">
      <CourierNav />
      <div className="rest-body">
        <div className="edit-vehicle-container">
          <div className="back-button" onClick={goBack}>
            <i className="fas fa-arrow-left"></i>
            <span>Back to Vehicles</span>
          </div>
          
          <h1 className="page-title">Edit Vehicle Details</h1>
          <p className="page-description">
            Update your fleet vehicle information to ensure accurate records in our system
          </p>

          <form onSubmit={handleSubmit} className="vehicle-form">
            <div className="form-section">
              <h2 className="section-title">Vehicle Type</h2>
              <div className="vehicle-type-selector">
                <div 
                  className={`type-option ${vehicleData.vehicleType === "van" ? "active" : ""}`}
                  onClick={() => handleVehicleTypeChange("van")}
                >
                  <div className="type-icon">🚐</div>
                  <div className="type-label">Van</div>
                </div>
                <div 
                  className={`type-option ${vehicleData.vehicleType === "bus" ? "active" : ""}`}
                  onClick={() => handleVehicleTypeChange("bus")}
                >
                  <div className="type-icon">🚌</div>
                  <div className="type-label">Bus</div>
                </div>
                <div 
                  className={`type-option ${vehicleData.vehicleType === "truck" ? "active" : ""}`}
                  onClick={() => handleVehicleTypeChange("truck")}
                >
                  <div className="type-icon">🚚</div>
                  <div className="type-label">Courier Truck</div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Vehicle Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="make">Make</label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={vehicleData.make}
                    onChange={handleInputChange}
                    placeholder="e.g., Mercedes-Benz"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="model">Model</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={vehicleData.model}
                    onChange={handleInputChange}
                    placeholder="e.g., Sprinter"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="year">Year</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={vehicleData.year}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023"
                    min="1900"
                    max="2099"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="color">Color</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={vehicleData.color}
                    onChange={handleInputChange}
                    placeholder="e.g., White"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="licensePlate">License Plate</label>
                  <input
                    type="text"
                    id="licensePlate"
                    name="licensePlate"
                    value={vehicleData.licensePlate}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC123"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="registrationNumber">Registration Number</label>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={vehicleData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., REG12345"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vehicleCapacity">
                    {vehicleData.vehicleType === "bus" ? "Passenger Capacity" : 
                     vehicleData.vehicleType === "truck" ? "Load Capacity (kg)" : 
                     "Cargo Capacity (m³)"}
                  </label>
                  <input
                    type="text"
                    id="vehicleCapacity"
                    name="vehicleCapacity"
                    value={vehicleData.vehicleCapacity}
                    onChange={handleInputChange}
                    placeholder={vehicleData.vehicleType === "bus" ? "e.g., 22 passengers" : 
                                vehicleData.vehicleType === "truck" ? "e.g., 3500 kg" : 
                                "e.g., 14 m³"}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fuelType">Fuel Type</label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={vehicleData.fuelType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="lpg">LPG</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Insurance & Maintenance</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="insuranceExpiry">Insurance Expiry Date</label>
                  <input
                    type="date"
                    id="insuranceExpiry"
                    name="insuranceExpiry"
                    value={vehicleData.insuranceExpiry}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maintenanceDate">Last Maintenance Date</label>
                  <input
                    type="date"
                    id="maintenanceDate"
                    name="maintenanceDate"
                    value={vehicleData.maintenanceDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group insurance-check">
                  <input
                    type="checkbox"
                    id="insuranceValid"
                    name="insuranceValid"
                    checked={vehicleData.insuranceValid}
                    onChange={() => setVehicleData({...vehicleData, insuranceValid: !vehicleData.insuranceValid})}
                  />
                  <label htmlFor="insuranceValid">
                    I confirm all vehicle documentation is valid and up to date
                  </label>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button type="button" className="cancel-btn" onClick={goBack}>Cancel</button>
              <button type="submit" className="submit-btn">Save Vehicle Details</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditVehicle;