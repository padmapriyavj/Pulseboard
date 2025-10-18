import React, { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import client from "./apolloClient";

import Register from "./components/Register";
import Login from "./components/Login";
import SensorSelector from "./components/SensorSelector";
import ChartView from "./components/ChartView";

function Dashboard({ orgId, onLogout }) {
  const [sensorType, setSensorType] = useState(null);

  return (
    <>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>PulseBoard Dashboard</h2>
        <button onClick={onLogout}>Logout</button>
      </header>

      <SensorSelector orgId={orgId} onSensorChange={setSensorType} />
      {sensorType && <ChartView orgId={orgId} sensorType={sensorType} />}
    </>
  );
}

function AppRoutes() {
  const navigate = useNavigate(); 
  const [orgId, setOrgId] = useState(() => localStorage.getItem("org_id"));

  useEffect(() => {
    const storedOrgId = localStorage.getItem("org_id");
    setOrgId(storedOrgId);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("org_id");
    setOrgId(null);
    navigate("/"); 
  };

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          orgId ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login
              onLogin={(org) => {
                localStorage.setItem("org_id", org);
                setOrgId(org);
              }}
            />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          orgId ? (
            <Dashboard orgId={orgId} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <AppRoutes />
      </Router>
    </ApolloProvider>
  );
}

export default App;
