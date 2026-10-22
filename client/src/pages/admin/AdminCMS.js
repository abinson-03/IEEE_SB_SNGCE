import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const DUTY_TYPES = [
  { value: "oversight", label: "Oversight (Chair / Advisor - Chapter Overview)" },
  { value: "reporting", label: "Reporting (Secretary - Meeting Minutes / Reports)" },
  { value: "budget",    label: "Budget (Treasurer - Budget Proposals)" },
  { value: "design",    label: "Design (Design Lead / Webmaster - Media & Posters)" },
  { value: "general",   label: "General (Standard Officer Duties)" },
];

const DUTY_BADGES = {
  oversight: { bg: "#eff6ff", color: "#1d4ed8", label: "Oversight" },
  reporting: { bg: "#fdf4ff", color: "#86198f", label: "Reporting" },
  budget:    { bg: "#ecfdf5", color: "#047857", label: "Budget" },
  design:    { bg: "#fff7ed", color: "#c2410c", label: "Design" },
  general:   { bg: "#f1f5f9", color: "#475569", label: "General" },
};

const AdminCMS = () => {
  const { user }                      = useAuth();
  const location                      = useLocation();
  const [units, setUnits]             = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [templates, setTemplates]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState({ text: "", type: "" });

  const isChapterAdmin = user?.globalRole === "chapteradmin";
  const [authorizedUnit, setAuthorizedUnit] = useState(null);

  // Fetch verified authorized unit from backend for chapteradmin
  useEffect(() => {
    if (isChapterAdmin) {
      api.get("/admin/my-authorized-unit")
        .then((r) => {
          if (r.data?.data) {
            setAuthorizedUnit(r.data.data);
            setSelectedUnit(r.data.data._id);
          }
        })
        .catch(() => {});
    }
  }, [isChapterAdmin]);

  // Identify user's authorized chapter unit (never fall back to SB)
  const myChapterUnit = useMemo(() => {
    if (!isChapterAdmin) return null;
    if (authorizedUnit) return authorizedUnit;
    if (units.length === 0) return null;
    // Look up in memberships, strictly matching chapter units
    const found = units.find((u) =>
      u.type === "chapter" &&
      (user?.chapterMemberships || []).some(
        (ch) => (ch._id || ch).toString() === u._id.toString() || (ch.name || ch) === u.name
      )
    );
    if (found) return found;
    // Look up in loaded templates
    if (templates.length > 0 && templates[0]?.unit?._id) {
      return units.find((u) => u._id === templates[0].unit._id) || templates[0].unit;
    }
    // Only pick a chapter unit, never the student branch
    return units.find((u) => u.type === "chapter") || null;
  }, [isChapterAdmin, authorizedUnit, units, user, templates]);

  // When units load or user changes, enforce selectedUnit for chapteradmin or URL param
  useEffect(() => {
    if (isChapterAdmin && myChapterUnit) {
      if (selectedUnit !== myChapterUnit._id) {
        setSelectedUnit(myChapterUnit._id);
      }
    } else if (!isChapterAdmin && !selectedUnit) {
      const queryParams = new URLSearchParams(location.search);
      const urlUnit = queryParams.get("unit");
      if (urlUnit) setSelectedUnit(urlUnit);
    }
  }, [isChapterAdmin, myChapterUnit, selectedUnit, location.search]);

  // Modal states
  const [showModal, setShowModal]     = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData]       = useState({
    positionName: "",
    dutyType: "general",
    unit: "",
    academicYear: "2025-2026",
  });

  // Assign modal state
  const [assigningTemplate, setAssigningTemplate] = useState(null);
  const [selectedUserId, setSelectedUserId]       = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, tRes, aRes, usrRes] = await Promise.all([
        api.get("/units"),
        api.get(`/admin/position-templates?academicYear=${academicYear}${selectedUnit ? `&unit=${selectedUnit}` : ""}`),
        api.get(`/admin/duty-assignments?academicYear=${academicYear}${selectedUnit ? `&unit=${selectedUnit}` : ""}`),
        api.get("/admin/users?limit=100"),
      ]);

      setUnits(uRes.data.data || []);
      setTemplates(tRes.data.data || []);
      setAssignments(aRes.data.data || []);
      setUsers(usrRes.data.data || []);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to load data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, academicYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map templateId -> active assignment
  const assignmentMap = {};
  assignments.forEach((a) => {
    if (a.positionTemplate?._id) {
      assignmentMap[a.positionTemplate._id] = a;
    }
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      positionName: "",
      dutyType: "general",
      unit: (isChapterAdmin && myChapterUnit ? myChapterUnit._id : selectedUnit) || (units.find(u => u.type === "chapter")?._id || units[0]?._id || ""),
      academicYear,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemplate(t);
    setFormData({
      positionName: t.positionName,
      dutyType: t.dutyType || "general",
      unit: t.unit?._id || t.unit,
      academicYear: t.academicYear,
    });
    setShowModal(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/admin/position-templates/${editingTemplate._id}`, formData);
        setMessage({ text: `Updated "${formData.positionName}".`, type: "success" });
      } else {
        await api.post("/admin/position-templates", formData);
        setMessage({ text: `Created "${formData.positionName}".`, type: "success" });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Operation failed.", type: "error" });
    }
  };

  const handleArchiveTemplate = async (templateId, name) => {
    if (!window.confirm(`Archive position "${name}"? It will be removed from the active roster.`)) return;
    try {
      await api.delete(`/admin/position-templates/${templateId}`);
      setMessage({ text: `Archived "${name}".`, type: "success" });
      fetchData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to archive.", type: "error" });
    }
  };

  const handleOpenAssign = (template) => {
    setAssigningTemplate(template);
    const existing = assignmentMap[template._id];
    setSelectedUserId(existing?.user?._id || "");
  };

  const handleSaveAssignment = async () => {
    if (!assigningTemplate) return;
    try {
      await api.post("/admin/duty-assignments", {
        positionTemplateId: assigningTemplate._id,
        userId: selectedUserId || null,
      });
      setMessage({ text: selectedUserId ? "Member assigned successfully." : "Position vacated.", type: "success" });
      setAssigningTemplate(null);
      fetchData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to update assignment.", type: "error" });
    }
  };

  const handleVacate = async (assignmentId) => {
    if (!window.confirm("Vacate this position?")) return;
    try {
      await api.patch(`/admin/duty-assignments/${assignmentId}`, { action: "vacate" });
      setMessage({ text: "Position vacated.", type: "success" });
      fetchData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to vacate.", type: "error" });
    }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="dash-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)" }}>
        <div>
          <h1>Position Template Manager</h1>
          <p>Configure chapter positions and assign ExeCom duty workflows for the academic year.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ Add Position
        </button>
      </div>

      {/* ── Notification Banner ── */}
      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: "var(--sp-lg)" }}>
          {message.text}
          <button style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => setMessage({ text: "", type: "" })}>✕</button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="filter-bar" style={{ display: "flex", gap: "var(--sp-md)", flexWrap: "wrap", marginBottom: "var(--sp-lg)", alignItems: "center" }}>
        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Chapter / Unit</label>
          {isChapterAdmin ? (
            <div
              style={{
                padding: "8px 14px",
                background: "#e0f2fe",
                color: "#0369a1",
                borderRadius: "var(--radius-sm)",
                fontWeight: 700,
                fontSize: "0.88rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #bae6fd",
              }}
            >
              🔒 {myChapterUnit?.name || "Your Chapter"} (Faculty ExeCom Authority)
            </div>
          ) : (
            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
              <option value="">All Units (SB + Chapters)</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>{u.name} — {u.type === "branch" ? "Parent Branch" : "Chapter"}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Academic Year</label>
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
      </div>

      {/* ── Table / Cards ── */}
      {loading ? (
        <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius)" }} />
      ) : templates.length > 0 ? (
        <div className="card">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Position Name</th>
                  <th>Unit</th>
                  <th>Duty Workflow Type</th>
                  <th>Assigned Officer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const assign = assignmentMap[t._id];
                  const hasUser = assign?.status === "active" && assign?.user;
                  const dutyBadge = DUTY_BADGES[t.dutyType] || DUTY_BADGES.general;

                  return (
                    <tr key={t._id}>
                      <td>
                        <strong>{t.positionName}</strong>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>AY {t.academicYear}</div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{t.unit?.name || "—"}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: dutyBadge.bg,
                            color: dutyBadge.color,
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            display: "inline-block",
                          }}
                        >
                          {dutyBadge.label}
                        </span>
                      </td>
                      <td>
                        {hasUser ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--navy)" }}>{assign.user.name}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{assign.user.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.85rem" }}>Vacant / Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                            onClick={() => handleOpenAssign(t)}
                          >
                            {hasUser ? "🔄 Reassign" : "👤 Assign"}
                          </button>
                          {hasUser && (
                            <button
                              className="btn btn-outline"
                              style={{ padding: "4px 8px", fontSize: "0.8rem", color: "#dc2626", borderColor: "#fca5a5" }}
                              onClick={() => handleVacate(assign._id)}
                            >
                              Vacate
                            </button>
                          )}
                          <button
                            className="btn btn-outline"
                            style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                            onClick={() => handleOpenEdit(t)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "4px 8px", fontSize: "0.8rem", color: "#94a3b8" }}
                            onClick={() => handleArchiveTemplate(t._id, t.positionName)}
                            title="Archive Position"
                          >
                            📦
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No positions found</h3>
          <p>No position templates exist for this filter. Click "Add Position" above to create one.</p>
        </div>
      )}

      {/* ── Create / Edit Position Modal ── */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: 480, maxWidth: "95vw", padding: "var(--sp-xl)", position: "relative" }}>
            <h3 style={{ margin: "0 0 var(--sp-md)", color: "var(--navy)" }}>
              {editingTemplate ? "Edit Position Template" : "New Position Template"}
            </h3>

            <form onSubmit={handleSaveTemplate}>
              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Position Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chair, Secretary, Treasurer, Design Lead"
                  value={formData.positionName}
                  onChange={(e) => setFormData({ ...formData, positionName: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Chapter / Unit *</label>
                <select
                  required
                  disabled={!!editingTemplate || isChapterAdmin}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.type})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Duty Workflow Type *
                </label>
                <select
                  value={formData.dutyType}
                  onChange={(e) => setFormData({ ...formData, dutyType: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                >
                  {DUTY_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Determines what action cards the officer sees on their "My Duties" page.
                </p>
              </div>

              <div style={{ marginBottom: "var(--sp-lg)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Academic Year *</label>
                <input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-sm)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTemplate ? "Save Changes" : "Create Position"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Officer Modal ── */}
      {assigningTemplate && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: 440, maxWidth: "95vw", padding: "var(--sp-xl)" }}>
            <h3 style={{ margin: "0 0 6px", color: "var(--navy)" }}>Assign Officer</h3>
            <p style={{ margin: "0 0 var(--sp-md)", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              Assigning for: <strong>{assigningTemplate.positionName}</strong> ({assigningTemplate.unit?.name})
            </p>

            <div style={{ marginBottom: "var(--sp-lg)" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Select Member</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
              >
                <option value="">— Vacant / No Assignment —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email}) [{u.globalRole}]</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-sm)" }}>
              <button className="btn btn-outline" onClick={() => setAssigningTemplate(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveAssignment}>Save Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCMS;
