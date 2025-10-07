import React, { useState } from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import client from "./apolloClient";

import Register from "./components/Register";
import Login from "./components/Login";
import SensorSelector from "./components/SensorSelector";
import ChartView from "./components/ChartView";

function Dashboard({ orgId }) {
  const [sensorType, setSensorType] = useState(null);

  return (
    <>
      <h2>PulseBoard Dashboard</h2>
      <SensorSelector orgId={orgId} onSensorChange={setSensorType} />
      {sensorType && <ChartView orgId={orgId} sensorType={sensorType} />}
    </>
  );
}

function App() {
  const [orgId, setOrgId] = useState(localStorage.getItem("org_id"));

  return (
    <ApolloProvider client={client}>
      <Router>
        <Routes>
          <Route
            path="/register"
            element={
              <Register onRegistered={() => (window.location.href = "/")} />
            }
          />
          <Route
            path="/"
            element={
              <Login
                onLogin={(org) => {
                  localStorage.setItem("org_id", org);
                  setOrgId(org);
                }}
              />
            }
          />
          <Route
            path="/dashboard"
            element={orgId ? <Dashboard orgId={orgId} /> : <Navigate to="/" />}
          />
        </Routes>
      </Router>
    </ApolloProvider>
  );
}

export default App;
