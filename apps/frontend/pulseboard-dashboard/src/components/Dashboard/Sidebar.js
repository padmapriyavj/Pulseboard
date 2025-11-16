import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/dashboard/sensors", label: "Sensors", icon: "📡" },
    { path: "/dashboard/analytics", label: "Analytics", icon: "📈" },
    { path: "/dashboard/alerts", label: "Alerts", icon: "⚠️" },
    { path: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button
        className="collapse-button"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? "→" : "←"}
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? "active" : ""}`}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
