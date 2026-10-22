import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

const MemberEvents = () => {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [passModal, setPassModal] = useState(null); // holds event object for Pass Code modal

  useEffect(() => {
    axiosInstance.get("/member/my-events")
      .then((r) => setEvents(r.data.data || []))
      .catch((e) => setError(e.response?.data?.message || "Failed to load events."))
      .finally(() => setLoading(false));
  }, []);

  const upcomingEvents = events.filter((e) => e.isUpcoming);
  const pastEvents     = events.filter((e) => !e.isUpcoming);

  const EventRow = ({ ev }) => {
    const isUpcoming = ev.isUpcoming;
    const statusLabel = ev.status === "published"
      ? (isUpcoming ? "Upcoming" : "Attended")
      : (ev.status === "archived" ? "Archived" : ev.status);
    const statusColor = isUpcoming ? "#10b981" : "#6b7280";

    return (
      <div className="card" style={{ marginBottom: "var(--sp-md)" }}>
        <div className="card-body" style={{ display: "flex", gap: "var(--sp-lg)", alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* Date block */}
          <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--navy)", lineHeight: 1 }}>
              {new Date(ev.date).toLocaleDateString("en-IN", { day: "2-digit" })}
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
              {new Date(ev.date).toLocaleDateString("en-IN", { month: "short" })}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-light)" }}>
              {new Date(ev.date).getFullYear()}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "var(--sp-sm)", alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
              {ev.unit && <span className="badge badge-primary">{ev.unit.name}</span>}
              <span style={{
                padding: "2px 10px", borderRadius: "var(--radius-full)", fontSize: "0.7rem",
                fontWeight: 700, background: statusColor + "20", color: statusColor,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {statusLabel}
              </span>
            </div>
            <Link to={`/events/${ev._id}`} style={{ textDecoration: "none" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--navy)", fontWeight: 800 }}>
                {ev.title}
              </h3>
            </Link>
            {ev.venue && (
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                📍 {ev.venue} &nbsp;·&nbsp; 🕐 {new Date(ev.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          {/* Action button */}
          <div style={{ flexShrink: 0 }}>
            {ev.isAttended ? (
              <span style={{ padding: "4px 12px", background: "#d1fae5", color: "#065f46", borderRadius: "var(--radius-full)", fontSize: "0.78rem", fontWeight: 700 }}>
                ✅ Checked In
              </span>
            ) : isUpcoming ? (
              <button
                className="btn btn-outline"
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem", fontWeight: 600, borderColor: "#00629B", color: "#00629B" }}
                onClick={() => setPassModal(ev)}
              >
                🎟️ View Pass Code
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="dash-page-header">
        <h1>My Events</h1>
        <p>
          {loading ? "Loading…" : `${events.length} event${events.length !== 1 ? "s" : ""} registered`}
        </p>
      </div>

      {error && (
        <p style={{ padding: "var(--sp-md)", background: "#fee2e2", borderRadius: "var(--radius-sm)", color: "#991b1b" }}>
          ⚠️ {error}
        </p>
      )}

      {loading && <div className="skeleton" style={{ height: 180, borderRadius: "var(--radius)" }} />}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🗓️</div>
          <h3>No registered events yet</h3>
          <p>Browse upcoming events and register — they will appear here with venue details and a check-in QR code.</p>
          <Link to="/events" className="btn btn-primary" style={{ marginTop: "var(--sp-md)" }}>
            Browse Events →
          </Link>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <section style={{ marginBottom: "var(--sp-xl)" }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--sp-md)" }}>
                🟢 Upcoming ({upcomingEvents.length})
              </h2>
              {upcomingEvents.map((ev) => <EventRow key={ev._id} ev={ev} />)}
            </section>
          )}

          {/* Past */}
          {pastEvents.length > 0 && (
            <section>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--sp-md)" }}>
                ⬜ Past Events ({pastEvents.length})
              </h2>
              {pastEvents.map((ev) => <EventRow key={ev._id} ev={ev} />)}
            </section>
          )}

          <p style={{ marginTop: "var(--sp-lg)", fontSize: "0.78rem", color: "var(--text-light)" }}>
            <Link to="/events" style={{ color: "var(--primary)" }}>Browse more events →</Link>
          </p>
        </>
      )}

      {/* Pass Code Modal */}
      {passModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setPassModal(null)}
        >
          <div className="modal-box" style={{ maxWidth: 440, textAlign: "center" }}>
            <div className="modal-header">
              <h2>🎟️ Event Entry Pass</h2>
              <button className="modal-close" onClick={() => setPassModal(null)}>✕</button>
            </div>
            <div style={{ padding: "var(--sp-xl)" }}>
              <span className="badge badge-primary" style={{ marginBottom: "var(--sp-xs)" }}>{passModal.unit?.name}</span>
              <h3 style={{ margin: "4px 0 var(--sp-md)", color: "var(--navy)", fontSize: "1.2rem" }}>{passModal.title}</h3>
              
              <div style={{ background: "#f8fafc", border: "2px dashed #00629B", borderRadius: 12, padding: "var(--sp-lg)", margin: "0 auto var(--sp-md)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, display: "block" }}>
                  YOUR ATTENDEE PASS CODE
                </span>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--navy)", letterSpacing: "0.08em", margin: "6px 0", fontFamily: "monospace" }}>
                  {passModal.ticketCode}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => { navigator.clipboard.writeText(passModal.ticketCode); alert("Pass code copied: " + passModal.ticketCode); }}
                  style={{ fontSize: "0.75rem", padding: "3px 10px" }}
                >
                  📋 Copy Code
                </button>
              </div>

              <div style={{ textAlign: "left", fontSize: "0.82rem", background: "#f1f5f9", padding: "10px 14px", borderRadius: 8, marginBottom: "var(--sp-md)" }}>
                <div>📅 <strong>Date:</strong> {new Date(passModal.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                {passModal.venue && <div style={{ marginTop: 4 }}>📍 <strong>Venue:</strong> {passModal.venue}</div>}
              </div>

              <div style={{ textAlign: "left", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: 8, fontSize: "0.8rem", color: "#166534" }}>
                <strong>📍 How to Mark Attendance at the Venue:</strong>
                <ol style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.5 }}>
                  <li>Arrive at the event venue and locate the <strong>Venue QR Code</strong> (displayed at the entrance or registration desk).</li>
                  <li>Scan the Venue QR code with your phone camera.</li>
                  <li>Enter your Pass Code (<strong>{passModal.ticketCode}</strong>) on the check-in screen to confirm attendance.</li>
                  <li>Or show this pass code directly to the officer at the desk!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberEvents;
