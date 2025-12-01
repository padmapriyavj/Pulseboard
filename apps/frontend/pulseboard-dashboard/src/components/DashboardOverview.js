import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "../hooks/useAuth";
import { GET_DASHBOARD_STATS } from "../graphql/dashboard";
import "./DashboardOverview.css";

function DashboardOverview() {
  const navigate = useNavigate();
  const { orgId } = useAuth();

  const { loading, error, data } = useQuery(GET_DASHBOARD_STATS, {
    variables: { org_id: orgId },
  });

  const getStatusColor = (status) =>
    ({
      active: "#10b981",
      warning: "#f59e0b",
      critical: "#ef4444",
    }[status?.toLowerCase()] || "#94a3b8");

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error loading dashboard: {error.message}</div>;

  const sensors = data.getSensors || [];
  const recent = data.recentlyAccessedSensors || [];

  const totalSensors = sensors.length;
  const activeSensors = sensors.filter((s) => s.status === "active").length;
  const alertsCount = sensors.filter((s) => s.status === "critical").length;

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <h2>Dashboard Overview</h2>
        <button onClick={() => navigate("/sensors")} className="add-sensor-button">
          + Add Sensor
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sensors</div>
          <div className="stat-value">{totalSensors}</div>
          <div className="stat-change">All sensors</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Sensors</div>
          <div className="stat-value">{activeSensors}</div>
          <div className="stat-change">
            {totalSensors - activeSensors} disabled
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Alerts</div>
          <div className="stat-value alert-value">{alertsCount}</div>
          <div className="stat-change">
            {alertsCount === 0 ? "All clear" : "Check immediately"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">System Health</div>
          <div className="stat-value">
            {Math.floor((activeSensors / Math.max(totalSensors, 1)) * 100)}%
          </div>
          <div className="stat-change">Overall</div>
        </div>
      </div>

      <div className="recent-sensors-card">
        <div className="card-header">
          <h3>Recently Accessed Sensors</h3>
          <a href="/sensors" className="view-all-link">
            View All
          </a>
        </div>

        <table className="sensors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  No recent activity
                </td>
              </tr>
            ) : (
              recent.map((sensor) => (
                <tr key={sensor.id}>
                  <td>{sensor.name || sensor.type}</td>
                  <td>{sensor.type}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ color: getStatusColor(sensor.status) }}
                    >
                      {sensor.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-button"
                      onClick={() => navigate(`/sensor/${sensor.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardOverview;
