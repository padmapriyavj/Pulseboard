import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { GET_SENSORS, ADD_SENSOR, UPDATE_SENSOR, DELETE_SENSOR } from "../../graphql/sensors";
import sensorMetadata from "../sensorMeta";
import { useAuth } from "../../hooks/useAuth";

const SensorsPage = () => {
  const { orgId, loading: authLoading } = useAuth(); 
  const navigate = useNavigate(); 
  const [selectedSensor, setSelectedSensor] = useState("");
  const [name, setName] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [status, setStatus] = useState("active");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editSensor, setEditSensor] = useState("");
  const [editName, setEditName] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { loading, error, data, refetch } = useQuery(GET_SENSORS, {
    variables: { org_id: orgId },
    skip: !orgId, 
  });

  const [addSensor] = useMutation(ADD_SENSOR);
  const [updateSensor] = useMutation(UPDATE_SENSOR);
  const [deleteSensor] = useMutation(DELETE_SENSOR);

  if (authLoading) {
    return (
      <div style={{ padding: "2rem", color: "#e2e8f0" }}>
        Loading authentication...
      </div>
    );
  }

  const handleAddSensor = async () => {
    if (!selectedSensor || min === "" || max === "") return;

    try {
      await addSensor({
        variables: {
          input: {
            org_id: orgId,
            name: name || null,
            type: selectedSensor,
            min: parseFloat(min),
            max: parseFloat(max),
            unit: sensorMetadata[selectedSensor]?.unit || "",
            status,
          },
        },
      });

      setSelectedSensor("");
      setName("");
      setMin("");
      setMax("");
      setStatus("active");
      await refetch();
    } catch (err) {
      console.error("Failed to add sensor", err);
      alert("Failed to add sensor: " + err.message);
    }
  };

  const handleEditClick = (sensor) => {
    setEditingId(sensor.id);
    setEditSensor(sensor.type);
    setEditName(sensor.name || "");
    setEditMin(sensor.min?.toString() || "");
    setEditMax(sensor.max?.toString() || "");
    setEditStatus(sensor.status || "active");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditSensor("");
    setEditName("");
    setEditMin("");
    setEditMax("");
    setEditStatus("active");
  };

  const handleUpdateSensor = async (id) => {
    if (!editSensor || editMin === "" || editMax === "") {
      alert("Please fill in all required fields (Type, Min, Max)");
      return;
    }

    const minValue = parseFloat(editMin);
    const maxValue = parseFloat(editMax);

    if (isNaN(minValue) || isNaN(maxValue)) {
      alert("Min and Max values must be valid numbers");
      return;
    }

    if (minValue >= maxValue) {
      alert("Max value must be greater than Min value");
      return;
    }

    try {
      await updateSensor({
        variables: {
          id: parseInt(id),
          input: {
            name: editName || null,
            type: editSensor,
            min: minValue,
            max: maxValue,
            unit: sensorMetadata[editSensor]?.unit || "",
            status: editStatus,
          },
        },
      });

      handleCancelEdit();
      await refetch();
    } catch (err) {
      console.error("Failed to update sensor", err);
      const errorMessage = err.graphQLErrors?.[0]?.message || err.networkError?.message || err.message || "Unknown error";
      alert("Failed to update sensor: " + errorMessage);
    }
  };

  const handleDeleteSensor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sensor?")) {
      return;
    }

    try {
      await deleteSensor({
        variables: { id },
      });
      await refetch();
    } catch (err) {
      console.error("Failed to delete sensor", err);
      alert("Failed to delete sensor: " + err.message);
    }
  };

  const unit = selectedSensor ? sensorMetadata[selectedSensor]?.unit : "";

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort sensors
  const getFilteredAndSortedSensors = () => {
    if (!data?.getSensors) return [];

    let filtered = data.getSensors.filter((sensor) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        sensor.name?.toLowerCase().includes(searchLower) ||
        sensor.type?.toLowerCase().includes(searchLower) ||
        sensor.unit?.toLowerCase().includes(searchLower) ||
        sensor.status?.toLowerCase().includes(searchLower) ||
        sensor.id?.toString().includes(searchLower) ||
        sensor.min?.toString().includes(searchLower) ||
        sensor.max?.toString().includes(searchLower)
      );
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric sorting
        if (sortConfig.key === "id" || sortConfig.key === "min" || sortConfig.key === "max") {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        } else {
          // String sorting
          aValue = (aValue || "").toString().toLowerCase();
          bValue = (bValue || "").toString().toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const filteredSensors = getFilteredAndSortedSensors();

  return (
    <div style={styles.container}>
      <style>{`
        .sensor-table-row:hover {
          background-color: #333 !important;
          cursor: pointer;
        }
        .sensor-edit-button:hover {
          background-color: #45a049 !important;
        }
        .sensor-delete-button:hover {
          background-color: #da190b !important;
        }
        .sensor-save-button:hover {
          background-color: #0b7dda !important;
        }
        .sensor-cancel-button:hover {
          background-color: #9e9e9e !important;
        }
        .sensor-add-button:hover {
          background-color: #e6e600 !important;
        }
        .sortable-header {
          cursor: pointer;
          user-select: none;
          position: relative;
        }
        .sortable-header:hover {
          background-color: #2a2a2a !important;
        }
        .clear-search-button:hover {
          color: #fff !important;
          background-color: #3a3a3a !important;
        }
      `}</style>
      <h2 style={styles.title}>Manage Sensors</h2>

      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>Add New Sensor</h3>
      <div style={styles.form}>
          <input
            type="text"
            placeholder="Sensor Name (optional)"
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

        <select
          style={styles.input}
          value={selectedSensor}
          onChange={(e) => setSelectedSensor(e.target.value)}
        >
          <option value="">Select Sensor Type</option>
          {Object.keys(sensorMetadata).map((sensor) => (
            <option key={sensor} value={sensor}>
              {sensor.charAt(0).toUpperCase() + sensor.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min Value"
          style={styles.input}
          value={min}
          onChange={(e) => setMin(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Value"
          style={styles.input}
          value={max}
          onChange={(e) => setMax(e.target.value)}
        />

        <input
          type="text"
          value={unit}
          readOnly
            style={{ ...styles.input, backgroundColor: "#3a3a3a", cursor: "not-allowed" }}
          placeholder="Unit"
        />

        <select
          value={status}
          style={styles.input}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

          <button onClick={handleAddSensor} style={styles.button} className="sensor-add-button">
            Add Sensor
        </button>
        </div>
      </div>

      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <h3 style={styles.sectionTitle}>Sensor List</h3>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search sensors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={styles.clearSearchButton}
                className="clear-search-button"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {!loading && !error && data?.getSensors && data.getSensors.length > 0 && (
          <p style={styles.resultCount}>
            Showing {filteredSensors.length} of {data.getSensors.length} sensor{data.getSensors.length !== 1 ? "s" : ""}
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </p>
        )}

        {loading && <p style={styles.message}>Loading sensors...</p>}
        {error && <p style={{ ...styles.message, color: "#ff6b6b" }}>Error loading sensors: {error.message}</p>}
        {!loading && !error && (!data?.getSensors || data.getSensors.length === 0) && (
          <p style={styles.message}>No sensors found. Add your first sensor above.</p>
        )}
        {!loading && !error && data?.getSensors && data.getSensors.length > 0 && filteredSensors.length === 0 && (
          <p style={styles.message}>No sensors match your search criteria.</p>
        )}

        {!loading && !error && filteredSensors.length > 0 && (
          <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
                  <th 
                    style={styles.th} 
                    onClick={() => handleSort("id")}
                    className="sortable-header"
                  >
                    ID {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    style={styles.th} 
                    onClick={() => handleSort("name")}
                    className="sortable-header"
                  >
                    Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    style={styles.th} 
                    onClick={() => handleSort("type")}
                    className="sortable-header"
                  >
                    Type {sortConfig.key === "type" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    style={styles.th} 
                    onClick={() => handleSort("min")}
                    className="sortable-header"
                  >
                    Min Value {sortConfig.key === "min" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    style={styles.th} 
                    onClick={() => handleSort("max")}
                    className="sortable-header"
                  >
                    Max Value {sortConfig.key === "max" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    style={styles.th} 
                    onClick={() => handleSort("unit")}
                    className="sortable-header"
                  >
                    Unit {sortConfig.key === "unit" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    style={styles.th} 
                    onClick={() => handleSort("status")}
                    className="sortable-header"
                  >
                    Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
                {filteredSensors.map((s) => (
                  <React.Fragment key={s.id}>
                    {editingId === s.id ? (
                      <tr style={styles.editRow}>
                        <td style={styles.td}>{s.id}</td>
                        <td style={styles.td}>
                          <input
                            type="text"
                            placeholder="Sensor Name (optional)"
                            style={styles.editInput}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </td>
                        <td style={styles.td}>
                          <select
                            style={styles.editInput}
                            value={editSensor}
                            onChange={(e) => setEditSensor(e.target.value)}
                          >
                            {Object.keys(sensorMetadata).map((sensor) => (
                              <option key={sensor} value={sensor}>
                                {sensor.charAt(0).toUpperCase() + sensor.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            style={styles.editInput}
                            value={editMin}
                            onChange={(e) => setEditMin(e.target.value)}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            style={styles.editInput}
                            value={editMax}
                            onChange={(e) => setEditMax(e.target.value)}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="text"
                            value={sensorMetadata[editSensor]?.unit || ""}
                            readOnly
                            style={{ ...styles.editInput, backgroundColor: "#3a3a3a", cursor: "not-allowed" }}
                          />
                        </td>
                        <td style={styles.td}>
                          <select
                            style={styles.editInput}
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleUpdateSensor(s.id)}
                            style={styles.saveButton}
                            className="sensor-save-button"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={styles.cancelButton}
                            className="sensor-cancel-button"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr 
                        style={styles.tr} 
                        className="sensor-table-row"
                        onClick={(e) => {
                          // Don't navigate if clicking on buttons
                          if (e.target.tagName === 'BUTTON') return;
                          navigate(`/dashboard/sensors/${s.id}`);
                        }}
                      >
                        <td style={styles.td}>{s.id}</td>
                        <td style={styles.td}>{s.name || "-"}</td>
                        <td style={styles.td}>{s.type}</td>
                        <td style={styles.td}>{s.min}</td>
                        <td style={styles.td}>{s.max}</td>
                        <td style={styles.td}>{s.unit}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: s.status === "active" ? "#4caf50" : "#f44336",
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditClick(s)}
                            style={styles.editButton}
                            className="sensor-edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSensor(s.id)}
                            style={styles.deleteButton}
                            className="sensor-delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
          ))}
        </tbody>
      </table>
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
  title: {
    fontSize: "28px",
    marginBottom: "2rem",
    fontWeight: "600",
    color: "#FFFF66",
  },
  formSection: {
    marginBottom: "3rem",
    padding: "1.5rem",
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
  },
  sectionTitle: {
    fontSize: "20px",
    marginBottom: "1.5rem",
    color: "#e2e8f0",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #B3B347",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    flex: "1 1 150px",
    fontSize: "14px",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#FFFF66",
    color: "#1a1a1a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background-color 0.2s",
  },
  tableSection: {
    marginTop: "2rem",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    position: "relative",
  },
  searchInput: {
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    border: "1px solid #B3B347",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    fontSize: "14px",
    minWidth: "250px",
    paddingRight: "2.5rem",
  },
  clearSearchButton: {
    position: "absolute",
    right: "0.5rem",
    background: "transparent",
    border: "none",
    color: "#9e9e9e",
    cursor: "pointer",
    fontSize: "18px",
    padding: "0.25rem 0.5rem",
    lineHeight: "1",
    borderRadius: "4px",
    transition: "color 0.2s",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
    backgroundColor: "#2a2a2a",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    backgroundColor: "#1a1a1a",
    color: "#FFFF66",
    fontWeight: "600",
    fontSize: "14px",
    borderBottom: "2px solid #3a3a3a",
    borderRight: "1px solid #3a3a3a",
  },
  tr: {
    borderBottom: "1px solid #3a3a3a",
    transition: "background-color 0.2s",
  },
  editRow: {
    borderBottom: "1px solid #3a3a3a",
    backgroundColor: "#2a3a2a",
  },
  td: {
    padding: "1rem",
    borderRight: "1px solid #3a3a3a",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#fff",
    display: "inline-block",
  },
  editButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "0.5rem",
    fontSize: "12px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  deleteButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  saveButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#2196f3",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "0.5rem",
    fontSize: "12px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  cancelButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#757575",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  editInput: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #B3B347",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: "14px",
    width: "100%",
  },
  message: {
    padding: "1rem",
    textAlign: "center",
    color: "#9e9e9e",
  },
  resultCount: {
    marginBottom: "1rem",
    color: "#9e9e9e",
    fontSize: "14px",
    fontStyle: "italic",
  },
};

export default SensorsPage;
