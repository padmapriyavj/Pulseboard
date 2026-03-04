import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CHANGE_PASSWORD } from "../../graphql/settings";

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#2a2a2a",
    borderRadius: "12px",
    padding: "1.5rem",
    maxWidth: "420px",
    width: "90%",
    border: "1px solid #3a3a3a",
  },
  title: {
    margin: "0 0 1rem 0",
    fontSize: "20px",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
    backgroundColor: "#1a1a1a",
    color: "#e2e8f0",
    fontSize: "14px",
    marginBottom: "0.75rem",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "0.25rem",
  },
  error: {
    color: "#ef4444",
    fontSize: "13px",
    marginBottom: "0.75rem",
  },
  success: {
    color: "#10b981",
    fontSize: "13px",
    marginBottom: "0.75rem",
  },
  buttons: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1.25rem",
  },
  btnCancel: {
    padding: "10px 1rem",
    backgroundColor: "#3a3a3a",
    color: "#e2e8f0",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  btnSave: {
    padding: "10px 1rem",
    background: "linear-gradient(135deg, #FFFF66 0%, #FFE566 100%)",
    color: "#1a1a1a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  btnSaveDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: (data) => {
      if (data?.changePassword?.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setApiError("");
        onClose();
      } else {
        setApiError(data?.changePassword?.message || "Failed to update password");
      }
    },
    onError: (err) => {
      setApiError(err?.message || "Unable to save. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");
    setApiError("");
    if (newPassword.length < 8) {
      setValidationError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("New password and confirm password must match");
      return;
    }
    changePassword({
      variables: {
        currentPassword,
        newPassword,
      },
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Change Password</h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={styles.input}
            required
            autoComplete="current-password"
          />
          <label style={styles.label}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <label style={styles.label}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
            autoComplete="new-password"
          />
          {(validationError || apiError) && (
            <div style={styles.error}>{validationError || apiError}</div>
          )}
          <div style={styles.buttons}>
            <button type="button" style={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.btnSave,
                ...(loading ? styles.btnSaveDisabled : {}),
              }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
