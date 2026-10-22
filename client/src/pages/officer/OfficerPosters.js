import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { getMediaUrl } from "../../utils/mediaUtils";

const OfficerPosters = () => {
  const { user } = useAuth();
  const [posters, setPosters]           = useState([]);
  const [units, setUnits]               = useState([]);
  const [duties, setDuties]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [msg, setMsg]                   = useState({ text: "", type: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [filterUnit, setFilterUnit]     = useState("All");

  const [formData, setFormData] = useState({
    title: "",
    unit: "",
    category: "poster",
    caption: "",
  });

  const fetchPosters = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, uRes, dRes] = await Promise.all([
        api.get("/posters"),
        api.get("/units"),
        api.get("/officer/my-duties").catch(() => ({ data: { data: [] } })),
      ]);
      setPosters(pRes.data.data || []);
      setUnits(uRes.data.data || []);
      setDuties(dRes.data?.data || []);
    } catch {
      setPosters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  // Compute which units this officer is authorized to release posters for
  // Allowed: Design Lead, Chair, Faculty Advisor (and Superadmin across all units)
  const authorizedUnits = useMemo(() => {
    if (!user || !units.length) return [];
    if (user.globalRole === "superadmin") return units;

    const userUnitIds = (user.chapterMemberships || []).map((u) => (u._id || u).toString());

    return units.filter((unit) => {
      const unitIdStr = unit._id.toString();

      // Faculty Advisor / Chapter Admin:
      if (user.globalRole === "chapteradmin" && userUnitIds.includes(unitIdStr)) {
        return true;
      }

      // Check active duties for this unit
      const matchingDuty = duties.find(
        (d) => d.unitId?.toString() === unitIdStr || d.unit === unit.name
      );
      if (matchingDuty) {
        const pos = (matchingDuty.positionName || "").toLowerCase();
        const type = (matchingDuty.dutyType || "").toLowerCase();

        const isDesignRole =
          pos.includes("design") ||
          pos.includes("creative") ||
          pos.includes("marketing") ||
          pos.includes("webmaster") ||
          type === "design";
        const isChairRole = pos.includes("chair");
        const isFacultyRole = pos.includes("advisor") || pos.includes("counselor");

        if (isDesignRole || isChairRole || isFacultyRole) {
          return true;
        }
      }

      return false;
    });
  }, [user, units, duties]);

  const canRelease = authorizedUnits.length > 0;

  useEffect(() => {
    if (authorizedUnits.length > 0 && !formData.unit) {
      setFormData((prev) => ({ ...prev, unit: authorizedUnits[0]._id }));
    }
  }, [authorizedUnits, formData.unit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMsg({ text: "Please choose an image file.", type: "error" });
      return;
    }

    if (!formData.unit) {
      setMsg({ text: "Please select an authorized chapter/unit.", type: "error" });
      return;
    }

    setUploading(true);
    setMsg({ text: "", type: "" });

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("unit", formData.unit);
      data.append("category", formData.category);
      data.append("caption", formData.caption);
      data.append("poster", selectedFile);

      await api.post("/posters", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg({ text: "Poster released and recorded in official log!", type: "success" });
      setShowModal(false);
      setSelectedFile(null);
      setFormData({
        title: "",
        unit: authorizedUnits[0]?._id || "",
        category: "poster",
        caption: "",
      });
      fetchPosters();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Failed to release poster.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (posterId) => {
    if (!window.confirm("Are you sure you want to remove this promotional poster?")) return;
    try {
      await api.delete(`/posters/${posterId}`);
      setMsg({ text: "Poster removed successfully.", type: "success" });
      if (selectedPoster?._id === posterId) setSelectedPoster(null);
      fetchPosters();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Failed to delete poster.", type: "error" });
    }
  };

  const filteredPosters = posters.filter((p) => {
    if (filterUnit === "All") return true;
    return (p.unit?.name || "").toUpperCase() === filterUnit.toUpperCase();
  });

  return (
    <div>
      <div className="dash-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)" }}>
        <div>
          <h1>Design Lead — Poster & Content Release Log</h1>
          <p>Official promotional media registry: track event creatives, social media banners, and flyers.</p>
        </div>

        {canRelease ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (authorizedUnits.length > 0) {
                setFormData((prev) => ({ ...prev, unit: authorizedUnits[0]._id }));
              }
              setShowModal(true);
            }}
            style={{ background: "#c2410c", borderColor: "#c2410c" }}
          >
            🎨 Release New Poster
          </button>
        ) : (
          <span
            style={{
              padding: "6px 14px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: "0.82rem",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            🔒 View-Only: Design Lead, Chair & Faculty Only
          </span>
        )}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: "var(--sp-md)" }}>
          {msg.text}
          <button style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => setMsg({ text: "", type: "" })}>✕</button>
        </div>
      )}

      {/* Filter Tabs by Unit */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--sp-lg)", flexWrap: "wrap" }}>
        {["All", "CIS", "CS", "SPS", "WIE", "SB"].map((u) => (
          <button
            key={u}
            onClick={() => setFilterUnit(u)}
            className={`btn ${filterUnit === u ? "btn-primary" : "btn-outline"}`}
            style={{
              padding: "4px 14px",
              fontSize: "0.82rem",
              borderRadius: 999,
              ...(filterUnit === u ? { background: "#004976", borderColor: "#004976" } : {}),
            }}
          >
            {u === "All" ? "All Chapters" : `${u} Society`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius)" }} />
      ) : filteredPosters.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--sp-lg)" }}>
          {filteredPosters.map((p) => {
            const isOwner = p.releasedBy?._id === user?._id || p.releasedBy === user?._id;
            const canDelete = isOwner || user?.globalRole === "superadmin" || user?.globalRole === "chapteradmin";
            const imageUrl = getMediaUrl(p.fileUrl);

            return (
              <div
                key={p._id}
                className="card"
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-sm)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div
                  style={{ height: 220, backgroundColor: "#f8fafc", position: "relative", cursor: "pointer", overflow: "hidden" }}
                  onClick={() => setSelectedPoster(p)}
                  title="Click to view full poster"
                >
                  <img
                    src={imageUrl}
                    alt={p.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.style.background = "#e2e8f0";
                    }}
                  />
                  <span
                    className="badge badge-primary"
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "#004976",
                      color: "#fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                    }}
                  >
                    {p.unit?.name || "SB"}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      background: "rgba(15, 23, 42, 0.82)",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "0.74rem",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {p.category}
                  </span>
                </div>

                <div style={{ padding: "var(--sp-md)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3
                      style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "var(--navy)", cursor: "pointer" }}
                      onClick={() => setSelectedPoster(p)}
                    >
                      {p.title}
                    </h3>
                    {p.caption && <p style={{ margin: "0 0 6px", fontSize: "0.84rem", color: "var(--text-muted)" }}>{p.caption}</p>}
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      Released by <strong>{p.releasedBy?.name || "Design Lead"}</strong> on {new Date(p.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: "0.76rem", padding: "3px 8px" }}
                        onClick={() => setSelectedPoster(p)}
                      >
                        👁️ View Full
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: "0.76rem", padding: "3px 8px", borderColor: "#fca5a5", color: "#dc2626" }}
                          onClick={() => handleDelete(p._id)}
                          title="Delete this poster"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>No posters logged for {filterUnit === "All" ? "any chapter" : filterUnit}</h3>
          <p>Design Leads and Chapter Chairs can release official event flyers and creatives here.</p>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(2px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="card" style={{ width: 500, maxWidth: "95vw", padding: "var(--sp-xl)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)" }}>
              <h3 style={{ margin: 0, color: "var(--navy)" }}>🎨 Release Official Poster</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 var(--sp-md)", fontSize: "0.85rem", color: "#64748b" }}>
              Only Design Lead, Chapter Chair, and Faculty Advisor are authorized to release posters for their assigned chapters.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Creative Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Conclave 2026 Call for Registrations Banner"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)", marginBottom: "var(--sp-md)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Chapter / Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                  >
                    {authorizedUnits.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} Chapter
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                  >
                    <option value="poster">Event Poster</option>
                    <option value="banner">Social Banner</option>
                    <option value="social">Instagram Post / Reel Cover</option>
                    <option value="brochure">Brochure</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Select Image File (.jpg, .png, .webp) *</label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ width: "100%", padding: "6px" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-lg)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Description / Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Released officially across WhatsApp groups, Instagram handle & campus notice boards"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-sm)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={uploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: "#c2410c", borderColor: "#c2410c" }} disabled={uploading}>
                  {uploading ? "Uploading…" : "🚀 Release Poster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox Preview Modal ── */}
      {selectedPoster && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
            padding: "var(--sp-md)", backdropFilter: "blur(4px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setSelectedPoster(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 800, width: "100%", maxHeight: "92vh", display: "flex", flexDirection: "column",
              overflow: "hidden", padding: 0, background: "#fff", borderRadius: "var(--radius)",
            }}
          >
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-primary">{selectedPoster.unit?.name || "SB"}</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--navy)" }}>{selectedPoster.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoster(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#0f172a", textAlign: "center", padding: 12, overflow: "auto", maxHeight: "65vh" }}>
              <img
                src={getMediaUrl(selectedPoster.fileUrl)}
                alt={selectedPoster.title}
                style={{ maxHeight: "60vh", maxWidth: "100%", objectFit: "contain", borderRadius: 4 }}
              />
            </div>

            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                {selectedPoster.caption && (
                  <p style={{ margin: "0 0 4px", fontSize: "0.88rem", color: "var(--text)" }}>{selectedPoster.caption}</p>
                )}
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Released by <strong>{selectedPoster.releasedBy?.name || "Design Lead"}</strong> on{" "}
                  {new Date(selectedPoster.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={getMediaUrl(selectedPoster.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: "0.85rem", padding: "6px 14px", textDecoration: "none" }}
                  download
                >
                  ⬇️ Download Original
                </a>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedPoster(null)}
                  style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerPosters;