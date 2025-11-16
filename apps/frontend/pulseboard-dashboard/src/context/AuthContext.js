import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

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
    const userName = localStorage.getItem("user_name");

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
