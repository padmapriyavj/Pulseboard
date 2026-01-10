import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./TopHeader.css";

function TopHeader() {
  const { userName, orgId, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="logo-section" onClick={handleDashboardClick}>
          <div className="logo-icon">PB</div>
          <h1 className="logo-text">PulseBoard</h1>
        </div>
      </div>

      <div className="header-center">
        <p className="org-name">{orgId}</p>
      </div>

      <div className="header-right">
        <div className="user-section">
          <p className="user-greeting">Welcome, {userName || "User"}</p>
          <div className="profile-menu-wrapper">
            <button
              className="avatar-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title={userName || "User"}
            >
              {(userName && userName.charAt(0).toUpperCase()) || "U"}
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <a
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Profile Settings
                </a>
                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
