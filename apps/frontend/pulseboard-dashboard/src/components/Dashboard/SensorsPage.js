import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_SENSORS, ADD_SENSOR } from "../../graphql/sensors";
import sensorMetadata from "../sensorMeta";
import { useAuth } from "../../hooks/useAuth";

const SensorsPage = () => {
  const { orgId, loading: authLoading } = useAuth(); 
  const [selectedSensor, setSelectedSensor] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [status, setStatus] = useState("active");

  const { loading, error, data, refetch } = useQuery(GET_SENSORS, {
    variables: { org_id: orgId },
    skip: !orgId, 
  });

  const [addSensor] = useMutation(ADD_SENSOR);

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
            type: selectedSensor,
            min: parseFloat(min),
            max: parseFloat(max),
            unit: sensorMetadata[selectedSensor]?.unit || "",
            status,
          },
        },
      });

      setSelectedSensor("");
      setMin("");
      setMax("");
      setStatus("active");
      await refetch();
    } catch (err) {
      console.error("Failed to add sensor", err);
    }
  };

  const unit = selectedSensor ? sensorMetadata[selectedSensor]?.unit : "";

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Add Sensor</h2>

      <div style={styles.form}>
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
          style={{ ...styles.input, backgroundColor: "#eee" }}
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

        <button onClick={handleAddSensor} style={styles.button}>
          Add
        </button>
      </div>

      <h3 style={{ marginTop: 30 }}>Added Sensors</h3>

      {loading && <p>Loading...</p>}
      {error && <p>Error loading sensors.</p>}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Min</th>
            <th>Max</th>
            <th>Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.getSensors?.map((s) => (
            <tr key={s.id}>
              <td>{s.type}</td>
              <td>{s.min}</td>
              <td>{s.max}</td>
              <td>{s.unit}</td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    fontSize: "24px",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2rem",
  },
  input: {
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #B3B347",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    flex: "1 1 150px",
  },
  button: {
    padding: "0.6rem 1.2rem",
    backgroundColor: "#FFFF66",
    color: "#1a1a1a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
};

export default SensorsPage;
