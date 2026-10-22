import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const PostNoticeModal = ({ isOpen, onClose, onNoticePosted, onNoticeDeleted, noticeToEdit = null }) => {
  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [pinned, setPinned]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState("");

  const isEditing = Boolean(noticeToEdit && noticeToEdit._id);

  useEffect(() => {
    if (noticeToEdit) {
      setTitle(noticeToEdit.title || "");
      setBody(noticeToEdit.body || "");
      setPinned(Boolean(noticeToEdit.pinned));
    } else {
      setTitle("");
      setBody("");
      setPinned(false);
    }
    setError("");
  }, [noticeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Title and announcement body are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let res;
      if (isEditing) {
        res = await axiosInstance.patch(`/notices/${noticeToEdit._id}`, {
          title: title.trim(),
          body: body.trim(),
          pinned,
        });
      } else {
        res = await axiosInstance.post("/notices", {
          title: title.trim(),
          body: body.trim(),
          pinned,
        });
      }

      const returnedNotice = res.data.data;
      if (onNoticePosted) onNoticePosted(returnedNotice, isEditing);
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? "update" : "post"} notice.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    if (!window.confirm(`Are you sure you want to permanently delete the announcement "${noticeToEdit.title}"?`)) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await axiosInstance.delete(`/notices/${noticeToEdit._id}`);
      if (onNoticeDeleted) onNoticeDeleted(noticeToEdit._id);
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete announcement.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "var(--sp-md)",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 540,
          width: "100%",
          padding: "var(--sp-xl)",
          background: "#fff",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--navy)", display: "flex", alignItems: "center", gap: 8 }}>
            <span>{isEditing ? "✏️" : "📢"}</span>
            {isEditing ? "Edit Announcement" : "Post Public Notice"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              lineHeight: 1,
              padding: 4,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: "var(--radius-sm)", marginBottom: "var(--sp-md)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "var(--sp-md)" }}>
            <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: 6, color: "var(--navy)" }}>
              Announcement Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Call for ExeCom Applications 2026-2027"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "var(--sp-md)" }}>
            <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: 6, color: "var(--navy)" }}>
              Announcement Body *
            </label>
            <textarea
              placeholder="Write the announcement message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={5}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                fontSize: "0.92rem",
                lineHeight: 1.5,
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "var(--sp-lg)", display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              id="pinNoticeModal"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <label htmlFor="pinNoticeModal" style={{ fontSize: "0.88rem", cursor: "pointer", fontWeight: 600, color: "var(--text)" }}>
              📌 Pin this notice to the top of notice boards
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: isEditing ? "space-between" : "flex-end", alignItems: "center", gap: 10 }}>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || submitting}
                style={{
                  background: "transparent",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  padding: "7px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {deleting ? "Deleting..." : "🗑️ Delete Notice"}
              </button>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={submitting || deleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || deleting}
                style={{ minWidth: 120 }}
              >
                {submitting
                  ? (isEditing ? "Saving..." : "Posting...")
                  : (isEditing ? "💾 Save Changes" : "📢 Post Announcement")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostNoticeModal;
