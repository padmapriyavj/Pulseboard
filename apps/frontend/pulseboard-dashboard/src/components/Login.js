import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    org_id: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("org_id", formData.org_id);
      onLogin(formData.org_id);
      navigate("/dashboard");
    } else {
      alert(data.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="org_id"
        placeholder="Organization ID"
        onChange={handleChange}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
