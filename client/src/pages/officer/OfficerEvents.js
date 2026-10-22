import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import EventFormModal from "../../components/EventFormModal";
import CertificateTemplateModal from "../../components/CertificateTemplateModal";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS = { draft: "#f59e0b", published: "#10b981", archived: "#6b7280" };

const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const OfficerEvents = () => {
  const [events, setEvents]     = useState([]);
  const [units, setUnits]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [qrModal, setQrModal]   = useState(null); // { url, localUrl, lanIp, dataUrl, localDataUrl, title, activeTab }
  const [attendeesModal, setAttendeesModal] = useState(null); // { eventId, title, registrations, attendance }
  const [proofModal, setProofModal] = useState(null); // Attendee receipt details for lightbox
  const [templateModalEvent, setTemplateModalEvent] = useState(null); // { _id, title, certificateTemplatePath }
  const [actionMsg, setActionMsg] = useState("");

  const toast = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3000); };

  const loadEvents = useCallback(() => {
    setLoading(true);
    axiosInstance.get("/events/mine")
      .then((r) => setEvents(r.data.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEvents();
    axiosInstance.get("/units").then((r) => setUnits(r.data.data || [])).catch(() => {});
  }, [loadEvents]);

  const handleSaved = (saved) => {
    setShowForm(false);
    setEditTarget(null);
    toast(saved._id ? "Event saved!" : "Event created!");
    loadEvents();
  };

  const changeStatus = async (eventId, action, label) => {
    if (!window.confirm(`${label} this event?`)) return;
    try {
      await axiosInstance.patch(`/events/${eventId}/${action}`);
      toast(`Event ${label.toLowerCase()}ed!`);
      loadEvents();
    } catch (err) {
      toast(err.response?.data?.message || `Failed to ${label.toLowerCase()} event.`);
    }
  };

  const handleGenerateQR = async (eventId) => {
    try {
      const r = await axiosInstance.post(`/events/${eventId}/qr`);
      const ev = events.find((e) => e._id === eventId);
      setQrModal({
        url: r.data.checkInUrl,
        localUrl: r.data.localCheckInUrl,
        lanIp: r.data.lanIp,
        dataUrl: r.data.qrDataUrl,
        localDataUrl: r.data.localQrDataUrl,
        title: ev?.title || "Event",
        activeTab: "lan",
      });
    } catch (err) {
      toast(err.response?.data?.message || "Failed to generate QR.");
    }
  };

  const handleDownloadReport = async (eventId, title) => {
    try {
      toast("Generating AI-assisted Event Report PDF…");
      const res = await axiosInstance.get(`/events/${eventId}/report`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Event_Report_${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Report downloaded successfully!");
    } catch (err) {
      console.error("[handleDownloadReport] Error:", err);
      let errorMsg = "Failed to download event report.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast(`⚠️ ${errorMsg}`);
    }
  };

  const handleViewAttendees = (ev) => {
    setAttendeesModal({
      eventId: ev._id,
      title: ev.title,
      registrations: ev.registrations || [],
      attendance: ev.attendance || [],
    });
  };

  const handleToggleAttendance = async (eventId, reg, action = "mark") => {
    try {
      const res = await axiosInstance.post(`/events/${eventId}/attendance/mark`, {
        email: reg.email,
        name: reg.name,
        userId: reg.user,
        action,
      });

      const updatedAttendance = res.data.attendance || [];
      // Update attendeesModal state
      setAttendeesModal((prev) => (prev ? { ...prev, attendance: updatedAttendance } : null));
      // Also update events list so attendee counts stay in sync
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, attendance: updatedAttendance } : e))
      );
      toast(action === "mark" ? `✓ ${reg.name} marked present!` : `Undone check-in for ${reg.name}`);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update attendance.");
    }
  };

  const { user } = useAuth();
  // Only superadmin and chapteradmin (Advisors & Chairs) can create events
  const canCreate = ["superadmin", "chapteradmin"].includes(user?.globalRole);

  return (
    <div>
      <div className="dash-page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--sp-md)" }}>
        <div>
          <h1>Events & Attendance</h1>
          <p>{events.length} event{events.length !== 1 ? "s" : ""} total.
            {!canCreate && <span style={{ marginLeft: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>👁️ View-only mode — Contact your Chapter Chair/Advisor to create events.</span>}
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            + Create Event
          </button>
        )}
      </div>

      {actionMsg && (
        <div style={{ padding: "0.6rem 1rem", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: "var(--radius-sm)", marginBottom: "var(--sp-md)", fontSize: "0.88rem", color: "#065f46" }}>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius)" }} />
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗓️</div>
          <h3>No events yet</h3>
          <p>Click "Create Event" to publish your first event.</p>
        </div>
      ) : (
        <div className="card">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Title</th><th>Unit</th><th>Date</th><th>Status</th><th>Registrations</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const regCount = ev.registrations?.length || 0;
                  const attCount = ev.attendance?.length || 0;
                  return (
                    <tr key={ev._id}>
                      <td><strong>{ev.title}</strong></td>
                      <td><span className="badge badge-primary">{ev.unit?.name}</span></td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{formatDate(ev.date)}</td>
                      <td>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: "0.72rem", fontWeight: 700, background: STATUS_COLORS[ev.status] + "22", color: STATUS_COLORS[ev.status], textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {ev.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: "0.78rem", padding: "2px 8px" }}
                          onClick={() => handleViewAttendees(ev)}
                          title="View registered participants"
                        >
                          👥 {regCount} ({attCount} attended)
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {/* Everyone can view attendees & download report */}
                          <button className="btn btn-sm btn-outline" onClick={() => handleViewAttendees(ev)} title="View Attendees">👥 Attendees</button>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{
                              borderColor: ev.certificateTemplatePath ? "#c4b5fd" : "#cbd5e1",
                              color: ev.certificateTemplatePath ? "#6d28d9" : "#475569",
                              background: ev.certificateTemplatePath ? "#ede9fe" : "transparent",
                              fontWeight: 600,
                            }}
                            onClick={() => setTemplateModalEvent(ev)}
                            title="Upload or change custom certificate background template"
                          >
                            🎨 {ev.certificateTemplatePath ? "Template ✓" : "Template"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ borderColor: "#00629B", color: "#00629B" }}
                            onClick={() => handleDownloadReport(ev._id, ev.title)}
                            title="Generate and download official Executive Event Report PDF"
                          >
                            📄 Generate Report
                          </button>
                          {/* Any officer can display QR for published events */}
                          {ev.status === "published" && (
                            <button className="btn btn-sm btn-outline" onClick={() => handleGenerateQR(ev._id)} title="Show QR Check-in Code">📱 QR Code</button>
                          )}
                          {/* Only chapteradmin/superadmin can edit/publish/archive */}
                          {canCreate && (
                            <>
                              <button className="btn btn-sm btn-outline" onClick={() => { setEditTarget(ev); setShowForm(true); }} title="Edit">✏️ Edit</button>
                              {ev.status === "draft" && (
                                <button className="btn btn-sm btn-primary" onClick={() => changeStatus(ev._id, "publish", "Publish")}>🚀 Publish</button>
                              )}
                              {ev.status === "published" && (
                                <button className="btn btn-sm btn-outline" style={{ borderColor: "#9ca3af", color: "#6b7280" }} onClick={() => changeStatus(ev._id, "archive", "Archive")}>📦 Archive</button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <EventFormModal
          event={editTarget}
          units={units}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Attendees Modal */}
      {attendeesModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setAttendeesModal(null)}>
          <div className="modal-box" style={{ maxWidth: 780 }}>
            <div className="modal-header">
              <h2>👥 Attendees & Check-in Desk: {attendeesModal.title}</h2>
              <button className="modal-close" onClick={() => setAttendeesModal(null)}>✕</button>
            </div>
            <div style={{ padding: "var(--sp-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: "var(--sp-md)", fontSize: "0.88rem" }}>
                  <span><strong>Total Registered:</strong> {attendeesModal.registrations.length}</span>
                  <span style={{ color: "#065f46" }}><strong>Checked In (Present):</strong> {attendeesModal.attendance.length}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  💡 Desk officers can click <strong>✓ Check In</strong> as participants arrive at the desk.
                </div>
              </div>

              {attendeesModal.registrations.length === 0 ? (
                <div className="empty-state" style={{ padding: "var(--sp-xl) 0" }}>
                  <p>No participants have registered for this event yet.</p>
                </div>
              ) : (
                <div className="dash-table-wrap" style={{ maxHeight: 380, overflowY: "auto" }}>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>College</th>
                        <th>Payment & Proof</th>
                        <th>Registered Date</th>
                        <th style={{ textAlign: "center" }}>Desk Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendeesModal.registrations.map((reg, idx) => {
                        const isAttended = attendeesModal.attendance.some(
                          (a) =>
                            (reg.user && (a.user?._id || a.user)?.toString() === (reg.user?._id || reg.user)?.toString()) ||
                            (a.email && a.email.toLowerCase() === reg.email?.toLowerCase())
                        );
                        return (
                          <tr key={reg._id || idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <strong>{reg.name || reg.user?.name || "Participant"}</strong>
                              {reg.ticketCode && (
                                <div>
                                  <span style={{ fontFamily: "monospace", fontSize: "0.72rem", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, color: "#00629B", display: "inline-block", marginTop: 2, fontWeight: 700 }}>
                                    {reg.ticketCode}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              <div>{reg.email || reg.user?.email}</div>
                              {reg.phone && <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>📞 {reg.phone}</div>}
                            </td>
                            <td style={{ fontSize: "0.82rem" }}>{reg.college || "—"}</td>
                            <td>
                              {reg.paymentStatus === "paid" ? (
                                <span style={{ padding: "2px 8px", background: "#dcfce7", color: "#15803d", borderRadius: "var(--radius-full)", fontSize: "0.72rem", fontWeight: 700 }} title={reg.transactionId ? `UTR: ${reg.transactionId}` : "Paid"}>
                                  💳 Paid {reg.transactionId ? `(${reg.transactionId.slice(-6)})` : ""}
                                </span>
                              ) : reg.paymentStatus === "pending" ? (
                                <span style={{ padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: "var(--radius-full)", fontSize: "0.72rem", fontWeight: 600 }}>
                                  ⏳ Pending
                                </span>
                              ) : (
                                <span style={{ padding: "2px 8px", background: "#f3f4f6", color: "#4b5563", borderRadius: "var(--radius-full)", fontSize: "0.72rem", fontWeight: 600 }}>
                                  🆓 Free
                                </span>
                              )}
                              {reg.paymentScreenshot && (
                                <div style={{ marginTop: 4 }}>
                                  <button
                                    type="button"
                                    onClick={() => setProofModal({ ...reg, eventTitle: attendeesModal.title })}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "3px 8px",
                                      background: "#fef3c7",
                                      border: "1px solid #fde68a",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      color: "#92400e",
                                      fontSize: "0.72rem",
                                      fontWeight: 600,
                                    }}
                                    title="Click to view full payment receipt & details"
                                  >
                                    <img
                                      src={reg.paymentScreenshot}
                                      alt="Proof"
                                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                                      style={{ width: 18, height: 18, objectFit: "cover", borderRadius: 2 }}
                                    />
                                    📸 View Proof
                                  </button>
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {reg.registeredAt ? formatDate(reg.registeredAt) : "—"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {isAttended ? (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ padding: "3px 10px", background: "#d1fae5", color: "#065f46", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 700 }}>
                                    ✅ Present
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAttendance(attendeesModal.eventId, reg, "unmark")}
                                    style={{
                                      border: "1px solid #fca5a5",
                                      background: "#fef2f2",
                                      color: "#dc2626",
                                      padding: "2px 7px",
                                      borderRadius: 4,
                                      fontSize: "0.68rem",
                                      cursor: "pointer",
                                    }}
                                    title="Undo check-in"
                                  >
                                    Undo
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(attendeesModal.eventId, reg, "mark")}
                                  className="btn btn-sm btn-primary"
                                  style={{ padding: "3px 12px", fontSize: "0.75rem", fontWeight: 600 }}
                                  title="Check in attendee at desk"
                                >
                                  ✓ Check In
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setQrModal(null)}>
          <div className="modal-box" style={{ maxWidth: 460, textAlign: "center" }}>
            <div className="modal-header">
              <h2>📱 QR Check-in: {qrModal.title}</h2>
              <button className="modal-close" onClick={() => setQrModal(null)}>✕</button>
            </div>
            <div style={{ padding: "var(--sp-xl)" }}>
              {/* Tabs for Wi-Fi Network (Phones) vs Localhost */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "var(--sp-md)" }}>
                <button
                  type="button"
                  className={`btn btn-sm ${qrModal.activeTab !== "local" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setQrModal((prev) => ({ ...prev, activeTab: "lan" }))}
                  style={{ fontSize: "0.78rem" }}
                >
                  📶 Wi-Fi / Mobile Scan ({qrModal.lanIp || "LAN"})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${qrModal.activeTab === "local" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setQrModal((prev) => ({ ...prev, activeTab: "local" }))}
                  style={{ fontSize: "0.78rem" }}
                >
                  💻 Localhost
                </button>
              </div>

              <div style={{ display: "inline-block", padding: 12, background: "#ffffff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid var(--border)" }}>
                <img
                  src={qrModal.activeTab === "local" && qrModal.localDataUrl ? qrModal.localDataUrl : qrModal.dataUrl}
                  alt="Check-in QR Code"
                  style={{ width: 240, height: 240, display: "block" }}
                />
              </div>

              <div style={{ margin: "var(--sp-md) 0 var(--sp-xs)", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 12px", fontSize: "0.8rem", color: "#166534" }}>
                {qrModal.activeTab === "local" ? (
                  <span>💻 Testing link for local browser only</span>
                ) : (
                  <span>📱 <strong>Campus Wi-Fi Ready:</strong> Any phone or laptop on Wi-Fi can scan this to check in!</span>
                )}
              </div>

              <div style={{ display: "flex", gap: "var(--sp-sm)", justifyContent: "center", flexWrap: "wrap", marginTop: "var(--sp-md)" }}>
                <a
                  href={qrModal.activeTab === "local" ? (qrModal.localUrl || qrModal.url) : qrModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: "0.82rem" }}
                >
                  🔗 Open Check-in Link
                </a>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: "0.82rem" }}
                  onClick={() => {
                    const targetUrl = qrModal.activeTab === "local" ? (qrModal.localUrl || qrModal.url) : qrModal.url;
                    navigator.clipboard.writeText(targetUrl);
                    toast("Link copied to clipboard!");
                  }}
                >
                  📋 Copy Link
                </button>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-light)", marginTop: "var(--sp-sm)", wordBreak: "break-all" }}>
                {qrModal.activeTab === "local" ? (qrModal.localUrl || qrModal.url) : qrModal.url}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Lightbox Modal */}
      {proofModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setProofModal(null)}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>💳 Payment Receipt Review</h2>
              <button className="modal-close" onClick={() => setProofModal(null)}>✕</button>
            </div>
            <div style={{ padding: "var(--sp-lg)" }}>
              <div style={{ background: "var(--bg-alt, #f8fafc)", padding: "var(--sp-md)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: "var(--sp-md)", fontSize: "0.85rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                  <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Participant:</span><strong>{proofModal.name}</strong></div>
                  <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Phone:</span><strong>{proofModal.phone || "—"}</strong></div>
                  <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Email:</span><span style={{ wordBreak: "break-all" }}>{proofModal.email}</span></div>
                  <div><span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>College:</span><strong>{proofModal.college || "—"}</strong></div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Transaction UTR:</span>
                    <code style={{ fontSize: "0.92rem", fontWeight: "bold", color: "#00629B" }}>{proofModal.transactionId || "No UTR provided"}</code>
                  </div>
                  <span style={{ padding: "3px 10px", background: "#d1fae5", color: "#065f46", borderRadius: 12, fontSize: "0.75rem", fontWeight: 700 }}>
                    {proofModal.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </div>

              {proofModal.paymentScreenshot ? (
                <div style={{ maxHeight: "55vh", overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 8, background: "#ffffff", textAlign: "center" }}>
                  <img
                    src={proofModal.paymentScreenshot}
                    alt="Payment receipt proof"
                    style={{ maxWidth: "100%", maxHeight: "50vh", objectFit: "contain", borderRadius: 4 }}
                  />
                </div>
              ) : (
                <div style={{ padding: "var(--sp-xl)", textAlign: "center", color: "var(--text-muted)" }}>
                  No payment screenshot uploaded.
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--sp-md)" }}>
                {proofModal.transactionId && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => { navigator.clipboard.writeText(proofModal.transactionId); toast("UTR copied!"); }}
                  >
                    📋 Copy UTR
                  </button>
                )}
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setProofModal(null)}>
                  Close Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Template Modal */}
      <CertificateTemplateModal
        event={templateModalEvent}
        isOpen={Boolean(templateModalEvent)}
        onClose={() => setTemplateModalEvent(null)}
        onSuccess={(eventId, newPath) => {
          setEvents((prev) =>
            prev.map((e) => (e._id === eventId ? { ...e, certificateTemplatePath: newPath } : e))
          );
          toast(newPath ? "Certificate template updated!" : "Reverted to default design!");
        }}
      />
    </div>
  );
};

export default OfficerEvents;
