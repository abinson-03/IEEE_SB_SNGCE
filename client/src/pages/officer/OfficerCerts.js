import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axiosInstance";
import CertificateTemplateModal from "../../components/CertificateTemplateModal";

/**
 * OfficerCerts — Sprint 5
 * Lists past events eligible for certificate generation.
 * Officer clicks "Generate Certificates" to trigger bulk PDF creation + email.
 */
const OfficerCerts = () => {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  // Track per-event generation state: { [eventId]: "idle"|"loading"|"done"|"error" }
  const [genState, setGenState]   = useState({});
  // Track per-event result message
  const [genResult, setGenResult] = useState({});
  // Template modal event
  const [templateModalEvent, setTemplateModalEvent] = useState(null);

  const fetchEligible = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/certificates/eligible");
      setEvents(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load eligible events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEligible(); }, [fetchEligible]);

  const handleGenerate = async (eventId) => {
    setGenState((s) => ({ ...s, [eventId]: "loading" }));
    setGenResult((s) => ({ ...s, [eventId]: "" }));
    try {
      const { data } = await api.post(`/certificates/${eventId}/generate`);
      setGenState((s)  => ({ ...s, [eventId]: "done" }));
      setGenResult((s) => ({ ...s, [eventId]: data.message }));
      // Refresh the list to update cert counts
      fetchEligible();
    } catch (err) {
      setGenState((s)  => ({ ...s, [eventId]: "error" }));
      setGenResult((s) => ({
        ...s,
        [eventId]: err.response?.data?.message || "Generation failed. Please try again.",
      }));
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <div className="dash-page-header">
        <div>
          <h1>Certificate Queue</h1>
          <p>
            Generate participation certificates for completed events. PDFs are
            auto-emailed to attendees and made available for download.
          </p>
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="empty-state" style={{ minHeight: "30vh" }}>
          <div className="spinner" />
          <p>Loading eligible events…</p>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--sp-lg)" }}>
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: "2.5rem", marginBottom: "var(--sp-md)" }}>🏆</div>
          <h3>No Eligible Events</h3>
          <p>
            Events will appear here once they are published and their date has
            passed. Make sure at least one attendee has checked in.
          </p>
        </div>
      )}

      {/* ── Event cards ── */}
      {!loading && !error && events.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
          {events.map((ev) => {
            const state   = genState[ev._id]  || "idle";
            const result  = genResult[ev._id] || "";
            const alreadyDone = ev.certCount > 0 && state === "idle";

            return (
              <div key={ev._id} className="card" style={{ padding: "var(--sp-lg)" }}>
                <div
                  style={{
                    display:        "flex",
                    justifyContent: "space-between",
                    alignItems:     "flex-start",
                    flexWrap:       "wrap",
                    gap:            "var(--sp-md)",
                  }}
                >
                  {/* ── Info ── */}
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", color: "#1a2744" }}>
                      {ev.title}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.88rem", color: "#555" }}>
                      <span>📅 {formatDate(ev.date)}</span>
                      {ev.unit?.name && <span>🏢 {ev.unit.name}</span>}
                      <span
                        style={{
                          background: ev.status === "archived" ? "#fef3c7" : "#dcfce7",
                          color:      ev.status === "archived" ? "#92400e" : "#166534",
                          padding:    "2px 8px",
                          borderRadius: 999,
                          fontSize:   "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {ev.status}
                      </span>
                    </div>

                    {/* ── Attendance / cert stats & template pill ── */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <StatPill
                        icon="👤"
                        label="Checked in"
                        value={ev.attendanceCount}
                        color="#00629B"
                      />
                      <StatPill
                        icon="📄"
                        label="Certs issued"
                        value={ev.certCount}
                        color="#7c3aed"
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          fontSize: "0.78rem",
                          padding: "4px 10px",
                          borderRadius: 999,
                          borderColor: ev.certificateTemplatePath ? "#c4b5fd" : "#cbd5e1",
                          color: ev.certificateTemplatePath ? "#6d28d9" : "#475569",
                          background: ev.certificateTemplatePath ? "#ede9fe" : "#f8fafc",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={() => setTemplateModalEvent(ev)}
                        title="Upload or manage custom certificate background template for this event"
                      >
                        {ev.certificateTemplatePath ? "🎨 Custom Template: Active" : "🖼️ Upload Certificate Template"}
                      </button>
                    </div>
                  </div>

                  {/* ── Action ── */}
                  <div
                    style={{
                      display:       "flex",
                      flexDirection: "column",
                      alignItems:    "flex-end",
                      gap:           "8px",
                      minWidth:      160,
                    }}
                  >
                    {ev.attendanceCount === 0 ? (
                      <span style={{ fontSize: "0.85rem", color: "#888" }}>
                        No check-ins yet
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ minWidth: 168 }}
                        disabled={state === "loading"}
                        onClick={() => handleGenerate(ev._id)}
                      >
                        {state === "loading" ? (
                          <>
                            <span className="spinner-sm" /> Generating…
                          </>
                        ) : alreadyDone ? (
                          "🔄 Re-generate"
                        ) : (
                          "🏆 Generate Certificates"
                        )}
                      </button>
                    )}

                    {/* Result feedback */}
                    {result && (
                      <p
                        style={{
                          fontSize:   "0.8rem",
                          color:      state === "error" ? "#dc2626" : "#166534",
                          margin:     0,
                          textAlign:  "right",
                          maxWidth:   240,
                        }}
                      >
                        {state === "error" ? "❌ " : "✅ "}
                        {result}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
        <h4 style={{ margin: "0 0 8px", color: "#00629B" }}>ℹ️ How it works</h4>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", color: "#334", lineHeight: 1.7 }}>
          <li>Only attendees who <strong>checked in via QR</strong> receive a certificate.</li>
          <li>Clicking <em>Generate Certificates</em> creates a branded IEEE PDF for each attendee.</li>
          <li>Each attendee is automatically emailed their certificate as an attachment.</li>
          <li>Members can download their certificates from their <em>My Certificates</em> page.</li>
          <li>Re-generating skips attendees who already have a certificate (idempotent).</li>
        </ul>
      </div>

      {/* ── Custom Certificate Template Modal ── */}
      <CertificateTemplateModal
        event={templateModalEvent}
        isOpen={Boolean(templateModalEvent)}
        onClose={() => setTemplateModalEvent(null)}
        onSuccess={(eventId, newPath) => {
          setEvents((prev) =>
            prev.map((e) => (e._id === eventId ? { ...e, certificateTemplatePath: newPath } : e))
          );
        }}
      />
    </div>
  );
};

// ── Small stat pill component ─────────────────────────────────────────────────
const StatPill = ({ icon, label, value, color }) => (
  <div
    style={{
      display:      "flex",
      alignItems:   "center",
      gap:          6,
      background:   "#f8fafc",
      border:       `1px solid ${color}33`,
      borderRadius: 8,
      padding:      "4px 12px",
      fontSize:     "0.85rem",
    }}
  >
    <span>{icon}</span>
    <span style={{ color, fontWeight: 700, fontSize: "1rem" }}>{value}</span>
    <span style={{ color: "#666" }}>{label}</span>
  </div>
);

export default OfficerCerts;
