import React, { useState } from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";
import NewOfficeForm from "../../components/NewOfficeForm";
import { useNavigate } from "react-router-dom";
const Offices = () => {
  const[popup, tounglePopup ] = useState(false)
  const navigate = useNavigate()
  const centersData = { 
    centers: [
      {
        location: "Nairobi Tea Room",
        manager: "Eslieh Victor",
        shortCode: "12345678",
        linePhone: "+254712345678",
        totalShipment: "22"
      },
      {
        location: "Mombasa Port Hub",
        manager: "Jane Mwangi",
        shortCode: "23456789",
        linePhone: "+254722456789",
        totalShipment: "45"
      },
      {
        location: "Kisumu Lake View",
        manager: "Daniel Otieno",
        shortCode: "34567890",
        linePhone: "+254733567890",
        totalShipment: "30"
      },
      {
        location: "Eldoret Cargo Terminal",
        manager: "Lucy Wanjiru",
        shortCode: "45678901",
        linePhone: "+254744678901",
        totalShipment: "18"
      },
      {
        location: "Nakuru Central Dispatch",
        manager: "Mark Kipchumba",
        shortCode: "56789012",
        linePhone: "+254755789012",
        totalShipment: "37"
      }
    ]
  };
  const addOffice = (newOffice) => {
    // setOffices([...offices, newOffice]);
  };

  const showPopop = () => {
    tounglePopup(true)
  } 
  return (
    <div className="dashboard">
      <CourierNav />
      {popup && (
        <div className="popup-centerdiv">
          <div className="form-container">
          <div className="tab-label">Add an office</div>
            <NewOfficeForm onAddOffice={addOffice}/>
          </div>
        </div>
      )}
      <div className="rest-body">
        <div className="tab-label">Offices</div>
        <div className="dashboard-tet">
          List of offices and the managers
        </div>
        <div className="data-to-cnters">
          <div className="add-data-">
            <button className="add-offfice" onClick={showPopop}><i className="fas fa-plus"></i> Add an office</button>
          </div>
          <div className="office-lists">
            {centersData.centers.map((center, key) => (
              <div className="dashboard-c-containe" onClick={() => navigate(`/courier/offices/${center.shortCode}`)}>
                <div className="office-header">
                  {center.location}
                </div>
                <div className="center-foot-data">
                  <div className="center-manager">
                    {center.manager}
                  </div>
                  <div className="center-code">
                    {center.shortCode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
};
export default Offices;
