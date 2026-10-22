import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import UserAvatar from "../../components/UserAvatar";

const ROLES = ["", "superadmin", "chapteradmin", "execom", "member", "guest"];

const AdminUsers = () => {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [role, setRole]         = useState("");
  const [search, setSearch]     = useState("");
  const [actionMsg, setActionMsg] = useState({ text: "", type: "" });
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role)   params.set("role", role);
    if (search) params.set("search", search);
    axiosInstance.get(`/admin/users?${params.toString()}`)
      .then((r) => { setUsers(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "inactive" ? "active" : "inactive";
    const confirmMsg = nextStatus === "inactive"
      ? `Deactivate account for "${user.name}"? They will not be able to log in.`
      : `Reactivate account for "${user.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(user._id);
    try {
      await axiosInstance.patch(`/admin/users/${user._id}/status`, { status: nextStatus });
      setActionMsg({ text: `User ${user.name} is now ${nextStatus}.`, type: "success" });
      loadUsers();
    } catch (err) {
      setActionMsg({ text: err.response?.data?.message || "Status update failed.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="dash-page-header">
        <h1>User Management</h1>
        <p>{total} total users registered in IEEE SB Portal.</p>
      </div>

      {actionMsg.text && (
        <div className={`alert alert-${actionMsg.type}`} style={{ marginBottom: "var(--sp-lg)" }}>
          {actionMsg.text}
          <button style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => setActionMsg({ text: "", type: "" })}>✕</button>
        </div>
      )}

      <div className="filter-bar" style={{ marginBottom: "var(--sp-lg)", display: "flex", gap: "var(--sp-md)", flexWrap: "wrap" }}>
        <input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadUsers()}
          style={{ padding: "0.5rem 0.9rem", border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-full)", fontFamily: "inherit", fontSize: "0.88rem" }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: "0.5rem 0.9rem", border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-full)", fontFamily: "inherit", fontSize: "0.88rem" }}
        >
          {ROLES.map((r) => <option key={r} value={r}>{r ? r.toUpperCase() : "All roles"}</option>)}
        </select>
        <button className="btn btn-outline" onClick={loadUsers} style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
          🔍 Search
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius)" }} />
      ) : users.length > 0 ? (
        <div className="card">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Chapters</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isActive = u.status !== "inactive";
                  return (
                    <tr key={u._id} style={{ opacity: isActive ? 1 : 0.65 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <UserAvatar src={u.profilePhoto} name={u.name} size={28} />
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td><span className="badge badge-primary">{u.globalRole}</span></td>
                      <td>
                        <span
                          style={{
                            background: isActive ? "#dcfce7" : "#fee2e2",
                            color: isActive ? "#15803d" : "#b91c1c",
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                          }}
                        >
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td>{u.chapterMemberships?.map((c) => c.name).join(", ") || "—"}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.78rem",
                            color: isActive ? "#dc2626" : "#16a34a",
                            borderColor: isActive ? "#fca5a5" : "#86efac",
                          }}
                          disabled={updatingId === u._id}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {updatingId === u._id ? "…" : isActive ? "Deactivate" : "Activate"}
                        </button>
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
          <div className="empty-icon">👥</div>
          <h3>No users found</h3>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
