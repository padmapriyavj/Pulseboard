import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { DELETE_ACCOUNT } from "../../graphql/settings";

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
    color: "#ef4444",
  },
  warning: {
    color: "#f59e0b",
    fontSize: "14px",
    marginBottom: "1rem",
    lineHeight: 1.5,
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
  btnDelete: {
    padding: "10px 1rem",
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  btnDeleteDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

function DeleteAccountModal({ onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [deleteAccount, { loading }] = useMutation(DELETE_ACCOUNT, {
    onCompleted: (data) => {
      if (data?.deleteAccount?.success) {
        logout();
        navigate("/", { replace: true });
      } else {
        setError(data?.deleteAccount?.message || "Deletion failed");
      }
    },
    onError: (err) => {
      setError(err?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) return;
    deleteAccount({ variables: { password } });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Delete Account</h2>
        <p style={styles.warning}>
          This action cannot be undone. All your data, sensors, and alerts will be permanently deleted.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Enter your password to confirm</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Password"
            required
            autoComplete="current-password"
          />
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.buttons}>
            <button type="button" style={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.btnDelete,
                ...(loading || !password.trim() ? styles.btnDeleteDisabled : {}),
              }}
              disabled={loading || !password.trim()}
            >
              {loading ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteAccountModal;
