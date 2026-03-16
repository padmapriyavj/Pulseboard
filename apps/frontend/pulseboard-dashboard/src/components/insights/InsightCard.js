import React from "react";
import "./InsightCard.css";

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

function SeverityIcon({ severity }) {
  const s = (severity || "").toUpperCase();
  const size = 20;
  const stroke = "currentColor";
  const strokeW = 2;
  if (s === "CRITICAL") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
      </svg>
    );
  }
  if (s === "WARNING") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}

function InsightCard({ insight }) {
  const severity = (insight.severity || "").toUpperCase();
  const isCritical = severity === "CRITICAL";
  const isWarning = severity === "WARNING";

  const variant = isCritical ? "critical" : isWarning ? "warning" : "info";
  const severityLabel = severity || "INFO";

  return (
    <div className={`insight-card insight-card--${variant}`}>
      <div className="insight-card__body">
        <span className="insight-card__icon">
          <SeverityIcon severity={severity} />
        </span>
        <p className="insight-card__text">{insight.insightText}</p>
      </div>
      <div className="insight-card__meta">
        <span className="insight-card__severity">{severityLabel}</span>
        <span>{formatInsightType(insight.insightType)}</span>
        <span>{formatTimeAgo(insight.createdAt)}</span>
      </div>
    </div>
  );
}

export default InsightCard;
