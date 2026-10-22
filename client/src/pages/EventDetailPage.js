import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import "./EventDetailPage.css";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const EventDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Guest / Attendee details
  const [guestName, setGuestName]         = useState("");
  const [guestEmail, setGuestEmail]       = useState("");
  const [college, setCollege]             = useState("");
  const [phone, setPhone]                 = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(""); // base64 data URI
  const [screenshotPreview, setScreenshotPreview] = useState(""); // same, for preview

  // Registration state
  const [regLoading, setRegLoading]     = useState(false);
  const [regSuccess, setRegSuccess]     = useState(false);
  const [regError, setRegError]         = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [passData, setPassData]         = useState(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`/events/${id}`)
      .then((r) => {
        setEvent(r.data.data);
        setIsRegistered(!!r.data.data.isRegistered);
        const savedPass = localStorage.getItem(`event_pass_${id}`);
        if (savedPass) {
          try {
            setPassData(JSON.parse(savedPass));
          } catch {}
        }
      })
      .catch((e) => setError(e.response?.data?.message || "Event not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Screenshot file size must be under 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setPaymentScreenshot(compressed);
          setScreenshotPreview(compressed);
        } catch {
          setPaymentScreenshot(reader.result);
          setScreenshotPreview(reader.result);
        }
      };
      img.onerror = () => {
        setPaymentScreenshot(reader.result);
        setScreenshotPreview(reader.result);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const payload = {
        college,
        phone,
        transactionId,
        paymentScreenshot,
        ...(isAuthenticated ? {} : { name: guestName, email: guestEmail }),
      };
      const res = await axiosInstance.post(`/events/${id}/register`, payload);
      const regObj = res.data.registration || {
        _id: "TKT-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        name: isAuthenticated ? user?.name : guestName,
        email: isAuthenticated ? user?.email : guestEmail,
        college,
        phone,
        paymentStatus: res.data.paymentStatus,
        transactionId,
        registeredAt: new Date(),
      };
      setPassData(regObj);
      try {
        localStorage.setItem(`event_pass_${id}`, JSON.stringify(regObj));
      } catch {}
      setRegSuccess(true);
      setIsRegistered(true);
      setEvent((ev) => ({ ...ev, registrationCount: (ev.registrationCount || 0) + 1 }));
    } catch (err) {
      setRegError(err.response?.data?.message || "Registration failed.");
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) return (
    <div className="event-detail-shell">
      <div className="container" style={{ paddingTop: "var(--sp-3xl)" }}>
        <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius)" }} />
      </div>
    </div>
  );

  if (error) return (
    <div className="event-detail-shell">
      <div className="empty-state container" style={{ paddingTop: "var(--sp-3xl)" }}>
        <div className="empty-icon">⚠️</div>
        <h3>{error}</h3>
        <Link to="/events" className="btn btn-outline" style={{ marginTop: "var(--sp-md)" }}>← Back to Events</Link>
      </div>
    </div>
  );

  const isPast       = event && new Date(event.date) < new Date();
  const regClosed    = event?.status !== "published" || isPast;
  const chapterColor = { CIS: "#7c3aed", CS: "#2563eb", SPS: "#16a34a", WIE: "#db2777", SB: "#00629B" }[event?.unit?.name] || "#00629B";

  const isPaidEvent    = Boolean(event?.isPaid);
  const generalFee     = Number(event?.fee) || 0;
  const memberFee      = Number(event?.memberFee) || 0;
  const isMember       = isAuthenticated && user?.globalRole === "member";
  const userFee        = isMember ? memberFee : generalFee;
  const paymentRequired = isPaidEvent && userFee > 0;

  return (
    <div className="event-detail-shell">
      {/* Hero strip */}
      <div className="event-detail-hero" style={{ "--ch-color": chapterColor }}>
        <div className="container">
          <Link to="/events" className="event-detail-back">← All Events</Link>
          <div style={{ display: "flex", gap: "var(--sp-sm)", alignItems: "center", flexWrap: "wrap", marginBottom: "var(--sp-xs)" }}>
            <span className="event-detail-chapter">{event.unit?.name}</span>
            {isPaidEvent ? (
              <span style={{ padding: "3px 12px", borderRadius: "var(--radius-full)", background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.78rem" }}>
                🎟️ Paid Event (₹{generalFee})
              </span>
            ) : (
              <span style={{ padding: "3px 12px", borderRadius: "var(--radius-full)", background: "#d1fae5", color: "#065f46", fontWeight: 700, fontSize: "0.78rem" }}>
                🆓 Free Entry
              </span>
            )}
          </div>
          <h1 className="event-detail-title">{event.title}</h1>
          <div className="event-detail-meta-row">
            <span>📅 {fmt(event.date)}</span>
            {event.venue && <span>📍 {event.venue}</span>}
            <span>👥 {event.registrationCount || 0} registered</span>
          </div>
        </div>
      </div>

      <div className="container event-detail-body">
        {/* Description */}
        <div className="card event-detail-desc">
          <div className="card-body">
            <h2>About this Event</h2>
            <p style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{event.description || "No description provided."}</p>
            {event.createdBy && (
              <p className="event-detail-organizer">Organised by <strong>{event.createdBy.name}</strong> · {event.unit?.name} Chapter</p>
            )}

            {/* Pricing Details Breakdown */}
            <div style={{ marginTop: "var(--sp-xl)", padding: "var(--sp-md)", background: "var(--bg-alt, #f8fafc)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "0.95rem", margin: "0 0 var(--sp-sm)", color: "var(--navy)" }}>🎟️ Registration & Ticket Info</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-sm)", fontSize: "0.88rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.8rem" }}>General / Non-IEEE:</span>
                  <strong>{isPaidEvent && generalFee > 0 ? `₹${generalFee}` : "FREE"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.8rem" }}>IEEE Members:</span>
                  <strong style={{ color: memberFee === 0 ? "#16a34a" : "inherit" }}>
                    {isPaidEvent ? (memberFee > 0 ? `₹${memberFee}` : "FREE (Member Benefit)") : "FREE"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration panel */}
        <div className="card event-detail-reg">
          <div className="card-body">
            {regClosed ? (
              <div className="event-detail-closed">
                <span style={{ fontSize: "2rem" }}>{isPast ? "🏁" : "🔒"}</span>
                <h3>{isPast ? "Event has passed" : "Registration closed"}</h3>
                <p>{isPast ? "This event already took place." : "This event is no longer accepting registrations."}</p>
              </div>
            ) : isRegistered || regSuccess ? (
              <div className="event-detail-pass-container">
                <div className="event-pass-card" style={{ borderColor: chapterColor }}>
                  {/* Pass Header */}
                  <div className="event-pass-header" style={{ background: chapterColor }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="event-pass-brand">IEEE SB SNGCE · {event.unit?.name}</span>
                      <span className="event-pass-badge">ENTRY PASS</span>
                    </div>
                    <h3 className="event-pass-event-title">{event.title}</h3>
                  </div>

                  {/* Pass Body */}
                  <div className="event-pass-body">
                    <div className="event-pass-ticket-id">
                      <span>PASS CODE:</span>
                      <strong style={{ fontSize: "1.15rem", color: "#00629B", letterSpacing: "0.06em" }}>
                        {passData?.ticketCode || (passData?._id ? (passData._id.toString().startsWith("TKT-") ? passData._id : `TKT-${passData._id.toString().slice(-4).toUpperCase()}`) : "CIS-PASS")}
                      </strong>
                    </div>

                    <div className="event-pass-field">
                      <span className="event-pass-label">ATTENDEE NAME</span>
                      <div className="event-pass-val" style={{ fontSize: "1.05rem", fontWeight: "bold" }}>
                        {passData?.name || (isAuthenticated ? user?.name : "Registered Attendee")}
                      </div>
                    </div>

                    <div className="event-pass-grid">
                      <div>
                        <span className="event-pass-label">EMAIL</span>
                        <div className="event-pass-val" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
                          {passData?.email || (isAuthenticated ? user?.email : "")}
                        </div>
                      </div>
                      <div>
                        <span className="event-pass-label">COLLEGE</span>
                        <div className="event-pass-val" style={{ fontSize: "0.82rem" }}>
                          {passData?.college || college || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="event-pass-grid" style={{ marginTop: 8 }}>
                      <div>
                        <span className="event-pass-label">DATE & TIME</span>
                        <div className="event-pass-val" style={{ fontSize: "0.82rem" }}>
                          {fmt(event.date)}
                        </div>
                      </div>
                      <div>
                        <span className="event-pass-label">VENUE</span>
                        <div className="event-pass-val" style={{ fontSize: "0.82rem" }}>
                          {event.venue || "Campus Venue"}
                        </div>
                      </div>
                    </div>

                    <div className="event-pass-status-box" style={{ marginTop: 12 }}>
                      {passData?.paymentStatus === "paid" || (!isPaidEvent && !passData?.paymentStatus) || passData?.paymentStatus === "free" ? (
                        <div style={{ background: "#d1fae5", color: "#065f46", padding: "6px 12px", borderRadius: 6, fontSize: "0.82rem", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>✓ {isPaidEvent ? `PAID ENTRY (₹${generalFee})` : "FREE ENTRY"}</span>
                          {passData?.transactionId && <code style={{ fontSize: "0.75rem" }}>UTR: {passData.transactionId.slice(-6)}</code>}
                        </div>
                      ) : (
                        <div style={{ background: "#fef3c7", color: "#92400e", padding: "6px 12px", borderRadius: 6, fontSize: "0.82rem", fontWeight: 700 }}>
                          ⏳ PAYMENT VERIFICATION PENDING
                        </div>
                      )}
                    </div>

                    {/* How to Attend instruction */}
                    <div className="event-pass-instructions">
                      <h4>📍 How to Attend at Venue:</h4>
                      <ol>
                        <li><strong>Desk Check-in:</strong> Show this pass or give your name/email at the registration desk for instant entry.</li>
                        <li><strong>Self QR Check-in:</strong> Scan the Event QR Code displayed at the venue entrance using your smartphone.</li>
                      </ol>
                    </div>

                    {/* Actions */}
                    <div className="event-pass-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, padding: "8px 12px", fontSize: "0.82rem" }}
                        onClick={() => window.print()}
                      >
                        🖨️ Print / Save Pass
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: "0.82rem" }}
                        onClick={() => {
                          const tktId = passData?._id ? (passData._id.toString().startsWith("TKT-") ? passData._id : `TKT-${passData._id.toString().slice(-6).toUpperCase()}`) : "VERIFIED-REG";
                          navigator.clipboard.writeText(tktId);
                          alert("Ticket ID copied!");
                        }}
                      >
                        📋 Copy ID
                      </button>
                    </div>

                    {isAuthenticated && (
                      <div style={{ marginTop: 10, textAlign: "center" }}>
                        <Link to="/member/my-events" style={{ fontSize: "0.78rem", color: "var(--primary)", textDecoration: "none" }}>
                          📱 View in My Events →
                        </Link>
                      </div>
                    )}

                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistered(false);
                          setRegSuccess(false);
                          setGuestName("");
                          setGuestEmail("");
                          setPhone("");
                          setCollege("");
                          setTransactionId("");
                          setPaymentScreenshot("");
                          setScreenshotPreview("");
                        }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.75rem", textDecoration: "underline", cursor: "pointer" }}
                      >
                        Register another person
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2>{isPaidEvent ? "Register & Book Ticket" : "Register for this Event"}</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 var(--sp-md)" }}>
                  Open to all students, IEEE members, and outside college guests.
                </p>

                {regError && <p className="form-error">{regError}</p>}

                <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
                  {!isAuthenticated ? (
                    <>
                      <label className="form-label">
                        Full Name <span className="required">*</span>
                        <input className="form-input" required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Rahul Sharma" />
                      </label>
                      <label className="form-label">
                        Email Address <span className="required">*</span>
                        <input className="form-input" type="email" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="you@example.com" />
                      </label>
                    </>
                  ) : (
                    <div style={{ padding: "var(--sp-sm) var(--sp-md)", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "#166534" }}>
                      Registering as <strong>{user?.name}</strong> ({user?.email})
                    </div>
                  )}

                  <div className="form-row">
                    <label className="form-label">
                      College / Institution
                      <input className="form-input" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. SNGCE / MEC / Outsider" />
                    </label>
                    <label className="form-label">
                      Phone / WhatsApp
                      <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" />
                    </label>
                  </div>

                  {/* Payment Details if Event is Paid */}
                  {paymentRequired && (
                    <div style={{ padding: "var(--sp-md)", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#92400e" }}>
                          💳 Fee to Pay: ₹{userFee}
                        </span>
                        {event.upiId && (
                          <span style={{ fontSize: "0.78rem", color: "#78350f" }}>
                            UPI ID: <code>{event.upiId}</code>
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#78350f", margin: "0 0 var(--sp-sm)" }}>
                        Please transfer ₹{userFee} via GPay / PhonePe / Paytm to <strong>{event.upiId || "ieee-sngce@upi"}</strong> and enter the transaction UTR number below:
                      </p>
                      <label className="form-label" style={{ margin: "0 0 var(--sp-sm)" }}>
                        UPI Transaction / UTR Ref No. <span className="required">*</span>
                        <input
                          className="form-input"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 423589102431"
                        />
                      </label>

                      {/* Payment Screenshot Upload */}
                      <label className="form-label" style={{ margin: 0 }}>
                        📸 Payment Screenshot <span style={{ fontSize: "0.78rem", color: "#92400e" }}>(Upload proof — max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-input"
                          style={{ padding: "6px", cursor: "pointer" }}
                          onChange={handleScreenshotUpload}
                        />
                      </label>
                      {screenshotPreview && (
                        <div style={{ marginTop: "var(--sp-sm)" }}>
                          <p style={{ fontSize: "0.75rem", color: "#16a34a", marginBottom: 4 }}>✅ Screenshot uploaded — preview:</p>
                          <img
                            src={screenshotPreview}
                            alt="Payment proof"
                            style={{ maxWidth: "100%", maxHeight: 180, borderRadius: "var(--radius-sm)", border: "1px solid #fde68a", objectFit: "contain" }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={regLoading} style={{ alignSelf: "flex-start", padding: "0.75rem 1.4rem", fontSize: "0.95rem" }}>
                    {regLoading ? "Processing…" : paymentRequired ? `Pay ₹${userFee} & Register →` : "Register Now (Free) →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
