import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { 
      path: "/dashboard", 
      label: "Dashboard"
    },
    { 
      path: "/dashboard/sensors", 
      label: "Sensors"
    },
    { 
      path: "/dashboard/analytics", 
      label: "Analytics"
    },
    { 
      path: "/dashboard/alerts", 
      label: "Alerts"
    },
    { 
      path: "/dashboard/insights", 
      label: "Insights"
    },
    { 
      path: "/dashboard/settings", 
      label: "Settings"
    },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button
        className="collapse-button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
        >
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? "active" : ""}`}
            title={item.label}
          >
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
