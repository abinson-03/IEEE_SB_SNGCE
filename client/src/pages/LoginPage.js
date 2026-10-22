import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const styles = {
  page:    { maxWidth: 420, margin: "60px auto", padding: "2rem", fontFamily: "inherit" },
  form:    { display: "flex", flexDirection: "column", gap: 12 },
  input:   { padding: 10, fontSize: 14, border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-sm)", fontFamily: "inherit" },
  error:   { color: "#dc3545", fontSize: "0.88rem" },
  success: { color: "#16a34a", fontSize: "0.88rem" },
};

const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch { /* error shown via context */ }
  };

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: "1.5rem", color: "var(--navy)" }}>Sign In</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: 8 }}>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
        <Link to="/forgot-password" style={{ fontSize: "0.88rem", color: "#00629B", textDecoration: "underline", fontWeight: 600 }}>
          Forgot Password?
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
