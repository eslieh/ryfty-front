import React, { useState } from "react";

const NewOfficeForm = ({ onAddOffice,  }) => {
  const [formData, setFormData] = useState({
    location: "",
    manager: "",
    shortCode: "",
    linePhone: "",
    totalShipment: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.location || !formData.manager || !formData.shortCode || !formData.linePhone) {
      alert("Please fill in all required fields.");
      return;
    }

    onAddOffice(formData); // Pass data to parent component
    setFormData({ location: "", manager: "", shortCode: "", linePhone: "", totalShipment: "" }); // Reset form
  };

  return (
    <form className="office-form" onSubmit={handleSubmit}>
      <h3 className="form-title">Add New Office</h3>

      <div className="form-group">
        <input
          type="text"
          name="location"
          className="form-input"
          value={formData.location}
          onChange={handleChange}
          placeholder="Office Location"
          required
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          name="manager"
          className="form-input"
          value={formData.manager}
          onChange={handleChange}
          placeholder="Manager Name"
          required
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          name="shortCode"
          className="form-input"
          value={formData.shortCode}
          onChange={handleChange}
          placeholder="Short Code"
          required
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          name="linePhone"
          className="form-input"
          value={formData.linePhone}
          onChange={handleChange}
          placeholder="Phone Number"
          required
        />
      </div>

      <div className="form-group">
        <input
          type="number"
          name="totalShipment"
          className="form-input"
          value={formData.totalShipment}
          onChange={handleChange}
          placeholder="Total Shipments"
        />
      </div>

      <button type="submit" className="submit-btn">Add Office</button>
    </form>
  );
};

export default NewOfficeForm;
