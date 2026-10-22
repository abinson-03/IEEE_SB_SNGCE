import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const styles = {
  page:    { maxWidth: 420, margin: "60px auto", padding: "2rem", fontFamily: "inherit" },
  form:    { display: "flex", flexDirection: "column", gap: 14 },
  input:   { padding: 10, fontSize: 14, border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-sm)", fontFamily: "inherit" },
  error:   { color: "#dc3545", fontSize: "0.88rem", marginTop: 8, padding: "8px 12px", background: "#fef2f2", borderRadius: "var(--radius-sm)" },
  success: { color: "#16a34a", fontSize: "0.88rem", marginTop: 8, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", lineHeight: 1.5 },
};

const ResetPasswordPage = () => {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get("token") || "";
  const navigate                = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing from the link. Please request a new password reset.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axiosInstance.post("/auth/reset-password", {
        token,
        password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired reset token. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <h2 style={{ marginBottom: "1rem", color: "var(--navy)" }}>Invalid Reset Link</h2>
        <div style={styles.error}>
          ⚠️ No reset token was provided. The password reset link may be incomplete or broken.
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <Link to="/forgot-password" style={{ color: "#00629B", fontWeight: 600 }}>Request a new reset link</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: "0.5rem", color: "var(--navy)" }}>Create New Password</h2>
      <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Enter and confirm your new password below.
      </p>

      {success ? (
        <div>
          <div style={styles.success}>
            <strong>Password Reset Successful!</strong>
            <p style={{ margin: "6px 0 0" }}>
              Your password has been updated. Redirecting to Sign In in a moment...
            </p>
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
            <Link to="/login" style={{ color: "#00629B", fontWeight: 600 }}>Click here to Sign In now →</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, width: "100%" }}
              required
              minLength={8}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ ...styles.input, width: "100%" }}
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 6 }}>
            {loading ? "Updating Password..." : "Set New Password"}
          </button>
        </form>
      )}

      {error && (
        <div style={styles.error}>
          <div>⚠️ {error}</div>
          {error.toLowerCase().includes("expired") || error.toLowerCase().includes("invalid") ? (
            <div style={{ marginTop: 8 }}>
              <Link to="/forgot-password" style={{ color: "#00629B", fontWeight: 600, textDecoration: "underline" }}>
                Request a fresh reset link
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {!success && (
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
          Remember your password? <Link to="/login" style={{ color: "#00629B", fontWeight: 600 }}>Sign In</Link>
        </p>
      )}
    </div>
  );
};

export default ResetPasswordPage;
