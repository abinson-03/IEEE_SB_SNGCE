import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axiosInstance";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const AnalyticsPage = () => {
  const [data, setData]               = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [units, setUnits]             = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [loading, setLoading]         = useState(true);
  const [digestMsg, setDigestMsg]     = useState({ text: "", type: "" });
  const [sendingDigest, setSendingDigest] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, lbRes, uRes] = await Promise.all([
        api.get("/analytics/events"),
        api.get("/analytics/leaderboard"),
        api.get("/units"),
      ]);
      setData(evRes.data.data);
      setLeaderboard(lbRes.data.data || []);
      setUnits(uRes.data.data || []);
      if (uRes.data.data?.length > 0) {
        setSelectedUnit(uRes.data.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSendDigest = async () => {
    if (!selectedUnit) return;
    setSendingDigest(true);
    setDigestMsg({ text: "", type: "" });
    try {
      const res = await api.post(`/analytics/advisor-digest/${selectedUnit}`);
      setDigestMsg({
        text: `✅ ${res.data.message || "Advisor digest dispatched successfully."}`,
        type: "success",
      });
    } catch (err) {
      setDigestMsg({
        text: `❌ ${err.response?.data?.message || "Failed to dispatch digest."}`,
        type: "error",
      });
    } finally {
      setSendingDigest(false);
    }
  };

  return (
    <div className="container" style={{ padding: "var(--sp-xl) var(--sp-md)", maxWidth: 1200 }}>
      {/* ── Page Header ── */}
      <div className="dash-page-header" style={{ marginBottom: "var(--sp-xl)" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "var(--navy)" }}>Event Analytics & Insights</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Real-time turnout metrics, chapter performance comparisons, and officer duty completion leaderboard.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 350, borderRadius: "var(--radius)" }} />
      ) : data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-xl)" }}>
          {/* ── KPI Cards Strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--sp-md)" }}>
            <div className="card" style={{ padding: "var(--sp-lg)", borderTop: "4px solid #00629B" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL EVENTS HELD</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--navy)", marginTop: 4 }}>{data.totalEvents}</div>
              <div style={{ fontSize: "0.78rem", color: "#16a34a", marginTop: 4 }}>Published & Archived</div>
            </div>

            <div className="card" style={{ padding: "var(--sp-lg)", borderTop: "4px solid #7c3aed" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL REGISTRATIONS</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#7c3aed", marginTop: 4 }}>{data.totalRegistered}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>Across all technical chapters</div>
            </div>

            <div className="card" style={{ padding: "var(--sp-lg)", borderTop: "4px solid #16a34a" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>CHECKED-IN ATTENDEES</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#16a34a", marginTop: 4 }}>{data.totalAttended}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>QR Verified Participants</div>
            </div>

            <div className="card" style={{ padding: "var(--sp-lg)", borderTop: `4px solid ${data.overallAttendanceRate >= 50 ? "#059669" : "#dc2626"}` }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>OVERALL TURNOUT RATE</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: data.overallAttendanceRate >= 50 ? "#059669" : "#dc2626", marginTop: 4 }}>
                {data.overallAttendanceRate}%
              </div>
              <div style={{ fontSize: "0.78rem", color: data.underperformingCount > 0 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
                {data.underperformingCount} underperforming (&lt;40%)
              </div>
            </div>
          </div>

          {/* ── Underperforming Events Warning Banner ── */}
          {data.underperformingCount > 0 && (
            <div className="alert alert-error" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "1.4rem" }}>⚠️</span>
              <div>
                <strong>{data.underperformingCount} Event(s) Underperforming:</strong> Attendance fell below 40% threshold. Consider improving pre-event reminders and chapter outreach.
              </div>
            </div>
          )}

          {/* ── Recharts Graphs Grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "var(--sp-lg)" }}>
            {/* Chart 1: Chapter-wise Comparison Bar Chart */}
            <div className="card" style={{ padding: "var(--sp-lg)" }}>
              <h3 style={{ margin: "0 0 var(--sp-md)", fontSize: "1.05rem", color: "var(--navy)" }}>
                📊 Chapter-wise Registration & Attendance Comparison
              </h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data.chapterComparison} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="unit" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalRegistered" name="Registered" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalAttended" name="Attended" fill="#00629B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Time-Trend Line Chart */}
            <div className="card" style={{ padding: "var(--sp-lg)" }}>
              <h3 style={{ margin: "0 0 var(--sp-md)", fontSize: "1.05rem", color: "var(--navy)" }}>
                📈 Turnout Percentage Trend Over Time (%)
              </h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={data.timeTrend} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" name="Turnout %" stroke="#16a34a" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Per-Event Analytics Table ── */}
          <div className="card" style={{ padding: "var(--sp-lg)" }}>
            <h3 style={{ margin: "0 0 var(--sp-md)", fontSize: "1.05rem", color: "var(--navy)" }}>
              🗓️ Individual Event Turnout & Underperformance Flags
            </h3>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Chapter</th>
                    <th>Date</th>
                    <th>Registered</th>
                    <th>Attended</th>
                    <th>Turnout %</th>
                    <th>Performance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((ev) => (
                    <tr key={ev._id} style={{ backgroundColor: ev.isUnderperforming ? "#fff1f2" : "inherit" }}>
                      <td><strong>{ev.title}</strong></td>
                      <td><span className="badge badge-primary">{ev.unit}</span></td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        {new Date(ev.date).toLocaleDateString("en-IN")}
                      </td>
                      <td>{ev.registered}</td>
                      <td>{ev.attended}</td>
                      <td>
                        <strong style={{ color: ev.attendanceRate >= 50 ? "#16a34a" : "#dc2626" }}>
                          {ev.attendanceRate}%
                        </strong>
                      </td>
                      <td>
                        {ev.isUnderperforming ? (
                          <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 999, fontSize: "0.76rem", fontWeight: 700 }}>
                            ⚠️ Underperforming (&lt;40%)
                          </span>
                        ) : (
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 999, fontSize: "0.76rem", fontWeight: 700 }}>
                            ✅ Satisfactory
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Duty Completion Analytics & Leaderboard ── */}
          <div className="card" style={{ padding: "var(--sp-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--navy)" }}>
                  🏆 ExeCom Duty Completion Leaderboard & Badges
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Ranked by duty milestones, events delivered, and report submissions.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "0.8rem" }}>
                <span>🥇 Gold (90%+)</span>
                <span>🥈 Silver (75%+)</span>
                <span>🥉 Bronze (50%+)</span>
              </div>
            </div>

            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Officer</th>
                    <th>Position & Chapter</th>
                    <th>Events Organized</th>
                    <th>Proposals / Logs</th>
                    <th>Duty Score</th>
                    <th>Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((off, idx) => (
                    <tr key={off.userId}>
                      <td>
                        <strong style={{ fontSize: "1rem", color: idx === 0 ? "#ca8a04" : "var(--navy)" }}>
                          #{idx + 1}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{off.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{off.email}</div>
                      </td>
                      <td>
                        <strong>{off.position}</strong>
                        <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: "0.72rem" }}>{off.unit}</span>
                      </td>
                      <td>{off.eventsCreated}</td>
                      <td>{off.proposalsSubmitted}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 4, width: 80, overflow: "hidden" }}>
                            <div style={{ width: `${off.completionScore}%`, height: "100%", background: off.completionScore >= 90 ? "#eab308" : off.completionScore >= 75 ? "#94a3b8" : "#d97706" }} />
                          </div>
                          <strong>{off.completionScore}%</strong>
                        </div>
                      </td>
                      <td>
                        {off.badge ? (
                          <span
                            style={{
                              background: `${off.badge.color}22`,
                              color: off.badge.color,
                              border: `1px solid ${off.badge.color}55`,
                              padding: "3px 10px",
                              borderRadius: 999,
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {off.badge.icon} {off.badge.name}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Advisor Digest Email Dispatcher ── */}
          <div className="card" style={{ padding: "var(--sp-xl)", borderTop: "4px solid #00629B", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)" }}>
              <div>
                <h3 style={{ margin: "0 0 6px", color: "var(--navy)" }}>📧 Automated Faculty Advisor Digest</h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: 600 }}>
                  Generate and email an executive chapter status digest to the Faculty Counselor / Chapter Advisor detailing events held, attendee turnouts, pending budget proposals, and vacant duty rosters.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} Chapter</option>
                  ))}
                </select>

                <button
                  className="btn btn-primary"
                  onClick={handleSendDigest}
                  disabled={sendingDigest}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {sendingDigest ? "Dispatching…" : "📤 Send Advisor Digest"}
                </button>
              </div>
            </div>

            {digestMsg.text && (
              <div className={`alert alert-${digestMsg.type}`} style={{ marginTop: "var(--sp-md)" }}>
                {digestMsg.text}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AnalyticsPage;
