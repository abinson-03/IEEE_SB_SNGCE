import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import UserAvatar from "../../components/UserAvatar";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const OfficerMembers = () => {
  const [members, setMembers]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [query, setQuery]       = useState("");

  useEffect(() => {
    axiosInstance.get("/officer/members")
      .then((r) => { setMembers(r.data.data || []); setTotal(r.data.total || 0); })
      .catch((e) => setError(e.response?.data?.message || "Failed to load members."))
      .finally(() => setLoading(false));
  }, []);

  // Client-side filter by name or email
  const filtered = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, query]);

  return (
    <div>
      <div
        className="dash-page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--sp-md)" }}
      >
        <div>
          <h1>Member List</h1>
          <p>
            {loading ? "Loading…" : `${filtered.length} of ${total} member${total !== 1 ? "s" : ""} in your chapter${query ? " (filtered)" : ""}.`}
          </p>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "0.5rem 0.9rem",
            border: "1.5px solid var(--border-dark)",
            borderRadius: "var(--radius-full)",
            fontFamily: "inherit",
            fontSize: "0.88rem",
            width: "clamp(180px, 30%, 280px)",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "var(--text-muted)", padding: "var(--sp-md)", background: "#fee2e2", borderRadius: "var(--radius-sm)" }}>
          ⚠️ {error}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="skeleton" style={{ height: 220, borderRadius: "var(--radius)" }} />
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>{query ? "No members match your search" : "No members yet"}</h3>
          <p>
            {query
              ? "Try a different name or email."
              : "Members will appear here once they join your chapter."}
          </p>
          {query && (
            <button
              className="btn btn-outline"
              style={{ marginTop: "var(--sp-md)" }}
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Member table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="card">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Chapters</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m._id}>
                    {/* Avatar initial + name */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
                        <UserAvatar
                          src={m.profilePhoto}
                          name={m.name}
                          size={32}
                        />
                        <strong>{m.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{m.email}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {m.chapterMemberships?.length > 0
                          ? m.chapterMemberships.map((c) => (
                              <span key={c._id} className="badge badge-primary">{c.name}</span>
                            ))
                          : <span style={{ color: "var(--text-light)", fontSize: "0.8rem" }}>—</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", textTransform: "capitalize", color: "var(--text-muted)" }}>
                        {m.globalRole}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {fmt(m.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer note */}
      {!loading && total > 0 && (
        <p style={{ marginTop: "var(--sp-md)", fontSize: "0.78rem", color: "var(--text-light)" }}>
          Read-only view. Member management (add / remove chapters) is available in the Admin panel.{" "}
          <Link to="/directory" style={{ color: "var(--primary)" }}>View public directory →</Link>
        </p>
      )}
    </div>
  );
};

export default OfficerMembers;
