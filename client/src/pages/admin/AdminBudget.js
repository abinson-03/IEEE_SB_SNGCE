import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axiosInstance";

const STATUS_BADGES = {
  pending:  { bg: "#fef3c7", color: "#b45309", label: "⏳ Pending Review" },
  approved: { bg: "#dcfce7", color: "#15803d", label: "✅ Approved" },
  rejected: { bg: "#fee2e2", color: "#b91c1c", label: "❌ Rejected" },
};

const AdminBudget = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage]     = useState({ text: "", type: "" });

  // Review modal
  const [reviewingProposal, setReviewingProposal] = useState(null);
  const [reviewAction, setReviewAction]           = useState("approved"); // 'approved' | 'rejected'
  const [reviewComment, setReviewComment]         = useState("");
  const [submitting, setSubmitting]               = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/budget-proposals${statusFilter ? `?status=${statusFilter}` : ""}`);
      setProposals(data.data || []);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to load proposals.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleOpenReview = (proposal, action) => {
    setReviewingProposal(proposal);
    setReviewAction(action);
    setReviewComment(action === "approved" ? "Approved within semester budget." : "");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingProposal) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/budget-proposals/${reviewingProposal._id}`, {
        status: reviewAction,
        reviewComment,
      });
      setMessage({ text: `Proposal "${reviewingProposal.title}" has been ${reviewAction}.`, type: "success" });
      setReviewingProposal(null);
      fetchProposals();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Review submission failed.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="dash-page-header">
        <h1>Budget Proposal Review</h1>
        <p>Review and act on fund requests submitted by chapter Treasurers and ExeCom.</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: "var(--sp-lg)" }}>
          {message.text}
          <button style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => setMessage({ text: "", type: "" })}>✕</button>
        </div>
      )}

      {/* Filter */}
      <div className="filter-bar" style={{ marginBottom: "var(--sp-lg)" }}>
        <button
          className={`filter-pill ${statusFilter === "" ? "active" : ""}`}
          onClick={() => setStatusFilter("")}
        >
          All Proposals ({proposals.length})
        </button>
        <button
          className={`filter-pill ${statusFilter === "pending" ? "active" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          ⏳ Pending
        </button>
        <button
          className={`filter-pill ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => setStatusFilter("approved")}
        >
          ✅ Approved
        </button>
        <button
          className={`filter-pill ${statusFilter === "rejected" ? "active" : ""}`}
          onClick={() => setStatusFilter("rejected")}
        >
          ❌ Rejected
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 240, borderRadius: "var(--radius)" }} />
      ) : proposals.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
          {proposals.map((p) => {
            const badge = STATUS_BADGES[p.status] || STATUS_BADGES.pending;
            return (
              <div key={p._id} className="card" style={{ padding: "var(--sp-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)" }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: 6 }}>
                      <span className="badge badge-primary">{p.unit?.name || "SB"}</span>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: "0.78rem",
                          fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", color: "var(--navy)" }}>{p.title}</h3>
                    <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--text)" }}>{p.description || "No description provided."}</p>

                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <span>👤 Submitted by: <strong>{p.submittedBy?.name || "Officer"}</strong></span>
                      <span>📅 Date: {new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>

                    {p.reviewedBy && (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "#f8fafc", borderRadius: "var(--radius)", fontSize: "0.82rem", borderLeft: `3px solid ${badge.color}` }}>
                        Reviewed by <strong>{p.reviewedBy.name}</strong> on {new Date(p.reviewDate).toLocaleDateString("en-IN")}:
                        <div style={{ fontStyle: "italic", marginTop: 2, color: "#475569" }}>"{p.reviewComment || "No comment."}"</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", minWidth: 160 }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)" }}>
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </div>

                    {p.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "6px 14px", fontSize: "0.85rem", background: "#16a34a", borderColor: "#16a34a" }}
                          onClick={() => handleOpenReview(p, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: "6px 14px", fontSize: "0.85rem", color: "#dc2626", borderColor: "#fca5a5" }}
                          onClick={() => handleOpenReview(p, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h3>No budget proposals found</h3>
          <p>No proposals match the current filter.</p>
        </div>
      )}

      {/* Review Modal */}
      {reviewingProposal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: 440, maxWidth: "95vw", padding: "var(--sp-xl)" }}>
            <h3 style={{ margin: "0 0 6px", color: reviewAction === "approved" ? "#16a34a" : "#dc2626" }}>
              {reviewAction === "approved" ? "Approve Budget Proposal" : "Reject Budget Proposal"}
            </h3>
            <p style={{ margin: "0 0 var(--sp-md)", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              {reviewingProposal.title} — <strong>₹{Number(reviewingProposal.amount).toLocaleString("en-IN")}</strong>
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: "var(--sp-lg)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Review Notes / Comments
                </label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Reason or conditions for approval/rejection…"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-sm)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setReviewingProposal(null)} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: reviewAction === "approved" ? "#16a34a" : "#dc2626", borderColor: reviewAction === "approved" ? "#16a34a" : "#dc2626" }}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : `Confirm ${reviewAction === "approved" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBudget;
