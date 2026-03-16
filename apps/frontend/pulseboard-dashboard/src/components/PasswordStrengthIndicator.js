import React from "react";
import { validatePasswordClient } from "../utils/passwordValidation";

const styles = {
  container: {
    marginTop: "8px",
    padding: "12px",
    backgroundColor: "#1f2937",
    borderRadius: "8px",
    border: "1px solid #374151",
  },
  strengthLabel: {
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "6px",
  },
  strengthValue: {
    fontSize: "13px",
    fontWeight: "600",
  },
  barTrack: {
    height: "4px",
    borderRadius: "2px",
    backgroundColor: "#374151",
    overflow: "hidden",
    marginBottom: "12px",
    transition: "background-color 0.2s ease",
  },
  barFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.2s ease",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  item: {
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  itemMet: {
    color: "#10b981",
    fontWeight: "600",
  },
  itemUnmet: {
    color: "#6b7280",
  },
  iconMet: {
    color: "#10b981",
    fontWeight: "bold",
  },
  iconUnmet: {
    color: "#ef4444",
    fontWeight: "bold",
  },
};

const STRENGTH_COLORS = {
  weak: "#ef4444",
  medium: "#f59e0b",
  strong: "#10b981",
};

export default function PasswordStrengthIndicator({ password, "aria-label": ariaLabel }) {
  const { checks, strength } = validatePasswordClient(password);
  const strengthColor = STRENGTH_COLORS[strength];
  const barWidth =
    strength === "weak" ? 33 : strength === "medium" ? 66 : 100;

  const requirements = [
    { key: "length", label: "At least 8 characters", met: checks.length },
    { key: "uppercase", label: "One uppercase letter", met: checks.uppercase },
    { key: "lowercase", label: "One lowercase letter", met: checks.lowercase },
    { key: "number", label: "One number", met: checks.number },
    { key: "special", label: "One special character (optional)", met: checks.special },
  ];

  return (
    <div
      style={styles.container}
      role="status"
      aria-label={ariaLabel || "Password strength and requirements"}
      aria-live="polite"
    >
      <div style={styles.strengthLabel}>Password strength:</div>
      <div
        style={{
          ...styles.strengthValue,
          color: strengthColor,
          textTransform: "capitalize",
        }}
      >
        {strength}
      </div>
      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${barWidth}%`,
            backgroundColor: strengthColor,
          }}
        />
      </div>
      <ul style={styles.list}>
        {requirements.map(({ key, label, met }) => (
          <li
            key={key}
            style={{
              ...styles.item,
              ...(met ? styles.itemMet : styles.itemUnmet),
            }}
          >
            <span
              style={met ? styles.iconMet : styles.iconUnmet}
              aria-hidden="true"
            >
              {met ? "\u2713" : "\u2717"}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isPasswordValid(password) {
  return validatePasswordClient(password || "").isValid;
}
