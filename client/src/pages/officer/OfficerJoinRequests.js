import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import UserAvatar from "../../components/UserAvatar";

const CHAPTER_OPTIONS = ["ALL", "CIS", "CS", "SPS", "WIE"];

const OfficerJoinRequests = ({ isAdmin = false }) => {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [chapterFilter, setChapterFilter] = useState("ALL");
  const [searchQuery, setSearchQuery]   = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg]                   = useState("");

  const loadRequests = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (chapterFilter && chapterFilter !== "ALL") params.append("chapter", chapterFilter);

    const endpoint = isAdmin ? "/admin/join-requests" : "/officer/join-requests";
    axiosInstance
      .get(`${endpoint}?${params.toString()}`)
      .then((r) => setRequests(r.data.data || []))
      .catch((e) => setError(e.response?.data?.message || "Failed to load join requests."))
      .finally(() => setLoading(false));
  }, [statusFilter, chapterFilter, isAdmin]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(id);
    setMsg("");
    try {
      const endpoint = isAdmin ? `/admin/join-requests/${id}` : `/officer/join-requests/${id}`;
      const res = await axiosInstance.patch(endpoint, { status });
      setMsg(res.data.message || `Request ${status} successfully!`);
      // Update local state: remove from pending list or update status
      if (statusFilter === "pending") {
        setRequests((prev) => prev.filter((r) => r._id !== id));
      } else {
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status, reviewedAt: new Date() } : r))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update request.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = r.user?.name?.toLowerCase().includes(q);
    const emailMatch = r.user?.email?.toLowerCase().includes(q);
    const chapterMatch = r.unit?.name?.toLowerCase().includes(q);
    return nameMatch || emailMatch || chapterMatch;
  });

  return (
    <div>
      <div className="dash-page-header">
        <h1>Chapter Join Requests</h1>
        <p>Review and verify IEEE members requesting to join student technical chapters.</p>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 16px",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--sp-md)",
            fontWeight: 600,
          }}
        >
          ✓ {msg}
        </div>
      )}

      {/* Filter Toolbar: Status tabs, Chapter selector, and Search */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: "var(--sp-lg)",
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: 8 }}>
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              className={`btn ${statusFilter === s ? "btn-primary" : "btn-outline"}`}
              onClick={() => setStatusFilter(s)}
              style={{ fontSize: "0.82rem", textTransform: "capitalize", padding: "6px 16px" }}
            >
              {s} Requests
            </button>
          ))}
        </div>

        {/* Right side: Chapter filter & Search */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Chapter Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Chapter:
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {CHAPTER_OPTIONS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChapterFilter(ch)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    border: chapterFilter === ch ? "1px solid var(--navy)" : "1px solid var(--border)",
                    background: chapterFilter === ch ? "var(--navy)" : "#ffffff",
                    color: chapterFilter === ch ? "#ffffff" : "var(--text)",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Search box */}
          <input
            type="text"
            placeholder="Search applicant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "6px 12px",
              fontSize: "0.82rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              width: 170,
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: "var(--radius)" }} />
          ))}
        </div>
      ) : error ? (
        <p
          style={{
            color: "#dc2626",
            padding: "var(--sp-md)",
            background: "#fee2e2",
            borderRadius: "var(--radius-sm)",
          }}
        >
          ⚠️ {error}
        </p>
      ) : filteredRequests.length > 0 ? (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Applicant
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Chapter
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Requested Date
                </th>
                <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Status
                </th>
                {statusFilter === "pending" && (
                  <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", textAlign: "right" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r._id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <UserAvatar
                        src={r.user?.profilePhoto}
                        name={r.user?.name}
                        size={36}
                      />
                      <div>
                        <strong style={{ fontSize: "0.88rem", color: "var(--navy)", display: "block" }}>
                          {r.user?.name || "Member"}
                        </strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {r.user?.email}
                        </span>
                        {r.user?.department && (
                          <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: 6 }}>
                            • {r.user.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        background:
                          r.unit?.name === "CIS"
                            ? "#ffdcc3"
                            : r.unit?.name === "CS"
                            ? "#ccdefe"
                            : r.unit?.name === "SPS"
                            ? "#e2e7ff"
                            : "#dae2fd",
                        color:
                          r.unit?.name === "CIS"
                            ? "#2f1500"
                            : r.unit?.name === "CS"
                            ? "#004976"
                            : r.unit?.name === "SPS"
                            ? "#00629b"
                            : "#414750",
                      }}
                    >
                      {r.unit?.name || "Chapter"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                    {new Date(r.requestedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background:
                          r.status === "approved"
                            ? "#d1fae5"
                            : r.status === "rejected"
                            ? "#fee2e2"
                            : "#fef3c7",
                        color:
                          r.status === "approved"
                            ? "#065f46"
                            : r.status === "rejected"
                            ? "#b91c1c"
                            : "#b45309",
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  {statusFilter === "pending" && (
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleUpdateStatus(r._id, "approved")}
                          disabled={actionLoading === r._id}
                          className="btn btn-primary"
                          style={{
                            fontSize: "0.78rem",
                            padding: "4px 12px",
                            background: "#059669",
                            borderColor: "#059669",
                          }}
                        >
                          {actionLoading === r._id ? "..." : "✓ Approve"}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r._id, "rejected")}
                          disabled={actionLoading === r._id}
                          className="btn btn-outline"
                          style={{
                            fontSize: "0.78rem",
                            padding: "4px 12px",
                            color: "#dc2626",
                            borderColor: "#fca5a5",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🤝</div>
          <h3>No {statusFilter} join requests</h3>
          <p>
            {chapterFilter !== "ALL"
              ? `There are currently no ${statusFilter} requests for IEEE ${chapterFilter} SBC.`
              : `There are currently no requests in the ${statusFilter} category.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default OfficerJoinRequests;
