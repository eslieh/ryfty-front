import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CourierNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/courier" },
    { name: "Offices", path: "/courier/offices" },
    { name: "Vehicles", path: "/courier/vehicles" },
    { name: "Reports", path: "/courier/reports" },
    { name: "Company", path: "/courier/company" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <section className="courier-nav">
      <div className="label-area">
        <div className="dot"></div>
        <div className="label-brands">
          ryfty <div className="courier-brand">Courier</div>
        </div>
      </div>
      <div className="navigators">
        {links.map(({ name, path }) => (
          <span
            key={path}
            className={`nav-link ${location.pathname === path ? "active" : ""}`}
            onClick={() => handleNavigation(path)}
            style={{ fontWeight: location.pathname === path ? "bold" : "normal" }}
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
};

export default CourierNav;