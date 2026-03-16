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
  inputEdited: {
    borderColor: "rgba(244, 249, 107, 0.5)",
    boxShadow: "0 0 0 1px rgba(244, 249, 107, 0.25)",
  },
  editedIndicator: {
    color: "#f4f96b",
    fontWeight: 600,
  },
  divider: {
    border: "none",
    borderTop: "1px solid #374151",
    margin: "1.5rem 0 0 0",
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
  btnCancel: {
    backgroundColor: "transparent",
    color: "#d1d5db",
    border: "1px solid #4b5563",
  },
  btnDanger: {
    backgroundColor: "#dc2626",
    color: "#fff",
  },
  btnDangerOutlined: {
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1px solid #dc2626",
    padding: "8px 1rem",
    fontSize: "13px",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  message: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid",
  },
  messageSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#047857",
    color: "#34d399",
  },
  messageError: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#b91c1c",
    color: "#f87171",
  },
};

function validateEmail(value) {
  const v = (value || "").trim();
  if (!v) return "Email is required";
  if (!v.includes("@") || !v.includes(".")) return "Enter a valid email (must contain @ and .)";
  return "";
}

function SettingsPage() {
  const [initialValues, setInitialValues] = useState({ name: "", email: "" });
  const [formValues, setFormValues] = useState({ name: "", email: "" });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  const [organizationName, setOrganizationName] = useState("");
  const [initialTimezone, setInitialTimezone] = useState("UTC");
  const [timezone, setTimezone] = useState("UTC");
  const [hasOrgChanges, setHasOrgChanges] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgMessage, setOrgMessage] = useState({ type: "", text: "" });

  const [emailError, setEmailError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { updateProfileName } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_USER_SETTINGS, {
    fetchPolicy: "network-only",
  });

  const [updateProfile, { loading: savingProfile }] = useMutation(UPDATE_PROFILE);
  const [updateOrganization, { loading: savingOrg }] = useMutation(UPDATE_ORGANIZATION);

  useEffect(() => {
    if (data?.userSettings) {
      const s = data.userSettings;
      const nameVal = s.name || "";
      const emailVal = s.email || "";
      const tzVal = s.timezone || "UTC";
      setInitialValues({ name: nameVal, email: emailVal });
      setFormValues({ name: nameVal, email: emailVal });
      setOrganizationName(s.organizationId || "");
      setInitialTimezone(tzVal);
      setTimezone(tzVal);
    }
  }, [data]);

  useEffect(() => {
    const nameDiff = formValues.name.trim() !== initialValues.name.trim();
    const emailDiff = formValues.email.trim() !== initialValues.email.trim();
    setHasChanges(nameDiff || emailDiff);
  }, [formValues, initialValues]);

  useEffect(() => {
    setHasOrgChanges(timezone !== initialTimezone);
  }, [timezone, initialTimezone]);

  useEffect(() => {
    if (hasChanges && saveMessage.text) setSaveMessage({ type: "", text: "" });
  }, [hasChanges]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (hasChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasChanges]);

  const handleCancel = () => {
    setFormValues(initialValues);
    setHasChanges(false);
    setSaveMessage({ type: "", text: "" });
    setEmailError("");
  };

  const handleSaveProfile = async () => {
    setSaveMessage({ type: "", text: "" });
    setEmailError("");
    if (!formValues.name.trim()) {
      setSaveMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }
    const emailValidation = validateEmail(formValues.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      setSaveMessage({ type: "error", text: emailValidation });
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateProfile({
        variables: { name: formValues.name.trim(), email: formValues.email.trim() },
      });
      if (!res.data?.updateProfile?.success) {
        const msg = res.data?.updateProfile?.message || "Profile update failed";
        if (msg === "Email already in use") setEmailError(msg);
        setSaveMessage({ type: "error", text: `Failed to update profile: ${msg}` });
        return;
      }
      updateProfileName(formValues.name.trim());
      setInitialValues({ name: formValues.name.trim(), email: formValues.email.trim() });
      setHasChanges(false);
      setSaveMessage({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
      refetch();
    } catch (err) {
      setSaveMessage({ type: "error", text: `Failed to update profile: ${err?.message || "Please try again."}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setOrgMessage({ type: "", text: "" });
    setIsSavingOrg(true);
    try {
      const res = await updateOrganization({
        variables: {
          organizationName: organizationName.trim() || data?.userSettings?.organizationId,
          timezone,
        },
      });
      if (!res.data?.updateOrganization?.success) {
        setOrgMessage({
          type: "error",
          text: res.data?.updateOrganization?.message || "Failed to update preferences.",
        });
        return;
      }
      setInitialTimezone(timezone);
      setHasOrgChanges(false);
      setOrgMessage({ type: "success", text: "Preferences saved successfully" });
      setTimeout(() => setOrgMessage({ type: "", text: "" }), 3000);
      refetch();
    } catch (err) {
      setOrgMessage({ type: "error", text: `Failed to update preferences: ${err?.message || "Please try again."}` });
    } finally {
      setIsSavingOrg(false);
    }
  };

  const nameEdited = formValues.name.trim() !== initialValues.name.trim();
  const emailEdited = formValues.email.trim() !== initialValues.email.trim();

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

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Profile</h2>
        <label style={styles.label}>
          Name
          {nameEdited && <span style={styles.editedIndicator}> *</span>}
        </label>
        <input
          type="text"
          value={formValues.name}
          onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
          style={{
            ...styles.input,
            ...(nameEdited ? styles.inputEdited : {}),
          }}
          placeholder="Your name"
        />
        <label style={styles.label}>
          Email
          {emailEdited && <span style={styles.editedIndicator}> *</span>}
        </label>
        <input
          type="email"
          value={formValues.email}
          onChange={(e) => {
            setFormValues((prev) => ({ ...prev, email: e.target.value }));
            if (emailError) setEmailError(validateEmail(e.target.value));
          }}
          onBlur={() => setEmailError(validateEmail(formValues.email))}
          style={{
            ...styles.input,
            ...(emailError ? { borderColor: "#ef4444" } : emailEdited ? styles.inputEdited : {}),
          }}
          placeholder="you@example.com"
        />
        {emailError && (
          <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
            {emailError}
          </div>
        )}

        {saveMessage.text && (
          <div
            style={{
              ...styles.message,
              ...(saveMessage.type === "success" ? styles.messageSuccess : styles.messageError),
              marginBottom: "1rem",
            }}
          >
            {saveMessage.text}
          </div>
        )}

        <div style={{ ...styles.row, gap: "12px", marginBottom: "1.5rem" }}>
          <button
            type="button"
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
              ...(!hasChanges || isSaving || emailError ? styles.btnDisabled : {}),
              padding: "10px 1.5rem",
            }}
            disabled={!hasChanges || isSaving || !!emailError}
            onClick={handleSaveProfile}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          {hasChanges && (
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
        </div>

        <hr style={styles.divider} />

        <div style={{ ...styles.row, gap: "1rem", marginTop: "1.5rem" }}>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnDangerOutlined }}
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

        {orgMessage.text && (
          <div
            style={{
              ...styles.message,
              ...(orgMessage.type === "success" ? styles.messageSuccess : styles.messageError),
              marginBottom: "1rem",
            }}
          >
            {orgMessage.text}
          </div>
        )}

        <button
          type="button"
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            ...(!hasOrgChanges || isSavingOrg ? styles.btnDisabled : {}),
            padding: "10px 1.5rem",
          }}
          disabled={!hasOrgChanges || isSavingOrg}
          onClick={handleSavePreferences}
        >
          {isSavingOrg ? "Saving..." : "Save Preferences"}
        </button>
      </section>

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
