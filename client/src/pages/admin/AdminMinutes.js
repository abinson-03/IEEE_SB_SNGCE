import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axiosInstance";

const AdminMinutes = () => {
  const [minutes, setMinutes]       = useState([]);
  const [units, setUnits]           = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [msg, setMsg]               = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    unit: "",
    content: "",
    attendees: "",
  });

  const fetchMinutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUnit) params.set("unit", selectedUnit);
      if (search) params.set("search", search);

      const [mRes, uRes] = await Promise.all([
        api.get(`/minutes?${params.toString()}`),
        api.get("/units"),
      ]);
      setMinutes(mRes.data.data || []);
      setUnits(uRes.data.data || []);
      if (!formData.unit && uRes.data.data?.length > 0) {
        setFormData((prev) => ({ ...prev, unit: uRes.data.data[0]._id }));
      }
    } catch {
      setMinutes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMinutes();
  }, [fetchMinutes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/minutes", formData);
      setMsg({ text: "Meeting minute recorded successfully in digital archive.", type: "success" });
      setShowModal(false);
      setFormData({
        title: "",
        date: new Date().toISOString().split("T")[0],
        unit: units[0]?._id || "",
        content: "",
        attendees: "",
      });
      fetchMinutes();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Failed to record minutes.", type: "error" });
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete meeting minute "${title}"?`)) return;
    try {
      await api.delete(`/minutes/${id}`);
      setMsg({ text: "Meeting minute deleted.", type: "success" });
      fetchMinutes();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Failed to delete.", type: "error" });
    }
  };

  return (
    <div>
      <div className="dash-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)" }}>
        <div>
          <h1>Digital Meeting Minutes Archive</h1>
          <p>Official repository of chapter ExeCom meetings, general body discussions, and secretary reports.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Record Meeting Minutes
        </button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: "var(--sp-md)" }}>
          {msg.text}
          <button style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => setMsg({ text: "", type: "" })}>✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: "var(--sp-lg)", display: "flex", gap: "var(--sp-md)", flexWrap: "wrap" }}>
        <input
          placeholder="Search minutes by title or keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "0.5rem 0.9rem", border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-full)", fontFamily: "inherit", fontSize: "0.88rem", minWidth: 260 }}
        />
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          style={{ padding: "0.5rem 0.9rem", border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-full)", fontFamily: "inherit", fontSize: "0.88rem" }}
        >
          <option value="">All Chapters & SB</option>
          {units.map((u) => <option key={u._id} value={u._id}>{u.name} Chapter</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius)" }} />
      ) : minutes.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
          {minutes.map((m) => (
            <div key={m._id} className="card" style={{ padding: "var(--sp-lg)", borderLeft: "4px solid #86198f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span className="badge badge-primary">{m.unit?.name || "SB"}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      📅 {new Date(m.date).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", color: "var(--navy)" }}>{m.title}</h3>
                  <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "#334155", whiteSpace: "pre-line" }}>
                    {m.content}
                  </p>

                  {m.attendees && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 }}>
                      👥 <strong>Attendees:</strong> {m.attendees}
                    </div>
                  )}

                  <div style={{ fontSize: "0.76rem", color: "var(--text-light)", marginTop: 8 }}>
                    Recorded by {m.submittedBy?.name || "Secretary"} on {new Date(m.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>

                <button
                  className="btn btn-outline"
                  style={{ padding: "4px 8px", fontSize: "0.8rem", color: "#dc2626", borderColor: "#fca5a5" }}
                  onClick={() => handleDelete(m._id, m.title)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No meeting minutes recorded</h3>
          <p>Secretary reports and chapter meeting minutes will appear here.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: 500, maxWidth: "95vw", padding: "var(--sp-xl)" }}>
            <h3 style={{ margin: "0 0 var(--sp-md)", color: "var(--navy)" }}>Record Meeting Minutes</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CIS ExeCom Monthly Planning & Workshop Agenda"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)", marginBottom: "var(--sp-md)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Meeting Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Chapter / Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                  >
                    {units.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Attendees (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Chair, Vice Chair, Secretary, Webmaster (4 present)"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-lg)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Minutes & Discussion Points *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Record agenda items, decisions taken, and action items assigned…"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-sm)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: "#86198f", borderColor: "#86198f" }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMinutes;
