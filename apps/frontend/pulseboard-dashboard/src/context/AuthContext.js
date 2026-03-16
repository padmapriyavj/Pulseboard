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
    const tokenFromSession = sessionStorage.getItem("token");
    const tokenFromLocal = localStorage.getItem("token");
    const token = tokenFromSession || tokenFromLocal;
    const storage = tokenFromSession ? sessionStorage : localStorage;
    const orgId = storage.getItem("org_id");
    let userName = storage.getItem("user_name");

    console.log("AuthContext init - token:", token ? "exists" : "none", "orgId:", orgId, "userName from storage:", userName);

    // If userName is not in storage but token exists, try to decode it from JWT
    if (!userName && token) {
      const decoded = decodeJWT(token);
      console.log("Decoded JWT:", decoded);
      if (decoded && decoded.name) {
        userName = decoded.name;
        console.log("Found userName in JWT:", userName);
        storage.setItem("user_name", userName);
      } else if (decoded && decoded.email) {
        userName = decoded.email.split('@')[0];
        console.log("Using email as userName:", userName);
        storage.setItem("user_name", userName);
      }
    }

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

  const login = (token, orgId, userName, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    if (!rememberMe) {
      localStorage.removeItem("token");
      localStorage.removeItem("org_id");
      localStorage.removeItem("user_name");
    }
    storage.setItem("token", token);
    storage.setItem("org_id", orgId);
    storage.setItem("user_name", userName);
    setAuthData({ token, orgId, userName });
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("org_id");
    sessionStorage.removeItem("user_name");
    localStorage.removeItem("token");
    localStorage.removeItem("org_id");
    localStorage.removeItem("user_name");
    setAuthData({ token: null, orgId: null, userName: null });
  };

  const updateProfileName = (userName) => {
    if (userName) {
      const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
      storage.setItem("user_name", userName);
      setAuthData((prev) => ({ ...prev, userName }));
    }
  };

  const value = {
    ...authData,
    login,
    logout,
    updateProfileName,
    isAuthenticated: !!authData.token,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
