import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../../components/UserAvatar";

const PRIORITY_BADGES = {
  high:   { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5", label: "High Priority" },
  medium: { bg: "#fef3c7", color: "#b45309", border: "#fcd34d", label: "Medium Priority" },
  low:    { bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc", label: "Low Priority" },
};

const OfficerTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filterTab, setFilterTab] = useState("pending"); // "all" | "pending" | "done"

  // Oversight permission state
  const [canCreate, setCanCreate]   = useState(false);
  const [oversightUnits, setOversightUnits] = useState([]);
  const [candidateUsers, setCandidateUsers] = useState([]);

  // Modal / Form state
  const [showModal, setShowModal]   = useState(false);
  const [formData, setFormData]     = useState({
    unit: "",
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  const loadTasks = () => {
    setLoading(true);
    axiosInstance.get("/officer/tasks")
      .then((r) => setTasks(r.data.data || []))
      .catch((e) => setError(e.response?.data?.message || "Failed to load tasks."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();

    // Check oversight permissions and fetch chapters
    axiosInstance.get("/officer/my-duties")
      .then((r) => {
        const duties = r.data.data || [];
        const oversight = duties.filter((d) => d.dutyType === "oversight");
        const isSuper = user?.globalRole === "superadmin";

        if (isSuper || oversight.length > 0 || user?.globalRole === "chapteradmin") {
          setCanCreate(true);
          // Fetch all units if superadmin, or managed units
          axiosInstance.get("/units").then((uRes) => {
            const allUnits = uRes.data.data || [];
            if (isSuper) {
              setOversightUnits(allUnits);
              if (allUnits.length > 0) setFormData((f) => ({ ...f, unit: allUnits[0]._id }));
            } else {
              const matched = allUnits.filter(
                (u) =>
                  oversight.some((o) => o.unitId?.toString() === u._id?.toString() || o.unit === u.name) ||
                  user?.chapterMemberships?.some((m) => (m._id || m) === u._id)
              );
              setOversightUnits(matched);
              if (matched.length > 0) setFormData((f) => ({ ...f, unit: matched[0]._id }));
            }
          }).catch(() => {});
        }
      })
      .catch(() => {});

    // Load directory users for assignment dropdown
    axiosInstance.get("/directory")
      .then((r) => {
        setCandidateUsers(r.data.data || []);
        if (r.data.data?.length > 0) {
          setFormData((f) => ({ ...f, assignedTo: r.data.data[0].id }));
        }
      })
      .catch(() => {});
  }, [user]);

  // Toggle task status
  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === "done" ? "pending" : "done";
    try {
      const res = await axiosInstance.patch(`/officer/tasks/${task._id}/status`, {
        status: nextStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? res.data.data : t))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update task status.");
    }
  };

  // Submit new task
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!formData.unit || !formData.title || !formData.assignedTo) {
      setFormError("Unit, title, and assigned officer are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await axiosInstance.post("/officer/tasks", formData);
      setTasks((prev) => [res.data.data, ...prev]);
      setShowModal(false);
      setFormData((f) => ({
        ...f,
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
      }));
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const doneCount    = tasks.filter((t) => t.status === "done").length;

  const filteredTasks = tasks.filter((t) => {
    if (filterTab === "pending") return t.status === "pending";
    if (filterTab === "done")    return t.status === "done";
    return true;
  });

  return (
    <div>
      <div className="dash-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)" }}>
        <div>
          <h1>Officer Task List</h1>
          <p>Track your assigned chapter duties, deadlines, and milestones.</p>
        </div>

        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            ➕ Assign New Task
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: "flex", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)", flexWrap: "wrap" }}>
        <button
          onClick={() => setFilterTab("pending")}
          className={`card ${filterTab === "pending" ? "active-tab" : ""}`}
          style={{
            flex: "1 1 180px",
            padding: "16px 20px",
            textAlign: "left",
            border: filterTab === "pending" ? "2px solid #00629B" : "1px solid var(--border)",
            background: filterTab === "pending" ? "#f0f7ff" : "#fff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Pending Tasks
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309", marginTop: 4 }}>
            {pendingCount}
          </div>
        </button>

        <button
          onClick={() => setFilterTab("done")}
          className={`card ${filterTab === "done" ? "active-tab" : ""}`}
          style={{
            flex: "1 1 180px",
            padding: "16px 20px",
            textAlign: "left",
            border: filterTab === "done" ? "2px solid #059669" : "1px solid var(--border)",
            background: filterTab === "done" ? "#f0fdf4" : "#fff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Completed Tasks
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {doneCount}
          </div>
        </button>

        <button
          onClick={() => setFilterTab("all")}
          className={`card ${filterTab === "all" ? "active-tab" : ""}`}
          style={{
            flex: "1 1 180px",
            padding: "16px 20px",
            textAlign: "left",
            border: filterTab === "all" ? "2px solid #1a2744" : "1px solid var(--border)",
            background: filterTab === "all" ? "#f8fafc" : "#fff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            All My Tasks
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--navy)", marginTop: 4 }}>
            {tasks.length}
          </div>
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--radius)" }} />
          ))}
        </div>
      ) : error ? (
        <p style={{ color: "#dc2626", padding: "var(--sp-md)", background: "#fee2e2", borderRadius: "var(--radius-sm)" }}>
          ⚠️ {error}
        </p>
      ) : filteredTasks.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
          {filteredTasks.map((t) => {
            const pStyle = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;
            const isDone = t.status === "done";
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !isDone;

            return (
              <div
                key={t._id}
                className="card"
                style={{
                  padding: "var(--sp-md) var(--sp-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "var(--sp-md)",
                  borderLeft: `5px solid ${isDone ? "#10b981" : isOverdue ? "#dc2626" : "#00629B"}`,
                  background: isDone ? "#fafafa" : "#fff",
                  opacity: isDone ? 0.85 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: "1 1 300px" }}>
                  {/* Quick Checkbox button */}
                  <button
                    onClick={() => handleToggleStatus(t)}
                    title={isDone ? "Mark as Pending" : "Mark as Done"}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `2px solid ${isDone ? "#10b981" : "var(--border)"}`,
                      background: isDone ? "#10b981" : "#fff",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? "✓" : ""}
                  </button>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          background: pStyle.bg,
                          color: pStyle.color,
                          border: `1px solid ${pStyle.border}`,
                          textTransform: "uppercase",
                        }}
                      >
                        {pStyle.label}
                      </span>

                      {t.unit?.name && (
                        <span className="badge badge-accent" style={{ fontSize: "0.72rem" }}>
                          {t.unit.name}
                        </span>
                      )}

                      {isOverdue && (
                        <span style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 700 }}>
                          ⚠️ Overdue
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        color: isDone ? "var(--text-muted)" : "var(--navy)",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {t.title}
                    </h3>

                    {t.description && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "var(--text-muted)" }}>
                        {t.description}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 6, flexWrap: "wrap" }}>
                      {t.dueDate && (
                        <span>
                          📅 Due: <strong>{new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                        </span>
                      )}
                      {t.createdBy?.name && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <UserAvatar src={t.createdBy?.profilePhoto} name={t.createdBy.name} size={18} />
                          Assigned by: <em>{t.createdBy.name}</em>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right action button */}
                <div>
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`btn ${isDone ? "btn-outline" : "btn-primary"}`}
                    style={{ fontSize: "0.82rem", padding: "6px 14px" }}
                  >
                    {isDone ? "↩ Mark Pending" : "✓ Mark as Done"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No {filterTab} tasks found</h3>
          <p>You have no tasks matching this status filter.</p>
        </div>
      )}

      {/* Task Creation Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
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
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "var(--sp-xl)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)" }}>
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--navy)" }}>
                Assign New Officer Task
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: "8px 12px", background: "#fee2e2", color: "#dc2626", borderRadius: 4, marginBottom: "var(--sp-md)", fontSize: "0.85rem" }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitTask}>
              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                  Chapter / Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--border)" }}
                >
                  {oversightUnits.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} — {u.type === "branch" ? "Student Branch" : "Chapter"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prepare Annual Chapter Activity Report"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  placeholder="Provide context, required deliverables or instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                  Assign To *
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--border)" }}
                >
                  {candidateUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.globalRole})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--border)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--border)" }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerTasks;
