import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axiosInstance";

/**
 * MemberCerts — Sprint 5
 * Shows all participation certificates issued to the logged-in member.
 * Each certificate has a Download button that fetches the PDF from the server.
 */
const MemberCerts = () => {
  const [certs, setCerts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  // Track per-cert download state
  const [dlState, setDlState] = useState({});

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/certificates/my");
      setCerts(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  const handleDownload = async (cert) => {
    setDlState((s) => ({ ...s, [cert._id]: "loading" }));
    try {
      // Fetch binary PDF from server
      const response = await api.get(`/certificates/${cert._id}/download`, {
        responseType: "blob",
      });

      // Create an object URL and trigger browser download
      const blob    = new Blob([response.data], { type: "application/pdf" });
      const url     = URL.createObjectURL(blob);
      const link    = document.createElement("a");
      const safeTitle = cert.eventTitle.replace(/[^a-zA-Z0-9]/g, "_");
      link.href     = url;
      link.download = `IEEE_Certificate_${safeTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDlState((s) => ({ ...s, [cert._id]: "done" }));
      // Reset button label after 3 s
      setTimeout(() => setDlState((s) => ({ ...s, [cert._id]: "idle" })), 3000);
    } catch (err) {
      setDlState((s) => ({ ...s, [cert._id]: "error" }));
      setTimeout(() => setDlState((s) => ({ ...s, [cert._id]: "idle" })), 4000);
      console.error("Download error:", err);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <div className="dash-page-header">
        <div>
          <h1>My Certificates</h1>
          <p>
            Download your participation certificates for IEEE events you attended.
          </p>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="empty-state" style={{ minHeight: "30vh" }}>
          <div className="spinner" />
          <p>Loading your certificates…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--sp-lg)" }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && certs.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: "3rem", marginBottom: "var(--sp-md)" }}>🏆</div>
          <h3>No Certificates Yet</h3>
          <p>
            Certificates will appear here after you check in to an IEEE event and
            an officer generates them. Keep attending events!
          </p>
        </div>
      )}

      {/* ── Certificate cards ── */}
      {!loading && !error && certs.length > 0 && (
        <>
          <p style={{ color: "#555", marginBottom: "var(--sp-lg)", fontSize: "0.95rem" }}>
            You have <strong>{certs.length}</strong> certificate{certs.length !== 1 ? "s" : ""}.
          </p>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap:                 "var(--sp-md)",
            }}
          >
            {certs.map((cert) => {
              const state = dlState[cert._id] || "idle";
              return (
                <div
                  key={cert._id}
                  className="card"
                  style={{
                    padding:  "var(--sp-lg)",
                    display:  "flex",
                    flexDirection: "column",
                    gap:      "var(--sp-sm)",
                    borderTop: "4px solid #00629B",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Decorative corner accent */}
                  <div
                    style={{
                      position:   "absolute",
                      top:        0,
                      right:      0,
                      width:      60,
                      height:     60,
                      background: "linear-gradient(135deg, transparent 50%, #00629B18 50%)",
                    }}
                  />

                  {/* Certificate icon */}
                  <div style={{ fontSize: "2rem", marginBottom: 2 }}>📜</div>

                  {/* Event name */}
                  <h3
                    style={{
                      margin:   0,
                      fontSize: "1rem",
                      color:    "#1a2744",
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    {cert.eventTitle}
                  </h3>

                  {/* Chapter */}
                  {cert.chapterName && (
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#00629B", fontWeight: 600 }}>
                      {cert.chapterName}
                    </p>
                  )}

                  {/* Date */}
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                    📅 {formatDate(cert.eventDate)}
                  </p>

                  {/* Issued on */}
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#999" }}>
                    Issued {formatDate(cert.generatedAt)}
                  </p>

                  {/* Email badge */}
                  {cert.emailSent && (
                    <span
                      style={{
                        display:    "inline-block",
                        fontSize:   "0.75rem",
                        background: "#dcfce7",
                        color:      "#166534",
                        padding:    "2px 8px",
                        borderRadius: 999,
                        fontWeight: 600,
                        alignSelf: "flex-start",
                      }}
                    >
                      ✉️ Emailed
                    </span>
                  )}

                  {/* Download button */}
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "auto", width: "100%" }}
                    disabled={state === "loading"}
                    onClick={() => handleDownload(cert)}
                  >
                    {state === "loading" ? (
                      <>
                        <span className="spinner-sm" /> Downloading…
                      </>
                    ) : state === "done" ? (
                      "✅ Downloaded!"
                    ) : state === "error" ? (
                      "❌ Failed — Retry"
                    ) : (
                      "⬇️ Download PDF"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Info box ── */}
      <div
        className="card"
        style={{
          marginTop: "var(--sp-xl)",
          padding: "var(--sp-lg)",
          background: "#f0f7ff",
          border: "1px solid #c3ddf8",
        }}
      >
        <h4 style={{ margin: "0 0 6px", color: "#00629B" }}>ℹ️ About Certificates</h4>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "#444", lineHeight: 1.6 }}>
          IEEE SB SNGCE e-certificates are officially branded PDF documents. They are
          generated by chapter officers after an event and emailed to you automatically.
          Your certificate confirms participation and can be used for IEEE membership
          records or college portfolios.
        </p>
      </div>
    </div>
  );
};

export default MemberCerts;
