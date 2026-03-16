import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "chart" },
    { path: "/dashboard/sensors", label: "Sensors", icon: "sensor" },
    { path: "/dashboard/analytics", label: "Analytics", icon: "bar" },
    { path: "/dashboard/alerts", label: "Alerts", icon: "bell" },
    { path: "/dashboard/insights", label: "Insights", icon: "lightbulb" },
    { path: "/dashboard/settings", label: "Settings", icon: "gear" },
  ];

  const Icon = ({ name }) => {
    const w = 20; const h = 20;
    const stroke = "currentColor"; const strokeW = 2;
    switch (name) {
      case "chart":
        return (
          <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
        );
      case "sensor":
        return (
          <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><circle cx="12" cy="12" r="1.5"/></svg>
        );
      case "bar":
        return (
          <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
        );
      case "bell":
        return (
          <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        );
      case "lightbulb":
        return (
          <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
        );
      case "gear":
        return (
          <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        );
      default:
        return null;
    }
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

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
            <span className="nav-icon"><Icon name={item.icon} /></span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
