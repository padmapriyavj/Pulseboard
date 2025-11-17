import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { GET_SENSOR, GET_SENSOR_METRICS } from "../../graphql/sensorDetails";
import { useAuth } from "../../hooks/useAuth";

const SensorDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [showTimeRange, setShowTimeRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { loading: sensorLoading, data: sensorData } = useQuery(GET_SENSOR, {
    variables: { id: parseInt(id) },
    skip: !id,
  });

  const sensor = sensorData?.getSensor;

  // Live metrics query (updates every 5 seconds)
  const { loading: metricsLoading, data: metricsData, refetch: refetchMetrics } = useQuery(
    GET_SENSOR_METRICS,
    {
      variables: {
        org_id: orgId,
        sensor_type: sensor?.type,
        limit: 100,
      },
      skip: !orgId || !sensor?.type,
      pollInterval: 5000, // Poll every 5 seconds
    }
  );

  // Convert datetime-local format to ISO string for database query
  const formatDateTimeForQuery = useMemo(() => {
    return (dateTimeLocal) => {
      if (!dateTimeLocal) return null;
      // datetime-local format: "YYYY-MM-DDTHH:mm"
      // Convert to ISO string: "YYYY-MM-DDTHH:mm:ss.sssZ"
      try {
        const date = new Date(dateTimeLocal);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      } catch (error) {
        console.error("Error converting date:", dateTimeLocal, error);
        return null;
      }
    };
  }, []);

  // Filtered metrics query (for time range)
  const fromTimeISO = showTimeRange && fromTime ? formatDateTimeForQuery(fromTime) : null;
  const toTimeISO = showTimeRange && toTime ? formatDateTimeForQuery(toTime) : null;

  const { loading: filteredLoading, data: filteredData, refetch: refetchFiltered } = useQuery(
    GET_SENSOR_METRICS,
    {
      variables: {
        org_id: orgId,
        sensor_type: sensor?.type,
        from_time: fromTimeISO,
        to_time: toTimeISO,
        limit: 1000,
      },
      skip: !orgId || !sensor?.type || !showTimeRange || !fromTime || !toTime,
      fetchPolicy: 'network-only', // Always fetch fresh data when filter is applied
      notifyOnNetworkStatusChange: true, // Notify on loading state changes
    }
  );

  // Helper function to safely parse and format dates
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // Try parsing as ISO string or other formats
        const parsed = Date.parse(timestamp);
        if (isNaN(parsed)) return "Invalid Date";
        return new Date(parsed).toLocaleTimeString();
      }
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting timestamp:", timestamp, error);
      return "Invalid Date";
    }
  };

  const formatFullTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        const parsed = Date.parse(timestamp);
        if (isNaN(parsed)) return "Invalid Date";
        return new Date(parsed).toLocaleString();
      }
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting full timestamp:", timestamp, error);
      return "Invalid Date";
    }
  };

  // Process chart data
  const chartData = useMemo(() => {
    const data = metricsData?.metrics || [];
    return data
      .slice()
      .reverse()
      .map((metric) => {
        const timestamp = metric.timestamp;
        const date = timestamp ? new Date(timestamp) : null;
        return {
          value: parseFloat(metric.value) || 0,
          timestamp: date && !isNaN(date.getTime()) ? date.toLocaleTimeString() : "N/A",
          fullTimestamp: timestamp,
        };
      });
  }, [metricsData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData.length) return { min: 0, max: 0, avg: 0 };
    const values = chartData.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }, [chartData]);

  // Get latest metric for last updated
  const lastUpdated = useMemo(() => {
    if (!metricsData?.metrics?.length) return null;
    const latest = metricsData.metrics[0];
    if (!latest.timestamp) return null;
    const date = new Date(latest.timestamp);
    return isNaN(date.getTime()) ? null : date;
  }, [metricsData]);

  // Detect anomalies (values outside min/max threshold)
  const anomalies = useMemo(() => {
    if (!metricsData?.metrics || !sensor) return [];
    return metricsData.metrics
      .filter((metric) => {
        const value = parseFloat(metric.value);
        return value < sensor.min || value > sensor.max;
      })
      .slice(0, 10) // Get latest 10 anomalies
      .map((metric, index) => {
        const timestamp = metric.timestamp;
        const date = timestamp ? new Date(timestamp) : null;
        return {
          id: index + 1,
          value: parseFloat(metric.value),
          timestamp: date && !isNaN(date.getTime()) ? date : null,
          timestampString: formatFullTimestamp(timestamp),
          type: parseFloat(metric.value) < sensor.min ? "Below Min" : "Above Max",
        };
      });
  }, [metricsData, sensor]);

  // Determine health status
  const getHealthStatus = () => {
    if (!sensor || !lastUpdated) return { status: "Unknown", color: "#9e9e9e" };
    
    const now = new Date();
    const timeDiff = (now - lastUpdated) / 1000; // seconds
    
    if (timeDiff > 60) return { status: "Critical", color: "#ef4444" };
    if (timeDiff > 30) return { status: "Warning", color: "#f59e0b" };
    return { status: "Normal", color: "#10b981" };
  };

  const health = getHealthStatus();

  // Table data (filtered or live)
  const tableData = useMemo(() => {
    let data;
    if (showTimeRange && filteredData?.metrics) {
      data = filteredData.metrics;
    } else if (metricsData?.metrics) {
      data = metricsData.metrics;
    } else {
      return [];
    }
    if (!data || data.length === 0) return [];
    return data
      .slice()
      .reverse()
      .map((metric) => {
        const timestamp = metric.timestamp;
        let formattedTimestamp = "N/A";
        if (timestamp) {
          try {
            // Handle different timestamp formats
            let date;
            if (typeof timestamp === 'string') {
              date = new Date(timestamp);
            } else if (timestamp instanceof Date) {
              date = timestamp;
            } else {
              date = new Date(timestamp);
            }
            if (!isNaN(date.getTime())) {
              formattedTimestamp = date.toLocaleString();
            }
          } catch (error) {
            console.error("Error formatting timestamp in table:", timestamp, error);
          }
        }
        return {
          value: parseFloat(metric.value) || 0,
          timestamp: formattedTimestamp,
        };
      });
  }, [showTimeRange, filteredData, metricsData]);

  // Pagination calculations
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = tableData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [showTimeRange, fromTime, toTime]);

  // Download data as CSV
  const handleDownload = () => {
    const data = tableData;
    const csv = [
      ["ID", "Value", "Timestamp"],
      ...data.map((row, index) => [index + 1, row.value, row.timestamp]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor_${sensor?.name || sensor?.type}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleApplyTimeRange = async () => {
    if (fromTime && toTime) {
      // Validate that 'to' is after 'from'
      const fromDate = new Date(fromTime);
      const toDate = new Date(toTime);
      if (toDate < fromDate) {
        alert("'To' date must be after 'From' date");
        return;
      }
      setShowTimeRange(true);
      // Wait for state to update, then refetch
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        await refetchFiltered({
          org_id: orgId,
          sensor_type: sensor?.type,
          from_time: formatDateTimeForQuery(fromTime),
          to_time: formatDateTimeForQuery(toTime),
          limit: 1000,
        });
      } catch (error) {
        console.error("Error fetching filtered data:", error);
        alert("Error applying filter: " + error.message);
      }
    } else {
      alert("Please select both 'From' and 'To' dates");
    }
  };

  const handleClearTimeRange = () => {
    setFromTime("");
    setToTime("");
    setShowTimeRange(false);
  };

  if (sensorLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading sensor details...</div>
      </div>
    );
  }

  if (!sensor) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Sensor not found</div>
        <button onClick={() => navigate("/dashboard/sensors")} style={styles.backButton}>
          Back to Sensors
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        .pagination-button:hover:not(:disabled) {
          background-color: #3a3a3a !important;
        }
        .page-number-button:hover:not(.active) {
          background-color: #3a3a3a !important;
        }
        .items-per-page-select:hover {
          border-color: #B3B347 !important;
        }
      `}</style>
      <button onClick={() => navigate("/dashboard/sensors")} style={styles.backButton}>
        ← Back to Sensors
      </button>

      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.title}>{sensor.name || sensor.type}</h1>
          <span
            style={{
              ...styles.healthBadge,
              backgroundColor: health.color,
            }}
          >
            {health.status}
          </span>
        </div>
        <div style={styles.headerInfo}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Sensor Type:</span>
            <span style={styles.infoValue}>{sensor.type}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Threshold:</span>
            <span style={styles.infoValue}>
              {sensor.min} - {sensor.max} {sensor.unit}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Status:</span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: sensor.status === "active" ? "#4caf50" : "#f44336",
              }}
            >
              {sensor.status}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Last Updated:</span>
            <span style={styles.infoValue}>
              {lastUpdated ? lastUpdated.toLocaleString() : "No data available"}
            </span>
          </div>
        </div>
      </div>

      {/* Graph Section */}
      <div style={styles.graphSection}>
        <div style={styles.graphHeader}>
          <h2 style={styles.sectionTitle}>Live Data</h2>
          <div style={styles.stats}>
            <span style={styles.statItem}>Min: {stats.min.toFixed(2)}</span>
            <span style={styles.statItem}>Max: {stats.max.toFixed(2)}</span>
            <span style={styles.statItem}>Avg: {stats.avg.toFixed(2)}</span>
          </div>
        </div>
        {metricsLoading ? (
          <div style={styles.loading}>Loading chart data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
              <XAxis
                dataKey="timestamp"
                stroke="#9e9e9e"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9e9e9e" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #3a3a3a",
                  color: "#e2e8f0",
                }}
                formatter={(value, name, props) => [
                  `${value} ${sensor.unit}`,
                  "Value",
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#FFFF66"
                strokeWidth={2}
                dot={false}
                name="Sensor Value"
              />
              {sensor.min && (
                <ReferenceLine
                  y={sensor.min}
                  stroke="#4caf50"
                  strokeDasharray="5 5"
                  label={{ value: "Min", position: "insideTopRight" }}
                />
              )}
              {sensor.max && (
                <ReferenceLine
                  y={sensor.max}
                  stroke="#f44336"
                  strokeDasharray="5 5"
                  label={{ value: "Max", position: "insideTopRight" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Time Range Filter and Table */}
      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <h2 style={styles.sectionTitle}>Data Table</h2>
          <div style={styles.timeRangeControls}>
            <input
              type="datetime-local"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              style={styles.timeInput}
              placeholder="From"
            />
            <input
              type="datetime-local"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              style={styles.timeInput}
              placeholder="To"
            />
            <button onClick={handleApplyTimeRange} style={styles.filterButton}>
              Apply Filter
            </button>
            {showTimeRange && (
              <button onClick={handleClearTimeRange} style={styles.clearButton}>
                Clear
              </button>
            )}
            <button onClick={handleDownload} style={styles.downloadButton}>
              Download CSV
            </button>
          </div>
        </div>

        {filteredLoading && showTimeRange && (
          <div style={styles.loading}>Loading filtered data...</div>
        )}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Data Value</th>
                <th style={styles.th}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 && !filteredLoading ? (
                <tr>
                  <td colSpan="3" style={styles.noData}>
                    {showTimeRange ? "No data found for the selected time range" : "No data available"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr key={startIndex + index} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      {row.value.toFixed(2)} {sensor.unit}
                    </td>
                    <td style={styles.td}>{row.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {tableData.length > 0 && (
          <div style={styles.paginationContainer}>
            <div style={styles.paginationInfo}>
              <span style={styles.paginationText}>
                Showing {startIndex + 1} to {Math.min(endIndex, tableData.length)} of {tableData.length} entries
              </span>
              <div style={styles.itemsPerPageContainer}>
                <label style={styles.itemsPerPageLabel}>Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={styles.itemsPerPageSelect}
                  className="items-per-page-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div style={styles.paginationControls}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pagination-button"
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                }}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-button"
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                }}
              >
                Previous
              </button>
              <div style={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "page-number-button active" : "page-number-button"}
                      style={{
                        ...styles.pageNumberButton,
                        ...(currentPage === pageNum ? styles.pageNumberButtonActive : {}),
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-button"
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                }}
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-button"
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                }}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Anomalies Section */}
      <div style={styles.anomaliesSection}>
        <h2 style={styles.sectionTitle}>Recent Anomalies</h2>
        {anomalies.length === 0 ? (
          <p style={styles.noAnomalies}>No anomalies detected</p>
        ) : (
          <div style={styles.anomaliesList}>
            {anomalies.map((anomaly, index) => (
              <div key={index} style={styles.anomalyItem}>
                <span
                  style={{
                    ...styles.anomalyBadge,
                    backgroundColor:
                      anomaly.type === "Below Min" ? "#f59e0b" : "#ef4444",
                  }}
                >
                  {anomaly.type}
                </span>
                <span style={styles.anomalyValue}>
                  Value: {anomaly.value.toFixed(2)} {sensor.unit}
                </span>
                <span style={styles.anomalyTime}>
                  {anomaly.timestampString || (anomaly.timestamp ? anomaly.timestamp.toLocaleString() : "N/A")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    color: "#e2e8f0",
    fontFamily: "sans-serif",
    backgroundColor: "#1a1a1a",
    minHeight: "100vh",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    color: "#9e9e9e",
  },
  error: {
    padding: "2rem",
    textAlign: "center",
    color: "#ef4444",
  },
  backButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#2a2a2a",
    color: "#e2e8f0",
    border: "1px solid #3a3a3a",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "1.5rem",
    fontSize: "14px",
  },
  header: {
    backgroundColor: "#2a2a2a",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    border: "1px solid #3a3a3a",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#FFFF66",
    margin: 0,
  },
  healthBadge: {
    padding: "0.5rem 1rem",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  headerInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  infoLabel: {
    fontSize: "12px",
    color: "#9e9e9e",
  },
  infoValue: {
    fontSize: "16px",
    color: "#e2e8f0",
    fontWeight: "500",
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#fff",
    display: "inline-block",
  },
  graphSection: {
    backgroundColor: "#2a2a2a",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    border: "1px solid #3a3a3a",
  },
  graphHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "500",
    color: "#e2e8f0",
    margin: 0,
  },
  stats: {
    display: "flex",
    gap: "1.5rem",
  },
  statItem: {
    fontSize: "14px",
    color: "#9e9e9e",
  },
  tableSection: {
    backgroundColor: "#2a2a2a",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    border: "1px solid #3a3a3a",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  timeRangeControls: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  timeInput: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #3a3a3a",
    backgroundColor: "#1a1a1a",
    color: "#e2e8f0",
    fontSize: "14px",
  },
  filterButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#2196f3",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  clearButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#757575",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  downloadButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    backgroundColor: "#1a1a1a",
    color: "#FFFF66",
    fontWeight: "600",
    fontSize: "14px",
    borderBottom: "2px solid #3a3a3a",
  },
  tr: {
    borderBottom: "1px solid #3a3a3a",
  },
  td: {
    padding: "1rem",
    fontSize: "14px",
    color: "#e2e8f0",
  },
  noData: {
    padding: "2rem",
    textAlign: "center",
    color: "#9e9e9e",
  },
  anomaliesSection: {
    backgroundColor: "#2a2a2a",
    padding: "1.5rem",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
  },
  noAnomalies: {
    color: "#9e9e9e",
    fontStyle: "italic",
  },
  anomaliesList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  anomalyItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem",
    backgroundColor: "#1a1a1a",
    borderRadius: "6px",
  },
  anomalyBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#fff",
  },
  anomalyValue: {
    flex: 1,
    fontSize: "14px",
    color: "#e2e8f0",
  },
  anomalyTime: {
    fontSize: "12px",
    color: "#9e9e9e",
  },
  paginationContainer: {
    marginTop: "1.5rem",
    paddingTop: "1rem",
    borderTop: "1px solid #3a3a3a",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  paginationInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  paginationText: {
    fontSize: "14px",
    color: "#9e9e9e",
  },
  itemsPerPageContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  itemsPerPageLabel: {
    fontSize: "14px",
    color: "#e2e8f0",
  },
  itemsPerPageSelect: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #3a3a3a",
    backgroundColor: "#1a1a1a",
    color: "#e2e8f0",
    fontSize: "14px",
    cursor: "pointer",
  },
  paginationControls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  paginationButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#2a2a2a",
    color: "#e2e8f0",
    border: "1px solid #3a3a3a",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background-color 0.2s",
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  pageNumbers: {
    display: "flex",
    gap: "0.25rem",
  },
  pageNumberButton: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#2a2a2a",
    color: "#e2e8f0",
    border: "1px solid #3a3a3a",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    minWidth: "40px",
    transition: "background-color 0.2s",
  },
  pageNumberButtonActive: {
    backgroundColor: "#FFFF66",
    color: "#1a1a1a",
    border: "1px solid #FFFF66",
    fontWeight: "600",
  },
};

export default SensorDetailsPage;

