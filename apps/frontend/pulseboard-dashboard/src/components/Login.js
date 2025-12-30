import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {useAuth} from "../hooks/useAuth"

function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    org_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        // Store token and organization info
        localStorage.setItem("token", data.token);
        localStorage.setItem("org_id", data.organization.id);
        localStorage.setItem("org_name", data.organization.name);
        localStorage.setItem("userName", data.user.name);

        login(data.token, data.organization.id, data.user.name);
        navigate("/dashboard");
      } else {
        setError(data.error || "Login failed");
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
          <div style={styles.logoIcon}>⚡</div>
          <h1 style={styles.brandTitle}>PulseBoard</h1>
          <p style={styles.brandTagline}>Real-time IoT Sensor Monitoring</p>
          
          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>📊</span>
              <div>
                <h3 style={styles.featureTitle}>Real-time Analytics</h3>
                <p style={styles.featureDesc}>Monitor your sensors in real-time</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>⚠️</span>
              <div>
                <h3 style={styles.featureTitle}>Smart Alerts</h3>
                <p style={styles.featureDesc}>Get notified of anomalies instantly</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>📈</span>
              <div>
                <h3 style={styles.featureTitle}>Historical Data</h3>
                <p style={styles.featureDesc}>Analyze trends and patterns</p>
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
              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePassword}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Organization Name</label>
              <input
                type="text"
                name="org_name"
                placeholder="Your organization name"
                value={formData.org_name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.rememberForgot}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" style={styles.checkbox} />
                <span style={styles.checkboxText}>Remember me</span>
              </label>
              <a href="#forgot" style={styles.forgotLink}>
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine}></div>
          </div>

          <div style={styles.socialButtons}>
            <button style={styles.socialButton}>
              <span style={styles.socialIcon}>🔷</span>
              <span>Continue with Google</span>
            </button>
            <button style={styles.socialButton}>
              <span style={styles.socialIcon}>📘</span>
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account?{" "}
              <Link to="/register" style={styles.link}>
                Sign up for free
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
  featureIcon: {
    fontSize: "32px",
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
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
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
  },
  togglePassword: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "20px",
    padding: "4px",
  },
  rememberForgot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#FFFF66",
  },
  checkboxText: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  forgotLink: {
    fontSize: "14px",
    color: "#FFFF66",
    textDecoration: "none",
    fontWeight: "600",
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a1a1a",
    background: "linear-gradient(135deg, #FFFF66 0%, #FFE566 100%)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(255, 255, 102, 0.3)",
    marginBottom: "24px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "32px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#B3B347",
  },
  dividerText: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  socialButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "32px",
  },
  socialButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#e2e8f0",
    backgroundColor: "#2a2a2a",
    border: "2px solid #B3B347",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  socialIcon: {
    fontSize: "20px",
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