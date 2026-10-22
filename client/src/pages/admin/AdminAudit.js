import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";

const ACTIONS = [
  "",
  "EVENT_CREATED",
  "EVENT_EDITED",
  "EVENT_PUBLISHED",
  "EVENT_ARCHIVED",
  "CHECKIN_MARKED",
  "DUTY_ASSIGNED",
  "DUTY_VACATED",
  "POSITION_TEMPLATE_CREATED",
  "POSITION_TEMPLATE_EDITED",
  "POSITION_TEMPLATE_ARCHIVED",
  "BUDGET_PROPOSAL_SUBMITTED",
  "BUDGET_APPROVED",
  "BUDGET_REJECTED",
  "USER_STATUS_UPDATED",
  "CERTIFICATES_GENERATED",
  "SYSTEM_INITIALIZE",
];

const AdminAudit = () => {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [action, setAction]   = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", 25);
      if (action) params.set("action", action);

      const res = await axiosInstance.get(`/admin/audit?${params.toString()}`);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, action]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <div className="dash-page-header">
        <h1>Audit Trail</h1>
        <p>Immutable activity log of all state-changing actions across the portal.</p>
      </div>

      <div className="filter-bar" style={{ marginBottom: "var(--sp-lg)", display: "flex", gap: "var(--sp-md)", alignItems: "center" }}>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          style={{ padding: "0.5rem 0.9rem", border: "1.5px solid var(--border-dark)", borderRadius: "var(--radius-full)", fontFamily: "inherit", fontSize: "0.88rem" }}
        >
          <option value="">All Actions ({total})</option>
          {ACTIONS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius)" }} />
      ) : logs.length > 0 ? (
        <div className="card">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Target Type</th>
                  <th>Details / Context</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: "0.74rem" }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      {log.performedBy ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{log.performedBy.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.performedBy.globalRole}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>System</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)" }}>
                        {log.targetType || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#334155", maxWidth: 280 }}>
                      {log.meta && Object.keys(log.meta).length > 0 ? (
                        <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>
                          {JSON.stringify(log.meta)}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-md) var(--sp-lg)", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {pages} ({total} entries)</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "4px 10px", fontSize: "0.82rem" }}>
                  ◀ Prev
                </button>
                <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)} style={{ padding: "4px 10px", fontSize: "0.82rem" }}>
                  Next ▶
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No audit logs found</h3>
        </div>
      )}
    </div>
  );
};

export default AdminAudit;
