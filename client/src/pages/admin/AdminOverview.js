import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import PostNoticeModal from "../../components/PostNoticeModal";

const AdminOverview = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [noticeModal, setNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeMsg, setNoticeMsg]     = useState("");
  const [notices, setNotices]         = useState([]);

  const loadNotices = () => {
    axiosInstance.get("/notices/public?limit=20")
      .then((r) => setNotices(r.data.data || []))
      .catch(() => setNotices([]));
  };

  useEffect(() => {
    axiosInstance.get("/admin/overview")
      .then((r) => setData(r.data.data))
      .catch((e) => setError(e.response?.data?.message || "Failed to load overview."))
      .finally(() => setLoading(false));

    loadNotices();
  }, []);

  return (
    <div>
      <div className="dash-page-header">
        <h1>System Overview</h1>
        <p>Live snapshot of the IEEE SB SNGCE portal.</p>
      </div>

      {noticeMsg && (
        <div style={{ padding: "10px 16px", background: "#d1fae5", color: "#065f46", borderRadius: "var(--radius-sm)", marginBottom: "var(--sp-md)", fontWeight: 600 }}>
          ✓ {noticeMsg}
        </div>
      )}

      {loading && (
        <div className="dash-stat-grid">
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--radius)" }} />)}
        </div>
      )}

      {error && <p style={{ color: "var(--text-muted)" }}>⚠️ {error}</p>}

      {data && (
        <>
          <div className="dash-stat-grid">
            <div className="dash-stat-card">
              <div className="dash-stat-card__value">{data.totalUsers}</div>
              <div className="dash-stat-card__label">Total Users</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-card__value">{data.totalEvents}</div>
              <div className="dash-stat-card__label">Total Events</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-card__value">{data.totalUnits}</div>
              <div className="dash-stat-card__label">Units / Chapters</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--sp-lg)", marginTop: "var(--sp-lg)" }}>
            {/* Quick Actions */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "var(--sp-md)", color: "var(--navy)" }}>
                  ⚡ Quick Management Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNotice(null);
                      setNoticeModal(true);
                    }}
                    className="btn btn-accent"
                    style={{ justifyContent: "center", fontWeight: 700 }}
                  >
                    📢 Post Public Notice / Announcement
                  </button>
                  <Link to="/admin/events" className="btn btn-primary" style={{ justifyContent: "center", textDecoration: "none" }}>
                    🗓️ Create & Manage Events (SB & Chapters)
                  </Link>
                  <Link to="/admin/users" className="btn btn-secondary" style={{ justifyContent: "center", textDecoration: "none" }}>
                    👥 Manage Users & Roles
                  </Link>
                  <Link to="/admin/cms" className="btn btn-secondary" style={{ justifyContent: "center", textDecoration: "none" }}>
                    📋 Assign ExeCom Positions (2025-2026)
                  </Link>
                  <Link to="/admin/audit" className="btn btn-secondary" style={{ justifyContent: "center", textDecoration: "none" }}>
                    🔍 View Security Audit Logs
                  </Link>
                </div>
              </div>
            </div>

            {/* Role Breakdown */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "var(--sp-md)", color: "var(--navy)" }}>
                  👥 Users by Global Role
                </h3>
                {Object.entries(data.roleBreakdown || {}).map(([role, count]) => (
                  <div key={role} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: "0.92rem" }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{role}</span>
                    <strong style={{ color: "var(--navy)" }}>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Announcements / Notices Management Card ── */}
          <div className="card" style={{ marginTop: "var(--sp-lg)" }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "var(--navy)" }}>
                    📢 Active Announcements & Notices ({notices.length})
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Public notices displayed on Home and Chapter pages. Edit or delete any announcement directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNotice(null);
                    setNoticeModal(true);
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: "0.82rem", padding: "6px 14px", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                >
                  + New Notice
                </button>
              </div>

              {notices.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "var(--sp-md) 0" }}>
                  No active notices. Click "+ New Notice" to broadcast an announcement.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {notices.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        background: "#f8fafc",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <strong style={{ color: "var(--navy)", fontSize: "0.95rem" }}>{n.title}</strong>
                          {n.pinned && (
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#ffdcc3", color: "#2f1500", padding: "1px 6px", borderRadius: 4 }}>
                              📌 PINNED
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: "0.84rem", color: "var(--text)", lineHeight: 1.4 }}>
                          {n.body.length > 120 ? `${n.body.substring(0, 120)}...` : n.body}
                        </p>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          Posted by {n.postedBy?.name || "Officer"} • {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotice(n);
                            setNoticeModal(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}
                          title="Edit announcement"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Permanently delete "${n.title}"?`)) return;
                            try {
                              await axiosInstance.delete(`/notices/${n._id}`);
                              setNotices((prev) => prev.filter((item) => item._id !== n._id));
                              setNoticeMsg(`Notice "${n.title}" deleted.`);
                            } catch (err) {
                              alert(err.response?.data?.message || "Failed to delete notice");
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid #fca5a5",
                            color: "#dc2626",
                            padding: "4px 8px",
                            fontSize: "0.8rem",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                          title="Delete announcement"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <PostNoticeModal
            isOpen={noticeModal}
            noticeToEdit={editingNotice}
            onClose={() => {
              setNoticeModal(false);
              setEditingNotice(null);
            }}
            onNoticePosted={(n, isEditing) => {
              if (isEditing) {
                setNotices((prev) => prev.map((item) => (item._id === n._id ? n : item)));
                setNoticeMsg(`Notice "${n.title}" updated successfully!`);
              } else {
                setNotices((prev) => [n, ...prev]);
                setNoticeMsg(`Notice "${n.title}" posted successfully!`);
              }
            }}
            onNoticeDeleted={(deletedId) => {
              setNotices((prev) => prev.filter((item) => item._id !== deletedId));
              setNoticeMsg("Notice deleted successfully.");
            }}
          />
        </>
      )}
    </div>
  );
};

export default AdminOverview;
