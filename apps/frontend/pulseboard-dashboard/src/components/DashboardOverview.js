import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "../hooks/useAuth";
import { GET_DASHBOARD_STATS } from "../graphql/dashboard";
import InsightsFeed from "./insights/InsightsFeed";
import "./DashboardOverview.css";

const PAGE_SIZE = 5;

function DashboardOverview() {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const [recentPage, setRecentPage] = useState(1);

  const { loading, error, data } = useQuery(GET_DASHBOARD_STATS, {
    variables: { org_id: orgId, recent_limit: 100 },
    fetchPolicy: "network-only",
    pollInterval: 30000,
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

  const totalRecentPages = Math.max(1, Math.ceil(recent.length / PAGE_SIZE));
  const recentPaginated = recent.slice((recentPage - 1) * PAGE_SIZE, recentPage * PAGE_SIZE);

  const totalSensors = sensors.length;
  const activeSensors = sensors.filter((s) => s.status === "active").length;
  const alertsCount = sensors.filter((s) => s.status === "critical").length;

  return (
    <div className="dashboard-overview">
      <p className="breadcrumb">
        <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Home</a>
        {" / Dashboard"}
      </p>
      <div className="overview-header">
        <h2>Dashboard Overview</h2>
        <button onClick={() => navigate("/dashboard/sensors")} className="add-sensor-button">
          <span className="add-sensor-icon" aria-hidden="true">+</span>
          Add Sensor
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

      <div className="overview-two-column">
        <div className="insights-column">
          <InsightsFeed orgId={orgId} limit={5} />
        </div>
        <div className="recent-sensors-card">
          <div className="card-header">
            <h3>Recently Accessed Sensors</h3>
            <button type="button" className="view-all-link" onClick={() => navigate("/dashboard/sensors")}>
              View All
            </button>
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
                    <span className="no-data-hint">Start by adding sensors or viewing the Sensors page</span>
                  </td>
                </tr>
              ) : (
                recentPaginated.map((sensor) => (
                  <tr key={sensor.id}>
                    <td>{sensor.name || sensor.type}</td>
                    <td>{sensor.type}</td>
                    <td>
                      <span
                        className="status-badge"
                        data-status={(sensor.status || "").toLowerCase()}
                        style={{ color: getStatusColor(sensor.status) }}
                      >
                        {sensor.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-button"
                        onClick={() => navigate(`/dashboard/sensors/${sensor.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {recent.length > 0 && (
            <div className="recent-pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                disabled={recentPage <= 1}
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {recentPage} of {totalRecentPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setRecentPage((p) => Math.min(totalRecentPages, p + 1))}
                disabled={recentPage >= totalRecentPages}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
