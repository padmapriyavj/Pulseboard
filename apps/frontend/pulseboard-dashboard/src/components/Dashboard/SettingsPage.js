import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_USER_SETTINGS,
  UPDATE_PROFILE,
  UPDATE_ORGANIZATION,
} from "../../graphql/settings";
import { useAuth } from "../../hooks/useAuth";
import ChangePasswordModal from "../settings/ChangePasswordModal";
import DeleteAccountModal from "../settings/DeleteAccountModal";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
];

const styles = {
  container: {
    padding: "2rem",
    color: "#e2e8f0",
    backgroundColor: "#1a1a1a",
    minHeight: "100%",
    maxWidth: "800px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    margin: "0 0 1.5rem 0",
    color: "#e2e8f0",
  },
  section: {
    backgroundColor: "#2a2a2a",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    border: "1px solid #3a3a3a",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 1rem 0",
    color: "#FFFF66",
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "0.25rem",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
    backgroundColor: "#1a1a1a",
    color: "#e2e8f0",
    fontSize: "14px",
    marginBottom: "1rem",
    boxSizing: "border-box",
  },
  inputReadOnly: {
    color: "#94a3b8",
    cursor: "not-allowed",
  },
  row: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  btn: {
    padding: "10px 1.25rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #FFFF66 0%, #FFE566 100%)",
    color: "#1a1a1a",
  },
  btnSecondary: {
    backgroundColor: "#3a3a3a",
    color: "#e2e8f0",
  },
  btnDanger: {
    backgroundColor: "#dc2626",
    color: "#fff",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  message: {
    marginBottom: "1rem",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "14px",
  },
  messageSuccess: {
    backgroundColor: "rgba(16,185,129,0.2)",
    color: "#10b981",
  },
  messageError: {
    backgroundColor: "rgba(239,68,68,0.2)",
    color: "#ef4444",
  },
};

function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [emailError, setEmailError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState(null);
  const { updateProfileName } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_USER_SETTINGS, {
    fetchPolicy: "network-only",
  });

  const [updateProfile, { loading: savingProfile }] = useMutation(UPDATE_PROFILE);
  const [updateOrganization, { loading: savingOrg }] = useMutation(UPDATE_ORGANIZATION);

  useEffect(() => {
    if (data?.userSettings) {
      const s = data.userSettings;
      setName(s.name || "");
      setEmail(s.email || "");
      setOrganizationName(s.organizationId || "");
      setTimezone(s.timezone || "UTC");
    }
  }, [data]);

  const initialName = data?.userSettings?.name ?? "";
  const initialEmail = data?.userSettings?.email ?? "";
  const initialTimezone = data?.userSettings?.timezone ?? "UTC";
  const isDirty =
    name.trim() !== initialName ||
    email.trim() !== initialEmail ||
    timezone !== initialTimezone;

  function validateEmail(value) {
    const v = (value || "").trim();
    if (!v) return "Email is required";
    if (!v.includes("@") || !v.includes(".")) return "Enter a valid email (must contain @ and .)";
    return "";
  }
  const saving = savingProfile || savingOrg;

  const handleSave = async () => {
    setMessage(null);
    setEmailError("");
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    try {
      const profileRes = await updateProfile({
        variables: { name: name.trim(), email: email.trim() },
      });
      if (!profileRes.data?.updateProfile?.success) {
        const msg = profileRes.data?.updateProfile?.message || "Profile update failed";
        if (msg === "Email already in use") setEmailError(msg);
        else setMessage({ type: "error", text: msg });
        return;
      }
      const orgRes = await updateOrganization({
        variables: {
          organizationName: organizationName.trim() || data?.userSettings?.organizationId,
          timezone,
        },
      });
      if (!orgRes.data?.updateOrganization?.success) {
        setMessage({ type: "error", text: orgRes.data?.updateOrganization?.message || "Organization update failed" });
        return;
      }
      updateProfileName(name.trim());
      setMessage({ type: "success", text: "Settings saved successfully" });
      setTimeout(() => setMessage(null), 4000);
      refetch();
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Unable to save. Please try again." });
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ color: "#94a3b8" }}>Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.messageError}>Error loading settings: {error.message}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>

      {message && (
        <div
          style={{
            ...styles.message,
            ...(message.type === "success" ? styles.messageSuccess : styles.messageError),
          }}
        >
          {message.text}
        </div>
      )}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Profile</h2>
        <label style={styles.label}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          placeholder="Your name"
        />
        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(validateEmail(e.target.value));
          }}
          onBlur={() => setEmailError(validateEmail(email))}
          style={{
            ...styles.input,
            ...(emailError ? { borderColor: "#ef4444" } : {}),
          }}
          placeholder="you@example.com"
        />
        {emailError && (
          <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            {emailError}
          </div>
        )}
        <div style={{ ...styles.row, marginTop: "1rem" }}>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnDanger }}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Organization</h2>
        <label style={styles.label}>Organization (read-only)</label>
        <input
          type="text"
          value={organizationName}
          readOnly
          style={{ ...styles.input, ...styles.inputReadOnly }}
        />
        <label style={styles.label}>Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          style={styles.input}
        >
          {TIMEZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      <button
        type="button"
        style={{
          ...styles.btn,
          ...styles.btnPrimary,
          ...(!isDirty || saving || emailError ? styles.btnDisabled : {}),
        }}
        disabled={!isDirty || saving || !!emailError}
        onClick={handleSave}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}

export default SettingsPage;
