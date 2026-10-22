import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import PostNoticeModal from "../../components/PostNoticeModal";

const OfficerDuties = () => {
  const navigate = useNavigate();
  const [duties, setDuties]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [noticeModal, setNoticeModal]   = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [notices, setNotices]           = useState([]);

  const loadNotices = useCallback(() => {
    axiosInstance.get("/notices/public?limit=10")
      .then((r) => setNotices(r.data.data || []))
      .catch(() => setNotices([]));
  }, []);

  // Oversight state
  const [oversightData, setOversightData] = useState(null);
  const [loadingOversight, setLoadingOversight] = useState(false);

  // Budget state (Treasurer)
  const [budgetList, setBudgetList]       = useState([]);
  const [budgetForm, setBudgetForm]       = useState({ title: "", amount: "", description: "" });
  const [submittingBudget, setSubmittingBudget] = useState(false);
  const [budgetMsg, setBudgetMsg]         = useState({ text: "", type: "" });

  const fetchDuties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/officer/my-duties");
      const data = res.data.data || [];
      setDuties(data);
      if (data.length > 0) {
        setSelectedDuty(data[0]);
      }
    } catch {
      setDuties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuties();
    loadNotices();
  }, [fetchDuties, loadNotices]);

  // Load duty-specific content when selected duty changes
  const loadDutyDetails = useCallback(async (duty) => {
    if (!duty) return;

    if (duty.dutyType === "oversight" && duty.unitId) {
      setLoadingOversight(true);
      try {
        const res = await axiosInstance.get(`/officer/chapter-overview?unitId=${duty.unitId}`);
        setOversightData(res.data.data || null);
      } catch {
        setOversightData(null);
      } finally {
        setLoadingOversight(false);
      }
    }

    if (duty.dutyType === "budget") {
      try {
        const res = await axiosInstance.get("/officer/budget-proposals");
        setBudgetList(res.data.data || []);
      } catch {
        setBudgetList([]);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDuty) {
      loadDutyDetails(selectedDuty);
    }
  }, [selectedDuty, loadDutyDetails]);

  // Handle Budget Proposal Submission
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDuty?.unitId) {
      setBudgetMsg({ text: "No chapter unit associated with this duty.", type: "error" });
      return;
    }
    setSubmittingBudget(true);
    setBudgetMsg({ text: "", type: "" });
    try {
      await axiosInstance.post("/officer/budget-proposals", {
        unit: selectedDuty.unitId,
        title: budgetForm.title,
        amount: Number(budgetForm.amount),
        description: budgetForm.description,
      });
      setBudgetMsg({ text: "Budget proposal submitted successfully for Super Admin review!", type: "success" });
      setBudgetForm({ title: "", amount: "", description: "" });
      // Refresh list
      const res = await axiosInstance.get("/officer/budget-proposals");
      setBudgetList(res.data.data || []);
    } catch (err) {
      setBudgetMsg({ text: err.response?.data?.message || "Failed to submit proposal.", type: "error" });
    } finally {
      setSubmittingBudget(false);
    }
  };

  const getDutyTypePill = (type) => {
    const map = {
      oversight: { bg: "#eff6ff", color: "#1d4ed8", label: "Chapter Oversight" },
      reporting: { bg: "#fdf4ff", color: "#86198f", label: "Reporting Workflow" },
      budget:    { bg: "#ecfdf5", color: "#047857", label: "Budget & Finance" },
      design:    { bg: "#fff7ed", color: "#c2410c", label: "Design & Media" },
      general:   { bg: "#f1f5f9", color: "#475569", label: "General Officer" },
    };
    const pill = map[type] || map.general;
    return (
      <span style={{ background: pill.bg, color: pill.color, padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700 }}>
        {pill.label}
      </span>
    );
  };

  return (
    <div>
      <div className="dash-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>My Duties</h1>
          <p>Your active chapter positions and position-specific action workflows.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingNotice(null);
            setNoticeModal(true);
          }}
          className="btn btn-outline"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}
        >
          📢 Post Announcement
        </button>
      </div>

      {notices.length > 0 && (
        <div className="card" style={{ padding: "var(--sp-md) var(--sp-lg)", marginBottom: "var(--sp-lg)", background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>
              📢 Active Public Announcements ({notices.length})
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Click Edit to modify or pin
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notices.slice(0, 3).map((n) => (
              <div
                key={n._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 12px",
                  background: "#fff",
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  fontSize: "0.84rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {n.pinned && <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#ffdcc3", color: "#2f1500", padding: "1px 5px", borderRadius: 3 }}>PINNED</span>}
                  <strong style={{ color: "var(--navy)" }}>{n.title}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>— {n.body.substring(0, 60)}...</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNotice(n);
                      setNoticeModal(true);
                    }}
                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "2px 8px", cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${n.title}"?`)) return;
                      try {
                        await axiosInstance.delete(`/notices/${n._id}`);
                        setNotices((prev) => prev.filter((item) => item._id !== n._id));
                      } catch (err) {
                        alert(err.response?.data?.message || "Failed to delete notice");
                      }
                    }}
                    style={{ background: "none", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 3, padding: "2px 6px", cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          } else {
            setNotices((prev) => [n, ...prev]);
          }
        }}
        onNoticeDeleted={(deletedId) => {
          setNotices((prev) => prev.filter((item) => item._id !== deletedId));
        }}
      />

      {loading ? (
        <div className="skeleton" style={{ height: 180, borderRadius: "var(--radius)" }} />
      ) : duties.length > 0 ? (
        <div>
          {/* ── Position Selection Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--sp-md)", marginBottom: "var(--sp-xl)" }}>
            {duties.map((d) => {
              const isSelected = selectedDuty?.assignmentId === d.assignmentId;
              return (
                <div
                  key={d.assignmentId}
                  className="card"
                  onClick={() => setSelectedDuty(d)}
                  style={{
                    cursor: "pointer",
                    padding: "var(--sp-lg)",
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                    backgroundColor: isSelected ? "#f8fafc" : "var(--bg)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="badge badge-primary">{d.unit}</span>
                    {getDutyTypePill(d.dutyType)}
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", margin: "0 0 4px" }}>
                    {d.positionName}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 6px" }}>AY {d.academicYear}</p>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-light)" }}>
                    Assigned {new Date(d.assignedAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Position-Specific Action Workflow Section ── */}
          {selectedDuty && (
            <div style={{ marginTop: "var(--sp-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--sp-md)" }}>
                <h2 style={{ fontSize: "1.25rem", color: "var(--navy)", margin: 0 }}>
                  Active Workflow: {selectedDuty.positionName} ({selectedDuty.unit})
                </h2>
                {getDutyTypePill(selectedDuty.dutyType)}
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* 1. OVERSIGHT WORKFLOW (Chair / Advisor)                    */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedDuty.dutyType === "oversight" && (
                <div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "var(--sp-lg)" }}>
                    Full chapter executive overview: monitor all events, active officer duty assignments, and budget requests for {selectedDuty.unit}.
                  </p>

                  {loadingOversight ? (
                    <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius)" }} />
                  ) : oversightData ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-xl)" }}>
                      {/* Chapter Duty Roster */}
                      <div className="card" style={{ padding: "var(--sp-lg)" }}>
                        <h3 style={{ margin: "0 0 var(--sp-md)", color: "var(--navy)", fontSize: "1.05rem" }}>
                          👥 {selectedDuty.unit} Executive Committee Roster
                        </h3>
                        <div className="dash-table-wrap">
                          <table className="dash-table">
                            <thead>
                              <tr>
                                <th>Position</th>
                                <th>Assigned Member</th>
                                <th>Duty Type</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {oversightData.dutyAssignments?.length > 0 ? (
                                oversightData.dutyAssignments.map((a) => (
                                  <tr key={a._id}>
                                    <td><strong>{a.positionName}</strong></td>
                                    <td>{a.user ? `${a.user.name} (${a.user.email})` : <span style={{ fontStyle: "italic", color: "#94a3b8" }}>Vacant</span>}</td>
                                    <td>{getDutyTypePill(a.dutyType)}</td>
                                    <td><span className="badge badge-primary">{a.status}</span></td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)" }}>No duty assignments found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Chapter Events & Attendance */}
                      <div className="card" style={{ padding: "var(--sp-lg)" }}>
                        <h3 style={{ margin: "0 0 var(--sp-md)", color: "var(--navy)", fontSize: "1.05rem" }}>
                          🗓️ {selectedDuty.unit} Chapter Events Overview
                        </h3>
                        <div className="dash-table-wrap">
                          <table className="dash-table">
                            <thead>
                              <tr>
                                <th>Event Title</th>
                                <th>Date</th>
                                <th>Venue</th>
                                <th>Status</th>
                                <th>Checked-in Attendees</th>
                              </tr>
                            </thead>
                            <tbody>
                              {oversightData.events?.length > 0 ? (
                                oversightData.events.map((ev) => (
                                  <tr key={ev._id}>
                                    <td><strong>{ev.title}</strong></td>
                                    <td style={{ fontSize: "0.82rem" }}>{new Date(ev.date).toLocaleDateString("en-IN")}</td>
                                    <td>{ev.venue || "—"}</td>
                                    <td><span className="badge badge-primary">{ev.status}</span></td>
                                    <td><strong>{ev.attendeeCount}</strong> attended</td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>No events recorded for this chapter.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Chapter Budget Proposals */}
                      <div className="card" style={{ padding: "var(--sp-lg)" }}>
                        <h3 style={{ margin: "0 0 var(--sp-md)", color: "var(--navy)", fontSize: "1.05rem" }}>
                          💰 Chapter Budget Proposals
                        </h3>
                        <div className="dash-table-wrap">
                          <table className="dash-table">
                            <thead>
                              <tr>
                                <th>Proposal</th>
                                <th>Amount</th>
                                <th>Submitted By</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {oversightData.budgetProposals?.length > 0 ? (
                                oversightData.budgetProposals.map((bp) => (
                                  <tr key={bp._id}>
                                    <td>
                                      <strong>{bp.title}</strong>
                                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{bp.description}</div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>₹{Number(bp.amount).toLocaleString("en-IN")}</td>
                                    <td>{bp.submittedBy?.name || "Officer"}</td>
                                    <td>
                                      <span
                                        style={{
                                          background: bp.status === "approved" ? "#dcfce7" : bp.status === "rejected" ? "#fee2e2" : "#fef3c7",
                                          color: bp.status === "approved" ? "#15803d" : bp.status === "rejected" ? "#b91c1c" : "#b45309",
                                          padding: "2px 8px",
                                          borderRadius: 999,
                                          fontSize: "0.78rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {bp.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)" }}>No budget proposals submitted.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 2. REPORTING WORKFLOW (Secretary)                         */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedDuty.dutyType === "reporting" && (
                <div className="card" style={{ padding: "var(--sp-xl)", borderLeft: "4px solid #86198f" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "var(--sp-sm)" }}>📝</div>
                  <h3 style={{ margin: "0 0 6px", color: "#86198f" }}>Secretary Reporting & Meeting Minutes</h3>
                  <p style={{ margin: "0 0 var(--sp-md)", fontSize: "0.92rem", color: "var(--text)" }}>
                    As <strong>{selectedDuty.positionName}</strong> of <strong>{selectedDuty.unit}</strong>, you are responsible for chapter documentation, officer meeting minutes, and annual reporting submission.
                  </p>

                  <div style={{ background: "#fdf4ff", border: "1px solid #f5d0fe", padding: "var(--sp-md)", borderRadius: "var(--radius)", marginBottom: "var(--sp-lg)" }}>
                    <h4 style={{ margin: "0 0 6px", color: "#86198f", fontSize: "0.95rem" }}>📌 Action Items:</h4>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.88rem", lineHeight: 1.6, color: "#4a044e" }}>
                      <li>Record meeting attendance and decisions in chapter log.</li>
                      <li>Export completed event attendance sheets for chapter records.</li>
                      <li>Meeting Minutes Archive & Annual Report Generator available in Part B.</li>
                    </ul>
                  </div>

                  <button className="btn btn-primary" style={{ background: "#86198f", borderColor: "#86198f" }} onClick={() => navigate("/officer/minutes")}>
                    📁 Open Meeting Minutes Archive & Submit Report
                  </button>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 3. BUDGET WORKFLOW (Treasurer)                            */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedDuty.dutyType === "budget" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-xl)" }}>
                  {/* Budget Proposal Form */}
                  <div className="card" style={{ padding: "var(--sp-xl)", borderTop: "4px solid #047857" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--sp-md)" }}>
                      <span style={{ fontSize: "1.8rem" }}>💰</span>
                      <div>
                        <h3 style={{ margin: 0, color: "var(--navy)" }}>Request Chapter Budget Allocation</h3>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          Submit fund requirements for workshops, kits, or event expenses for Super Admin review.
                        </p>
                      </div>
                    </div>

                    {budgetMsg.text && (
                      <div className={`alert alert-${budgetMsg.type}`} style={{ marginBottom: "var(--sp-md)" }}>
                        {budgetMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleBudgetSubmit}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--sp-md)", marginBottom: "var(--sp-md)" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Proposal Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Workshop Hardware Kits & Cloud Credits"
                            value={budgetForm.title}
                            onChange={(e) => setBudgetForm({ ...budgetForm, title: e.target.value })}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Requested Amount (₹) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="5000"
                            value={budgetForm.amount}
                            onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: "var(--sp-lg)" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Description / Purpose</label>
                        <textarea
                          rows="3"
                          placeholder="Provide breakdown of expenses and purpose of funds…"
                          value={budgetForm.description}
                          onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ background: "#047857", borderColor: "#047857" }}
                        disabled={submittingBudget}
                      >
                        {submittingBudget ? "Submitting…" : "📤 Submit Proposal for Review"}
                      </button>
                    </form>
                  </div>

                  {/* My Submitted Proposals */}
                  <div className="card" style={{ padding: "var(--sp-lg)" }}>
                    <h3 style={{ margin: "0 0 var(--sp-md)", color: "var(--navy)", fontSize: "1.05rem" }}>
                      📋 My Submitted Budget Proposals
                    </h3>
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Title & Description</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Reviewer Note</th>
                            <th>Submitted On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgetList.length > 0 ? (
                            budgetList.map((bp) => (
                              <tr key={bp._id}>
                                <td>
                                  <strong>{bp.title}</strong>
                                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{bp.description || "—"}</div>
                                </td>
                                <td style={{ fontWeight: 700, color: "var(--navy)" }}>₹{Number(bp.amount).toLocaleString("en-IN")}</td>
                                <td>
                                  <span
                                    style={{
                                      background: bp.status === "approved" ? "#dcfce7" : bp.status === "rejected" ? "#fee2e2" : "#fef3c7",
                                      color: bp.status === "approved" ? "#15803d" : bp.status === "rejected" ? "#b91c1c" : "#b45309",
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {bp.status}
                                  </span>
                                </td>
                                <td style={{ fontSize: "0.82rem", color: "#475569" }}>
                                  {bp.reviewComment ? `"${bp.reviewComment}"` : "Pending review"}
                                </td>
                                <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  {new Date(bp.createdAt).toLocaleDateString("en-IN")}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>No budget proposals submitted yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 4. DESIGN WORKFLOW (Design Lead / Webmaster)               */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedDuty.dutyType === "design" && (
                <div className="card" style={{ padding: "var(--sp-xl)", borderLeft: "4px solid #c2410c" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "var(--sp-sm)" }}>🎨</div>
                  <h3 style={{ margin: "0 0 6px", color: "#c2410c" }}>Design & Media Release Hub</h3>
                  <p style={{ margin: "0 0 var(--sp-md)", fontSize: "0.92rem", color: "var(--text)" }}>
                    As <strong>{selectedDuty.positionName}</strong> of <strong>{selectedDuty.unit}</strong>, you manage promotional creatives, event posters, social media banners, and portal branding.
                  </p>

                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "var(--sp-md)", borderRadius: "var(--radius)", marginBottom: "var(--sp-lg)" }}>
                    <h4 style={{ margin: "0 0 6px", color: "#c2410c", fontSize: "0.95rem" }}>📌 Media Checklist:</h4>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.88rem", lineHeight: 1.6, color: "#7c2d12" }}>
                      <li>Use standard IEEE-blue (#00629B) & SNGCE branding in all official event banners.</li>
                      <li>Upload high-resolution event brochures for public events view.</li>
                      <li>Poster Release Log & Gallery upload shortcuts available in Part B.</li>
                    </ul>
                  </div>

                  <button className="btn btn-primary" style={{ background: "#c2410c", borderColor: "#c2410c" }} onClick={() => navigate("/officer/posters")}>
                    🖼️ Open Poster & Media Release Hub
                  </button>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* 5. GENERAL WORKFLOW                                        */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedDuty.dutyType === "general" && (
                <div className="card" style={{ padding: "var(--sp-lg)" }}>
                  <h3 style={{ margin: "0 0 6px", color: "var(--navy)" }}>Standard ExeCom Duties</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    You are an active ExeCom officer for <strong>{selectedDuty.unit}</strong>. Coordinate with the Chapter Chair and Vice Chair for ongoing event execution and member engagements.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎖️</div>
          <h3>No active duties</h3>
          <p>You have no active position assignments for this term. Contact the Super Admin to get assigned.</p>
        </div>
      )}
    </div>
  );
};

export default OfficerDuties;
