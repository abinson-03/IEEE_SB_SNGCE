import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "./CheckInPage.css";

const CheckInPage = () => {
  const { eventId }   = useParams();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get("token");

  const [event, setEvent]   = useState(null);
  const [eventErr, setEventErr] = useState("");
  const [loadingEvent, setLoadingEvent] = useState(true);

  // Pass Code input
  const [passCode, setPassCode] = useState("");
  const [suggestedCode, setSuggestedCode] = useState("");

  // Check-in state
  const [status, setStatus]     = useState("idle"); // idle | loading | success | error | already
  const [message, setMessage]   = useState("");
  const [attendee, setAttendee] = useState(null);

  useEffect(() => {
    axiosInstance.get(`/events/${eventId}`)
      .then((r) => setEvent(r.data.data))
      .catch((e) => setEventErr(e.response?.data?.message || "Event not found."))
      .finally(() => setLoadingEvent(false));

    // Auto-detect pass code from localStorage or user session
    try {
      const saved = localStorage.getItem(`event_pass_${eventId}`);
      if (saved) {
        const p = JSON.parse(saved);
        const code = p.ticketCode || (p._id ? `TKT-${p._id.toString().slice(-4).toUpperCase()}` : "");
        if (code) {
          setSuggestedCode(code);
          setPassCode(code);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!token) { setStatus("error"); setMessage("Invalid or missing venue check-in token. Please scan the official Venue QR code."); return; }
    if (!passCode.trim()) { setStatus("error"); setMessage("Please enter your Pass Code or registered email."); return; }
    
    setStatus("loading");
    try {
      const payload = { code: passCode.trim() };
      const r = await axiosInstance.post(`/events/${eventId}/checkin?token=${token}`, payload);
      setStatus("success");
      setMessage(r.data.message);
      setAttendee(r.data.attendee);
    } catch (err) {
      const msg = err.response?.data?.message || "Check-in failed.";
      if (err.response?.status === 409) { setStatus("already"); setMessage(msg); }
      else { setStatus("error"); setMessage(msg); }
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "";

  return (
    <div className="checkin-shell">
      <div className="checkin-card">
        {/* Header */}
        <div className="checkin-header">
          <span className="checkin-brand">IEEE SB SNGCE</span>
          <span className="checkin-tag">Event Check-In</span>
        </div>

        {/* Event info */}
        {loadingEvent ? (
          <div className="skeleton" style={{ height: 80, margin: "var(--sp-lg)" }} />
        ) : eventErr ? (
          <div className="checkin-state checkin-state--error">
            <span>⚠️</span>
            <p>{eventErr}</p>
          </div>
        ) : (
          <div className="checkin-event-info">
            <h1 className="checkin-event-title">{event.title}</h1>
            <p className="checkin-event-meta">📅 {fmtDate(event.date)}</p>
            {event.venue && <p className="checkin-event-meta">📍 {event.venue}</p>}
            <p className="checkin-event-meta">
              <span className="checkin-unit-badge">{event.unit?.name}</span>
            </p>
          </div>
        )}

        {/* Check-in action area */}
        <div className="checkin-body">
          {status === "success" && (
            <div className="checkin-state checkin-state--success">
              <div className="checkin-checkmark">✓</div>
              <h2>Attendance Confirmed!</h2>
              {attendee && (
                <div style={{ margin: "var(--sp-sm) 0", background: "#ffffff", padding: "10px 16px", borderRadius: 8, border: "1px solid #bbf7d0", display: "inline-block" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#065f46" }}>{attendee.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>{attendee.college || "Registered Participant"}</div>
                  <div style={{ fontSize: "0.82rem", fontFamily: "monospace", fontWeight: "bold", color: "#00629B", marginTop: 4 }}>
                    PASS: {attendee.ticketCode}
                  </div>
                </div>
              )}
              <p style={{ marginTop: "var(--sp-xs)", fontSize: "0.85rem" }}>{message}</p>
            </div>
          )}

          {status === "already" && (
            <div className="checkin-state checkin-state--already">
              <span style={{ fontSize: "2.5rem" }}>✅</span>
              <h2>Already Checked In</h2>
              <p>{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="checkin-state checkin-state--error">
              <span style={{ fontSize: "2rem" }}>❌</span>
              <p>{message}</p>
              <button className="btn btn-outline" style={{ marginTop: "var(--sp-md)" }} onClick={() => setStatus("idle")}>
                Try Again
              </button>
            </div>
          )}

          {(status === "idle" || status === "loading") && !eventErr && !loadingEvent && (
            <form onSubmit={handleCheckIn} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
              <div style={{ background: "#f8fafc", padding: "var(--sp-sm) var(--sp-md)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  📍 Scan verified at Venue. Enter your <strong>Pass Code</strong> below to mark your attendance:
                </span>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 6 }}>
                  Pass / Ticket Code <span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  required
                  value={passCode}
                  onChange={(e) => setPassCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CIS-8523 or registered email"
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textAlign: "center",
                    textTransform: "uppercase",
                    padding: "0.75rem",
                    borderColor: passCode ? "#00629B" : "var(--border)",
                  }}
                  autoFocus
                />
                <span style={{ fontSize: "0.74rem", color: "var(--text-light)", display: "block", marginTop: 4, textAlign: "center" }}>
                  Received upon registration (or enter your registered email address)
                </span>
              </div>

              {suggestedCode && suggestedCode !== passCode && (
                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setPassCode(suggestedCode)}
                    style={{
                      background: "#eff6ff",
                      border: "1px dashed #93c5fd",
                      color: "#1d4ed8",
                      borderRadius: 16,
                      padding: "4px 12px",
                      fontSize: "0.76rem",
                      cursor: "pointer",
                    }}
                  >
                    💡 Use detected Pass: <strong>{suggestedCode}</strong>
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.9rem", fontSize: "1rem", fontWeight: 700 }}
                disabled={status === "loading" || !passCode.trim()}
              >
                {status === "loading" ? "Verifying code…" : "✓ Confirm & Mark Attendance"}
              </button>
            </form>
          )}
        </div>

        <div className="checkin-footer">
          <a href="/" style={{ color: "var(--text-muted)", fontSize: "0.78rem", textDecoration: "none" }}>IEEE SB SNGCE Portal</a>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
