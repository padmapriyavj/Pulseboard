import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {useAuth} from "../hooks/useAuth"

function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    org_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLinkHover, setForgotLinkHover] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok) {
        console.log("Login response:", data);
        const userName = data.userName || data.name || formData.email.split('@')[0] || "User";
        console.log("Setting userName:", userName);
        login(data.token, formData.org_id, userName, true);
        navigate("/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandingContent}>
          <div style={styles.logoIcon}>PB</div>
          <h1 style={styles.brandTitle}>PulseBoard</h1>
          <p style={styles.brandTagline}>Real-time IoT Sensor Monitoring</p>
          
          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <span style={styles.featureIcon}>A</span>
              </div>
              <div>
                <h3 style={styles.featureTitle}>AI-Powered Insights</h3>
                <p style={styles.featureDesc}>Get intelligent analysis of your sensor data patterns</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <span style={styles.featureIcon}>!</span>
              </div>
              <div>
                <h3 style={styles.featureTitle}>Real-time Monitoring</h3>
                <p style={styles.featureDesc}>Track temperature, humidity, and custom sensors live</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <span style={styles.featureIcon}>H</span>
              </div>
              <div>
                <h3 style={styles.featureTitle}>Smart Alerts</h3>
                <p style={styles.featureDesc}>Automatic threshold detection and notifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSubtitle}>Sign in to access your dashboard</p>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.labelInline}>Password</label>
                <a
                  href="#forgot"
                  style={forgotLinkHover ? styles.forgotLinkHover : styles.forgotLink}
                  onMouseEnter={() => setForgotLinkHover(true)}
                  onMouseLeave={() => setForgotLinkHover(false)}
                >
                  Forgot password?
                </a>
              </div>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ ...styles.input, paddingRight: "56px", boxSizing: "border-box" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePassword}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Organisation Name</label>
              <input
                type="text"
                name="org_id"
                placeholder="e.g. acme"
                value={formData.org_id}
                onChange={handleChange}
                style={styles.input}
                required
              />
              <p style={styles.helperText}>Your unique workspace identifier</p>
            </div>

            <button
              type="submit"
              style={
                loading
                  ? { ...styles.submitButton, ...styles.submitButtonDisabled }
                  : submitHover
                    ? { ...styles.submitButton, ...styles.submitButtonHover }
                    : styles.submitButton
              }
              disabled={loading}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account?{" "}
              <Link to="/register" style={styles.link}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)",
    padding: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "2px solid #B3B347",
  },
  brandingContent: {
    maxWidth: "500px",
  },
  logoIcon: {
    width: "100px",
    height: "100px",
    background: "linear-gradient(135deg, #FFFF66 0%, #FFE566 100%)",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "60px",
    marginBottom: "32px",
    boxShadow: "0 12px 32px rgba(255, 255, 102, 0.3)",
  },
  brandTitle: {
    fontSize: "48px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #FFFF66 0%, #FFE566 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "16px",
  },
  brandTagline: {
    fontSize: "18px",
    color: "#94a3b8",
    marginBottom: "48px",
    lineHeight: "1.6",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    padding: "20px",
    background: "#2a2a2a",
    borderRadius: "12px",
    border: "1px solid #B3B347",
  },
  featureIconWrapper: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#B3B347",
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  featureIcon: {
    fontSize: "20px",
    color: "#1a1a1a",
  },
  featureTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: "4px",
  },
  featureDesc: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.5",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
    backgroundColor: "#1a1a1a",
  },
  formContainer: {
    width: "100%",
    maxWidth: "480px",
  },
  formHeader: {
    marginBottom: "40px",
  },
  formTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: "8px",
  },
  formSubtitle: {
    fontSize: "16px",
    color: "#94a3b8",
  },
  errorMessage: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#fca5a5",
    padding: "14px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  formGroup: {
    marginBottom: "20px",
    width: "100%",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: "8px",
    width: "100%",
  },
  labelInline: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#e2e8f0",
    margin: 0,
    flex: "0 0 auto",
  },
  labelRow: {
    display: "flex",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    width: "100%",
  },
  helperText: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    fontSize: "15px",
    color: "#e2e8f0",
    backgroundColor: "#2a2a2a",
    border: "2px solid #B3B347",
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.3s",
    fontFamily: "inherit",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  togglePassword: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "12px",
    padding: "4px",
  },
  forgotLink: {
    fontSize: "14px",
    color: "#facc15",
    textDecoration: "none",
    fontWeight: "500",
  },
  forgotLinkHover: {
    fontSize: "14px",
    color: "#fde047",
    textDecoration: "none",
    fontWeight: "500",
  },
  submitButton: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    backgroundColor: "#facc15",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginBottom: "24px",
  },
  submitButtonDisabled: {
    opacity: 0.8,
    cursor: "not-allowed",
  },
  submitButtonHover: {
    backgroundColor: "#eab308",
  },
  footer: {
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #B3B347",
    textAlign: "center",
  },
  footerText: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  link: {
    color: "#FFFF66",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Login;