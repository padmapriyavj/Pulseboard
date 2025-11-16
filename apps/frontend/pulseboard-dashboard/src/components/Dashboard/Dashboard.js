import React from "react";
import { Outlet } from "react-router-dom";
import TopHeader from "./TopHeader";
import Sidebar from "./Sidebar";
import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard-container">
      <TopHeader />
      <div className="dashboard-main">
        <Sidebar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

