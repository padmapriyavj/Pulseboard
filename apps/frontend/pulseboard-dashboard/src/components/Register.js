import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    org_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Registered successfully");
        navigate("/");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed");
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
                <h3 style={styles.featureTitle}>Real-time Analytics</h3>
                <p style={styles.featureDesc}>Monitor your sensors in real-time</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <span style={styles.featureIcon}>!</span>
              </div>
              <div>
                <h3 style={styles.featureTitle}>Smart Alerts</h3>
                <p style={styles.featureDesc}>Get notified of anomalies instantly</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIconWrapper}>
                <span style={styles.featureIcon}>H</span>
              </div>
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
            <h2 style={styles.formTitle}>Create Account</h2>
            <p style={styles.formSubtitle}>Start monitoring your sensors today</p>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
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
              <label style={styles.label}>Organization ID</label>
              <input
                type="text"
                name="org_id"
                placeholder="Your organization ID"
                value={formData.org_id}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Already have an account?{" "}
              <Link to="/" style={styles.link}>
                Sign in
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
    marginTop: "8px",
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

export default Register;