import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// Helper function to decode JWT token (without verification, just for reading payload)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [authData, setAuthData] = useState({
    token: null,
    orgId: null,
    userName: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const orgId = localStorage.getItem("org_id");
    let userName = localStorage.getItem("user_name");

    console.log("AuthContext init - token:", token ? "exists" : "none", "orgId:", orgId, "userName from storage:", userName);

    // If userName is not in localStorage but token exists, try to decode it from JWT
    if (!userName && token) {
      const decoded = decodeJWT(token);
      console.log("Decoded JWT:", decoded);
      if (decoded && decoded.name) {
        userName = decoded.name;
        console.log("Found userName in JWT:", userName);
        // Store it for future use
        localStorage.setItem("user_name", userName);
      } else if (decoded && decoded.email) {
        // Fallback: use email username if name not in JWT
        userName = decoded.email.split('@')[0];
        console.log("Using email as userName:", userName);
        localStorage.setItem("user_name", userName);
      }
    }

    // Final fallback to "User" if still no name found
    if (!userName) {
      userName = "User";
    }

    console.log("Final userName set:", userName);

    setAuthData({
      token: token || null,
      orgId: orgId || null,
      userName: userName || "User",
    });
    setLoading(false);
  }, []);

  const login = (token, orgId, userName) => {
    localStorage.setItem("token", token);
    localStorage.setItem("org_id", orgId);
    localStorage.setItem("user_name", userName);
    setAuthData({ token, orgId, userName });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("org_id");
    localStorage.removeItem("user_name");
    setAuthData({ token: null, orgId: null, userName: null });
  };

  const value = {
    ...authData,
    login,
    logout,
    isAuthenticated: !!authData.token,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
