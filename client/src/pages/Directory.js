import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import OfficerCard from "../components/OfficerCard";

const CHAPTERS = ["All", "CIS", "CS", "SPS", "WIE", "SB"];

const POSITION_FILTERS = [
  { id: "all", label: "All Positions" },
  { id: "advisors", label: "👑 Counselors & Advisors" },
  { id: "chairs", label: "🏛️ Chairs & Vice Chairs" },
  { id: "officers", label: "📋 Secretaries & Treasurers" },
  { id: "leads", label: "⚡ Leads & Coordinators" },
  { id: "members", label: "🎓 Student Members" },
];

const matchesPositionCategory = (member, categoryId) => {
  if (categoryId === "all") return true;
  const rank = member.hierarchyRank || 100;
  const pos = (member.displayPosition || "").toLowerCase();

  if (categoryId === "advisors") {
    return rank <= 2 || pos.includes("counselor") || pos.includes("advisor");
  }
  if (categoryId === "chairs") {
    return (rank >= 3 && rank <= 6) || pos.includes("chair");
  }
  if (categoryId === "officers") {
    return (rank >= 7 && rank <= 11) || pos.includes("secretary") || pos.includes("treasurer");
  }
  if (categoryId === "leads") {
    return (
      (rank >= 12 && rank <= 25) ||
      pos.includes("lead") ||
      pos.includes("coordinator") ||
      pos.includes("webmaster") ||
      pos.includes("master")
    );
  }
  if (categoryId === "members") {
    return rank >= 90 || pos.includes("member");
  }
  return true;
};

const Directory = () => {
  const [members, setMembers]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState("");
  const [chapter, setChapter]                   = useState("All");
  const [positionFilter, setPositionFilter]     = useState("all");
  const [sortBy, setSortBy]                     = useState("hierarchy"); // 'hierarchy' | 'name'

  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/directory")
      .then((r) => setMembers(r.data.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return members
      .filter((m) => {
        const query = search.toLowerCase().trim();
        const matchSearch =
          !query ||
          m.name.toLowerCase().includes(query) ||
          (m.displayPosition && m.displayPosition.toLowerCase().includes(query)) ||
          (m.positions && m.positions.some((p) => p.toLowerCase().includes(query)));

        const matchChapter =
          chapter === "All" ||
          (m.chapters && m.chapters.includes(chapter)) ||
          (m.displayPosition && m.displayPosition.includes(chapter));

        const matchPos = matchesPositionCategory(m, positionFilter);

        return matchSearch && matchChapter && matchPos;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        // Position hierarchy order by default
        return (a.hierarchyRank || 100) - (b.hierarchyRank || 100) || a.name.localeCompare(b.name);
      });
  }, [members, search, chapter, positionFilter, sortBy]);

  return (
    <div>
      {/* Page hero */}
      <div className="page-hero">
        <div className="container">
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", padding: "3px 12px", borderRadius: "var(--radius-full)", fontSize: "0.8rem", fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px" }}>
            OFFICIAL IEEE SB SNGCE ROSTER
          </div>
          <h1 style={{ margin: "0 0 6px" }}>Member & ExeCom Directory</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Explore branch counselors, chapter chairs, officers, and members organized by official IEEE hierarchy.
          </p>
        </div>
      </div>

      <section className="section" style={{ background: "#f8fafc", minHeight: "65vh" }}>
        <div className="container">

          {/* Main Controls Card */}
          <div
            className="card"
            style={{
              padding: "var(--sp-lg)",
              marginBottom: "var(--sp-xl)",
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {/* Search and Sort Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: "var(--sp-md)",
              }}
            >
              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="🔍 Search by name or position (e.g. Chair, Treasurer, Abinson)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    fontSize: "0.92rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Sort selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="hierarchy">👑 Position Hierarchy (Official)</option>
                  <option value="name">🔤 Name (A–Z)</option>
                </select>
              </div>
            </div>

            {/* Chapter Filter Pills */}
            <div style={{ marginBottom: "var(--sp-sm)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 6 }}>
                Filter by Chapter / Unit:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CHAPTERS.map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    className={`filter-pill${chapter === ch ? " active" : ""}`}
                    onClick={() => setChapter(ch)}
                    style={{
                      padding: "5px 14px",
                      fontSize: "0.84rem",
                      fontWeight: chapter === ch ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {ch === "All" ? "🌐 All Chapters" : ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Category Filter Pills */}
            <div style={{ marginTop: "var(--sp-sm)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 6 }}>
                Filter by Position:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {POSITION_FILTERS.map((pos) => (
                  <button
                    type="button"
                    key={pos.id}
                    onClick={() => setPositionFilter(pos.id)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.8rem",
                      fontWeight: positionFilter === pos.id ? 700 : 500,
                      cursor: "pointer",
                      border: positionFilter === pos.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                      background: positionFilter === pos.id ? "var(--primary)" : "#fff",
                      color: positionFilter === pos.id ? "#fff" : "var(--text)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Member Count Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {loading
                ? "Loading IEEE roster…"
                : `Showing ${filtered.length} member${filtered.length !== 1 ? "s" : ""}${chapter !== "All" ? ` in ${chapter}` : ""}${positionFilter !== "all" ? ` (${POSITION_FILTERS.find(p=>p.id===positionFilter)?.label})` : ""}`}
            </span>
            {filtered.length > 0 && sortBy === "hierarchy" && (
              <span style={{ fontSize: "0.76rem", color: "var(--primary)", background: "#e0f2fe", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                ✓ Ordered by Official Position Hierarchy
              </span>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: "var(--radius)" }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid-4">
              {filtered.map((m) => (
                <OfficerCard
                  key={m.id}
                  name={m.name}
                  positionName={m.displayPosition || (m.positions?.length > 0 ? m.positions.join(", ") : "Member")}
                  profilePhoto={m.profilePhoto}
                  academicYear={m.chapters?.length > 0 ? m.chapters.join(" • ") : null}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ background: "#fff", padding: "var(--sp-2xl)", borderRadius: "var(--radius-md)" }}>
              <div className="empty-icon">👥</div>
              <h3>No members match your filter</h3>
              <p>{search || chapter !== "All" || positionFilter !== "all" ? "Try clearing the search or choosing 'All Chapters'." : "No members have been registered yet."}</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSearch("");
                  setChapter("All");
                  setPositionFilter("all");
                }}
                style={{ marginTop: 10 }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Directory;
