import React from "react";
import CourierNav from "../../components/courierNav";
import "../../styles/couriers.css";
const CourierIndex = () => {
  const dashboardData = {
    summary: [
      {
        icon: `<i class="fa-solid fa-money-bill-wave"></i>`,
        label: "Gross Earnings",
        value: "KES 50,000",
      },
      {
        icon: `<i class="fa-solid fa-box"></i>`,
        label: "Total Deliveries",
        value: "120",
      },
      {
        icon: `<i class="fa-solid fa-motorcycle"></i>`,
        label: "Active Riders",
        value: "15",
      },
      {
        icon: `<i class="fa-solid fa-truck"></i>`,
        label: "Fleet Vehicles",
        value: "8",
      },
      {
        icon: `<i class="fa-solid fa-clock"></i>`,
        label: "Average Delivery Time",
        value: "45 min",
      },
      {
        icon: `<i class="fa-solid fa-star"></i>`,
        label: "Customer Rating",
        value: "4.8 / 5",
      },
      {
        icon: `<i class="fa-solid fa-chart-line"></i>`,
        label: "Monthly Growth",
        value: "+12%",
      },
      {
        icon: `<i class="fa-solid fa-hand-holding-dollar"></i>`,
        label: "Pending Payouts",
        value: "KES 8,000",
      },
    ],
    centers: [
      {
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
      },
      {
        id: 2,
        name: "Mombasa Coastal Center",
        location: "Mombasa, Kenya",
        totalShipments: 3200,
        successfulDeliveries: 3000,
        pendingDeliveries: 150,
        failedDeliveries: 50,
        revenue: "KES 1,800,000",
        averageDeliveryTime: "3h 10m",
        activeRiders: 40,
      },
      {
        id: 3,
        name: "Kisumu Lakeside Depot",
        location: "Kisumu, Kenya",
        totalShipments: 2800,
        successfulDeliveries: 2600,
        pendingDeliveries: 120,
        failedDeliveries: 80,
        revenue: "KES 1,500,000",
        averageDeliveryTime: "2h 50m",
        activeRiders: 35,
      },
      {
        id: 4,
        name: "Eldoret Express Hub",
        location: "Eldoret, Kenya",
        totalShipments: 3100,
        successfulDeliveries: 2900,
        pendingDeliveries: 100,
        failedDeliveries: 100,
        revenue: "KES 1,700,000",
        averageDeliveryTime: "2h 40m",
        activeRiders: 38,
      },
    ],
  };

  return (
    <div className="dashboard">
      <CourierNav />
      <div className="rest-body">
        <div className="tab-label">Dashboard</div>
        <div className="dashboard-tet">
          An overview of the company performance on the platform
        </div>
        <div className="dashboad-summury-data">
          {dashboardData.summary.map((summary, key) => (
            <div className="dashboard-c-containe">
              <div className="dashbpard-icon-flex">
                <div
                  className="icon-holder"
                  dangerouslySetInnerHTML={{ __html: summary.icon }}
                ></div>
                <div className="summ-lable">{summary.label}</div>
              </div>
              <div className="dashboard-data">{summary.value}</div>
            </div>
          ))}
        </div>
        <div className="route-history-section">
          <div className="search-inputs">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" className="search-input" placeholder="Search by location" />
          </div>
          <div className="cernter-data">
            <div className="center-data-labels">
              <div className="locaationss">Location</div>
              <div className="shipments">Total Deliveries</div>
              <div className="success-deliveru">Success Deliveries</div>
              <div className="progessing-deliveries">Progress Deliveries</div>
              <div className="revenue-de">Revenue</div>
              <div className="avgdt">Average Delivery Time</div>
            </div>
                {dashboardData.centers.map((center, key) => (
                    <div className="cnter-delivery-data">
                    <div className="locaationss">{center.location}</div>
                    <div className="shipments">{center.totalShipments}</div>
                    <div className="success-deliveru">{center.successfulDeliveries}</div>
                    <div className="progessing-deliveries">{center.pendingDeliveries}</div>
                    <div className="revenue-de">{center.revenue}</div>
                    <div className="avgdt">{center.averageDeliveryTime}</div>
                    </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CourierIndex;
