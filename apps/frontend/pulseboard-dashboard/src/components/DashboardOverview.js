import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./DashboardOverview.css";

function DashboardOverview() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSensors: 0,
    activeSensors: 0,
    alertsCount: 0,
    systemHealth: 0,
  });
  const [recentSensors, setRecentSensors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API calls
        // For now, using mock data
        setStats({
          totalSensors: 12,
          activeSensors: 10,
          alertsCount: 2,
          systemHealth: 98,
        });
        setRecentSensors([
          {
            id: "1",
            name: "Temp-A01",
            type: "DHT22",
            status: "active",
            value: "24.5°C",
            lastUpdated: "2 seconds ago",
          },
          {
            id: "2",
            name: "Humidity-B02",
            type: "BME280",
            status: "warning",
            value: "65%",
            lastUpdated: "5 seconds ago",
          },
          {
            id: "3",
            name: "Pressure-C01",
            type: "BMP180",
            status: "active",
            value: "1013 hPa",
            lastUpdated: "3 seconds ago",
          },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [orgId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10b981";
      case "warning":
        return "#f59e0b";
      case "critical":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <h2>Dashboard Overview</h2>
        <button
          className="add-sensor-button"
          onClick={() => navigate("/sensors")}
        >
          + Add Sensor
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Sensors</div>
              <div className="stat-value">{stats.totalSensors}</div>
              <div className="stat-change">All sensors</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Sensors</div>
              <div className="stat-value">{stats.activeSensors}</div>
              <div className="stat-change">
                {stats.totalSensors - stats.activeSensors} disabled
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Alerts</div>
              <div className="stat-value alert-value">{stats.alertsCount}</div>
              <div className="stat-change">
                {stats.alertsCount > 0 ? "Check immediately" : "All clear"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">System Health</div>
              <div className="stat-value">{stats.systemHealth}%</div>
              <div className="stat-change">
                {stats.systemHealth >= 95 ? "Excellent" : "Good"}
              </div>
            </div>
          </div>

          {/* Recent Sensors Table */}
          <div className="recent-sensors-card">
            <div className="card-header">
              <h3>Recent Sensors</h3>
              <a href="/sensors" className="view-all-link">
                View All
              </a>
            </div>
            <table className="sensors-table">
              <thead>
                <tr>
                  <th>Sensor Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Current Value</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentSensors.map((sensor) => (
                  <tr key={sensor.id}>
                    <td className="sensor-name">{sensor.name}</td>
                    <td>{sensor.type}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ color: getStatusColor(sensor.status) }}
                      >
                        {sensor.status === "active"
                          ? "Active"
                          : sensor.status === "warning"
                          ? "Warning"
                          : "Critical"}
                      </span>
                    </td>
                    <td className="value">{sensor.value}</td>
                    <td className="last-updated">{sensor.lastUpdated}</td>
                    <td className="actions">
                      <button
                        className="action-button"
                        onClick={() => navigate(`/sensor/${sensor.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardOverview;
