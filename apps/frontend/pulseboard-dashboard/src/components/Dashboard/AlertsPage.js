import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ALERTS, GET_ALERT_SUMMARY, ACKNOWLEDGE_ALERT, DELETE_ALERT } from "../../graphql/alerts";
import { useAuth } from "../../hooks/useAuth";
import "./AlertsPage.css";

const AlertsPage = () => {
  const { orgId, loading: authLoading } = useAuth();
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 recent alerts by default

  // Debounce search term - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data, refetch } = useQuery(GET_ALERTS, {
    variables: {
      org_id: orgId,
      severity: severityFilter !== "All" ? severityFilter : null,
      sensor_name: debouncedSearchTerm || null,
      date_from: dateFrom || null,
      date_to: dateTo || null,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    },
    skip: !orgId,
    pollInterval: 10000, // Refresh every 10 seconds
  });

  const { data: summaryData } = useQuery(GET_ALERT_SUMMARY, {
    variables: { org_id: orgId },
    skip: !orgId,
    pollInterval: 10000, // Refresh every 10 seconds
  });

  const [acknowledgeAlert] = useMutation(ACKNOWLEDGE_ALERT, {
    refetchQueries: [
      { query: GET_ALERTS, variables: { org_id: orgId } },
      { query: GET_ALERT_SUMMARY, variables: { org_id: orgId } }
    ],
  });

  const [deleteAlert] = useMutation(DELETE_ALERT, {
    refetchQueries: [
      { query: GET_ALERTS, variables: { org_id: orgId } },
      { query: GET_ALERT_SUMMARY, variables: { org_id: orgId } }
    ],
  });

  if (authLoading) {
    return (
      <div style={{ padding: "2rem", color: "#e2e8f0" }}>
        Loading authentication...
      </div>
    );
  }

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert({ variables: { alert_id: alertId } });
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      alert("Failed to acknowledge alert");
    }
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) {
      return;
    }
    try {
      await deleteAlert({ variables: { alert_id: alertId } });
    } catch (err) {
      console.error("Error deleting alert:", err);
      alert("Failed to delete alert");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "#ef4444"; // red
      case "Warning":
        return "#f59e0b"; // yellow/amber
      default:
        return "#6b7280"; // gray
    }
  };

  const getSeverityDot = (severity) => {
    const color = getSeverityColor(severity);
    return (
      <span
        style={{
          display: "inline-block",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: color,
          marginRight: "8px",
        }}
      />
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: "#e2e8f0" }}>
        Loading alerts...
      </div>
    );
  }

  if (error) {
    console.error("Alerts query error:", error);
    console.error("Error details:", error.graphQLErrors, error.networkError);
    return (
      <div style={{ padding: "2rem", color: "#ef4444" }}>
        <div>Error loading alerts: {error.message}</div>
        {error.graphQLErrors && error.graphQLErrors.length > 0 && (
          <div style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
            GraphQL Errors: {error.graphQLErrors.map(e => e.message).join(", ")}
          </div>
        )}
        {error.networkError && (
          <div style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
            Network Error: {error.networkError.message}
          </div>
        )}
        <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#9e9e9e" }}>
          Current org_id: {orgId || "Not set"}
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div style={{ padding: "2rem", color: "#ef4444" }}>
        Error: Organization ID not found. Please log in again.
      </div>
    );
  }

  const alerts = data?.getAlerts || [];
  // Calculate pagination
  // If we have fewer items than the limit, we're on the last page
  // Otherwise, assume there might be more pages
  const hasMore = alerts.length === itemsPerPage;
  // For better UX, show page numbers based on current page and whether there's more
  const totalPages = hasMore ? currentPage + 1 : currentPage;
  
  // Calculate page range for display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>Alerts & Notifications</h1>
        <div style={{ fontSize: "0.875rem", color: "#9e9e9e", marginTop: "0.5rem" }}>
          Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Alert Summary Section */}
      {summaryData?.getAlertSummary && (
        <div className="alert-summary">
          <div className="summary-card critical-summary">
            <div className="summary-header">
              <span className="summary-label">Critical Alerts</span>
              <span className="summary-count">{summaryData.getAlertSummary.critical_count || 0}</span>
            </div>
            {summaryData.getAlertSummary.latest_critical_timestamp && (
              <div className="summary-timestamp">
                Latest: {formatTimestamp(summaryData.getAlertSummary.latest_critical_timestamp)}
              </div>
            )}
          </div>
          <div className="summary-card warning-summary">
            <div className="summary-header">
              <span className="summary-label">Warning Alerts</span>
              <span className="summary-count">{summaryData.getAlertSummary.warning_count || 0}</span>
            </div>
            {summaryData.getAlertSummary.latest_warning_timestamp && (
              <div className="summary-timestamp">
                Latest: {formatTimestamp(summaryData.getAlertSummary.latest_warning_timestamp)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="alerts-controls">
        <div className="filter-section">
          <label>Filter:</label>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
          </select>
        </div>

        <div className="search-section">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by sensor name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="search-input"
          />
        </div>

        <div className="date-filter-section">
          <label>From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="date-input"
          />
        </div>

        <div className="date-filter-section">
          <label>To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
            className="date-input"
          />
        </div>

        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setCurrentPage(1);
            }}
            className="clear-date-btn"
          >
            Clear Dates
          </button>
        )}
      </div>

      <div className="alerts-table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Sensor</th>
              <th>Alert</th>
              <th>Severity</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#9e9e9e" }}>
                  No alerts found
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={alert.acknowledged ? "acknowledged" : ""}
                >
                  <td>{formatTimestamp(alert.created_at)}</td>
                  <td>{alert.sensor_name || `Sensor ${alert.sensor_id || "N/A"}`}</td>
                  <td>
                    <span className="alert-type-badge">
                      {alert.alert_type === "threshold_breach"
                        ? "Threshold Breach"
                        : "Anomaly"}
                    </span>
                  </td>
                  <td>
                    <span className="severity-cell">
                      {getSeverityDot(alert.severity)}
                      {alert.severity}
                    </span>
                  </td>
                  <td className="message-cell">{alert.message}</td>
                  <td>
                    <div className="action-buttons">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="action-btn acknowledge-btn"
                          title="Mark as acknowledged"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="action-btn delete-btn"
                        title="Delete alert"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {alerts.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="page-btn"
            title="First page"
          >
            ««
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`page-number-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}
            {hasMore && currentPage === totalPages && (
              <span className="page-ellipsis">...</span>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!hasMore}
            className="page-btn"
          >
            Next
          </button>
          <span className="page-info">
            Page {currentPage} {hasMore ? `of ${totalPages}+` : `of ${totalPages}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
