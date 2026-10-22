import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

const styles = {
  page:  { maxWidth: 420, margin: "60px auto", padding: "2rem", fontFamily: "inherit" },
  form:  { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: 10, fontSize: 14, border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-sm)", fontFamily: "inherit", background: "var(--bg)", color: "var(--text)" },
  error: { color: "#dc3545", fontSize: "0.88rem" },
};

const RegisterPage = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [chapter, setChapter]   = useState("");
  const [units, setUnits]       = useState([]);

  useEffect(() => {
    axiosInstance.get("/units")
      .then((r) => setUnits(r.data.data || []))
      .catch(() => {});
  }, []);

  const chaptersOnly = units.filter((u) => u.type === "chapter" || u.name !== "SB");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chapter) return;
    try {
      await register(name, email, password, "member", [chapter]);
      navigate("/dashboard");
    } catch { /* error shown via context */ }
  };

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: "1.5rem", color: "var(--navy)" }}>Create Account</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
        <input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
        <select value={chapter} onChange={(e) => setChapter(e.target.value)} style={styles.input} required>
          <option value="">Select Chapter (Required) *</option>
          {chaptersOnly.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} — {u.name === "CS" ? "Computer Society" : u.name === "CIS" ? "Computational Intelligence Society" : u.name === "SPS" ? "Signal Processing Society" : u.name === "WIE" ? "Women in Engineering" : u.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
