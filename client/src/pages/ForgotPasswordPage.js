import React, { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const styles = {
  page:    { maxWidth: 420, margin: "60px auto", padding: "2rem", fontFamily: "inherit" },
  form:    { display: "flex", flexDirection: "column", gap: 14 },
  input:   { padding: 10, fontSize: 14, border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-sm)", fontFamily: "inherit" },
  error:   { color: "#dc3545", fontSize: "0.88rem", marginTop: 8, padding: "8px 12px", background: "#fef2f2", borderRadius: "var(--radius-sm)" },
  success: { color: "#16a34a", fontSize: "0.88rem", marginTop: 8, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", lineHeight: 1.5 },
};

const ForgotPasswordPage = () => {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState("");
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email: email.trim() });
      setMessage(res.data.message || "If an account exists with this email, a password reset link has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: "0.5rem", color: "var(--navy)" }}>Reset Password</h2>
      <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Enter your IEEE SB Portal email address, and we will send you a secure link to reset your password.
      </p>

      {message ? (
        <div>
          <div style={styles.success}>
            <strong>Check your inbox:</strong>
            <p style={{ margin: "6px 0 0" }}>{message}</p>
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
            <Link to="/login" style={{ color: "#00629B", fontWeight: 600 }}>← Return to Sign In</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
            autoFocus
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Sending Link..." : "Send Reset Link"}
          </button>
        </form>
      )}

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {!message && (
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
          Remember your password? <Link to="/login" style={{ color: "#00629B", fontWeight: 600 }}>Sign In</Link>
        </p>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
