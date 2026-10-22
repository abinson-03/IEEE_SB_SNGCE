import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import "./EventFormModal.css";

/**
 * EventFormModal
 * Handles both Create (no event prop) and Edit (event prop passed in).
 */
const EMPTY_FORM = {
  title: "", description: "", unit: "", date: "", venue: "", maxAttendees: "",
  isPaid: false, fee: "", memberFee: "", upiId: "",
};

const toLocalDatetime = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EventFormModal = ({ event, units = [], onClose, onSaved }) => {
  const isEdit = !!event;
  const [form, setForm]   = useState(EMPTY_FORM);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && event) {
      setForm({
        title:        event.title        || "",
        description:  event.description  || "",
        unit:         event.unit?._id    || event.unit || "",
        date:         toLocalDatetime(event.date),
        venue:        event.venue        || "",
        maxAttendees: event.maxAttendees != null ? event.maxAttendees : "",
        isPaid:       Boolean(event.isPaid),
        fee:          event.fee != null ? event.fee : "",
        memberFee:    event.memberFee != null ? event.memberFee : "",
        upiId:        event.upiId        || "",
      });
    }
  }, [event, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setBool = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.unit || !form.date) {
      setError("Title, unit, and date are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxAttendees: form.maxAttendees !== "" ? Number(form.maxAttendees) : null,
        fee:          form.isPaid ? Number(form.fee) || 0 : 0,
        memberFee:    form.isPaid ? Number(form.memberFee) || 0 : 0,
        upiId:        form.isPaid ? form.upiId.trim() : "",
        ...(!isEdit && { publishImmediately }),
      };
      let res;
      if (isEdit) {
        res = await axiosInstance.put(`/events/${event._id}`, payload);
      } else {
        res = await axiosInstance.post("/events", payload);
      }
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Event" : "Create Event"}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Event" : "Create New Event"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p className="form-error">{error}</p>}

          <label className="form-label">
            Title <span className="required">*</span>
            <input className="form-input" value={form.title} onChange={set("title")} maxLength={200} required />
          </label>

          <label className="form-label">
            Description
            <textarea className="form-input form-textarea" value={form.description} onChange={set("description")} rows={3} />
          </label>

          <div className="form-row">
            <label className="form-label">
              Chapter / Unit <span className="required">*</span>
              <select className="form-input" value={form.unit} onChange={set("unit")} required>
                <option value="">Select unit…</option>
                {units.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Date & Time <span className="required">*</span>
              <input type="datetime-local" className="form-input" value={form.date} onChange={set("date")} required />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              Venue
              <input className="form-input" value={form.venue} onChange={set("venue")} placeholder="e.g. Seminar Hall A" />
            </label>
            <label className="form-label">
              Max Attendees <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
              <input type="number" className="form-input" value={form.maxAttendees} onChange={set("maxAttendees")} min={1} placeholder="Leave blank for unlimited" />
            </label>
          </div>

          {/* Pricing & Entry Fee */}
          <div style={{ padding: "var(--sp-md)", background: "var(--bg-alt, #f8fafc)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", margin: "var(--sp-xs) 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
              <input type="checkbox" checked={form.isPaid} onChange={setBool("isPaid")} />
              🎟️ Paid Event (Requires Registration Fee)
            </label>

            {form.isPaid && (
              <div style={{ marginTop: "var(--sp-md)", display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
                <div className="form-row">
                  <label className="form-label">
                    Non-Member Fee (₹) <span className="required">*</span>
                    <input type="number" className="form-input" value={form.fee} onChange={set("fee")} min={0} placeholder="e.g. 100" required={form.isPaid} />
                  </label>
                  <label className="form-label">
                    IEEE Member Fee (₹) <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(0 = Free for Members)</span>
                    <input type="number" className="form-input" value={form.memberFee} onChange={set("memberFee")} min={0} placeholder="e.g. 0" />
                  </label>
                </div>
                <label className="form-label">
                  UPI ID for Payment <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(displayed to attendees)</span>
                  <input className="form-input" value={form.upiId} onChange={set("upiId")} placeholder="e.g. ieee-sngce@okhdfcbank" />
                </label>
              </div>
            )}
          </div>

          {!isEdit && (
            <div style={{ padding: "10px 14px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "var(--radius-sm)", margin: "var(--sp-sm) 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.88rem", color: "#065f46" }}>
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                />
                🚀 Publish Immediately (Make live on website & chapter pages immediately)
              </label>
              <p style={{ margin: "4px 0 0 24px", fontSize: "0.76rem", color: "#047857" }}>
                When checked, this event will be published right away and chapter members will receive a notification.
              </p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;
