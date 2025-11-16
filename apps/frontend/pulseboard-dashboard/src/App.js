// src/App.js
import React from "react";
import { ApolloProvider } from "@apollo/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import client from "./apolloClient";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

// Auth Components
import Register from "./components/Register";
import Login from "./components/Login";

// Dashboard Layout
import Dashboard from "./components/Dashboard/Dashboard";

// Dashboard Pages
import DashboardOverview from "./components/DashboardOverview";
import SensorsPage from "./components/Dashboard/SensorsPage";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        color: "#e2e8f0",
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

// Routes Component
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="sensors" element={<SensorsPage />}/>
        {/* Future routes */}
        {/* <Route path="sensors" element={<SensorsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} /> */}
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;