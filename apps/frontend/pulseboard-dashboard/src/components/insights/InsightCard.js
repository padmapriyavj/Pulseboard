import React from "react";

function formatTimeAgo(timestamp) {
  if (!timestamp) return "Unknown";
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return past.toLocaleDateString();
}

function formatInsightType(type) {
  if (!type) return "";
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function InsightCard({ insight }) {
  const severity = (insight.severity || "").toUpperCase();
  const isCritical = severity === "CRITICAL";
  const isWarning = severity === "WARNING";
  const isInfo = severity === "INFO";

  const borderColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#3b82f6";
  const bgColor = isCritical ? "rgba(239,68,68,0.1)" : isWarning ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)";
  const icon = isCritical ? "🚨" : isWarning ? "⚠️" : "ℹ️";

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "8px",
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        marginBottom: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.25rem" }}>{icon}</span>
        <p style={{ margin: 0, color: "#e2e8f0", fontSize: "15px", lineHeight: 1.5, flex: 1 }}>
          {insight.insightText}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "12px", color: "#94a3b8" }}>
        <span style={{ fontWeight: 600, color: borderColor }}>{severity}</span>
        <span>{formatInsightType(insight.insightType)}</span>
        <span>{formatTimeAgo(insight.createdAt)}</span>
      </div>
    </div>
  );
}

export default InsightCard;
