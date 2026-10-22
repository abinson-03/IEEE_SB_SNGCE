import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const VerifyCertificatePage = () => {
  const [searchParams] = useSearchParams();
  const [certId, setCertId]   = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const performVerification = useCallback(async (idToVerify) => {
    const cleanId = (idToVerify || certId).trim();
    if (!cleanId) {
      setError("Please enter a Certificate ID to verify.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axiosInstance.get(`/certificates/verify/${encodeURIComponent(cleanId)}`);
      if (res.data.valid) {
        setResult(res.data.data);
      } else {
        setError(res.data.message || "Certificate invalid or not found.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Certificate not found. The ID provided does not match any authentic IEEE certificate."
      );
    } finally {
      setLoading(false);
    }
  }, [certId]);

  useEffect(() => {
    const urlId = searchParams.get("id");
    if (urlId) {
      performVerification(urlId);
    }
  }, [searchParams, performVerification]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performVerification(certId);
  };

  return (
    <div style={{ minHeight: "80vh", background: "#f8fafc", padding: "var(--sp-2xl) 0" }}>
      <div className="container" style={{ maxWidth: 760 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--sp-2xl)" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: 8 }}>🛡️</div>
          <span className="badge badge-primary" style={{ marginBottom: 8 }}>
            Digital Authenticity Registry
          </span>
          <h1 style={{ fontSize: "2rem", color: "var(--navy)", margin: "0 0 8px" }}>
            Verify IEEE Certificate
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: 540, margin: "0 auto" }}>
            Enter the unique Certificate ID issued by IEEE Student Branch SNGCE to verify its validity and credentials.
          </p>
        </div>

        {/* Input Card */}
        <div className="card" style={{ padding: "var(--sp-xl)", marginBottom: "var(--sp-xl)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="e.g. IEEE-CIS-2026-X9A2B or Certificate ID"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              style={{
                flex: "1 1 280px",
                padding: "12px 16px",
                fontSize: "1rem",
                borderRadius: "var(--radius-sm)",
                border: "2px solid var(--border)",
                outline: "none",
                fontFamily: "monospace",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: "12px 24px", fontSize: "0.95rem", fontWeight: 700 }}
            >
              {loading ? "Verifying..." : "Verify Authenticity"}
            </button>
          </form>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="card" style={{ padding: "var(--sp-xl)", textAlign: "center" }}>
            <div className="skeleton" style={{ height: 24, width: "60%", margin: "0 auto 12px" }} />
            <div className="skeleton" style={{ height: 16, width: "40%", margin: "0 auto" }} />
          </div>
        )}

        {/* Error / Invalid State */}
        {error && !loading && (
          <div
            className="card"
            style={{
              padding: "var(--sp-xl)",
              borderLeft: "6px solid #dc2626",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: "2rem", lineHeight: 1 }}>⚠️</div>
              <div>
                <h3 style={{ margin: "0 0 6px", color: "#dc2626", fontSize: "1.15rem" }}>
                  Invalid or Unverified Certificate
                </h3>
                <p style={{ margin: 0, color: "var(--text)", fontSize: "0.92rem", lineHeight: 1.5 }}>
                  {error}
                </p>
                <div style={{ marginTop: 12, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Please ensure you typed the ID exactly as it appears on the certificate, including hyphens and uppercase letters.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Valid Certificate Details */}
        {result && !loading && (
          <div
            className="card"
            style={{
              border: "2px solid #10b981",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.15)",
            }}
          >
            {/* Valid Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#ffffff",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div style={{ fontSize: "2.4rem", lineHeight: 1 }}>✓</div>
              <div>
                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, opacity: 0.9 }}>
                  Official IEEE SB SNGCE Credential
                </div>
                <h2 style={{ margin: "2px 0 0", fontSize: "1.3rem", color: "#fff" }}>
                  Valid & Verified Certificate
                </h2>
              </div>
            </div>

            {/* Certificate Details */}
            <div style={{ padding: "var(--sp-xl)" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "var(--sp-lg)",
                  marginBottom: "var(--sp-lg)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Recipient Name
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#00629B", marginTop: 4 }}>
                    {result.recipientName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Certificate ID
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "monospace", color: "var(--navy)", marginTop: 4 }}>
                    {result.certificateId}
                  </div>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--sp-md)" }}>
                <tbody>
                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, width: 160 }}>
                      Event Title
                    </td>
                    <td style={{ padding: "12px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>
                      {result.eventTitle}
                    </td>
                  </tr>

                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      Organized By
                    </td>
                    <td style={{ padding: "12px 0", fontSize: "0.92rem", fontWeight: 600, color: "var(--text)" }}>
                      {result.chapterName}
                    </td>
                  </tr>

                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      Event Date
                    </td>
                    <td style={{ padding: "12px 0", fontSize: "0.92rem", color: "var(--text)" }}>
                      {result.eventDate ? new Date(result.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                    </td>
                  </tr>

                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      Issued Date
                    </td>
                    <td style={{ padding: "12px 0", fontSize: "0.92rem", color: "var(--text)" }}>
                      {result.issueDate ? new Date(result.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  marginTop: "var(--sp-lg)",
                  padding: "12px 16px",
                  background: "#f0fdf4",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid #bbf7d0",
                  fontSize: "0.82rem",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span>
                  🔒 Digitally verified against IEEE Student Branch SNGCE records.
                </span>
                <Link to="/events" style={{ color: "#00629B", fontWeight: 700 }}>
                  View All Events →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
