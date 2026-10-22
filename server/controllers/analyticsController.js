const Event          = require("../models/Event");
const Unit           = require("../models/Unit");
const User           = require("../models/User");
const DutyAssignment = require("../models/DutyAssignment");
const BudgetProposal = require("../models/BudgetProposal");
const nodemailer     = require("nodemailer");
const { getTransporter } = require("../utils/emailTransporter");

/**
 * GET /api/analytics/events
 * Comprehensive event analytics and performance insights.
 */
const getEventAnalytics = async (req, res, next) => {
  try {
    const events = await Event.find({ status: { $in: ["published", "archived"] } })
      .populate("unit", "name type")
      .sort({ date: 1 });

    const eventMetrics = events.map((ev) => {
      const registered = ev.registrations ? ev.registrations.length : 0;
      const attended   = ev.attendance ? ev.attendance.length : 0;
      const rate       = registered > 0 ? Math.round((attended / registered) * 100) : 0;
      const isUnderperforming = rate < 40 && registered >= 5;

      return {
        _id: ev._id,
        title: ev.title,
        unit: ev.unit?.name || "SB",
        date: ev.date,
        registered,
        attended,
        attendanceRate: rate,
        isUnderperforming,
        status: ev.status,
      };
    });

    // Chapter-wise comparison
    const chapterMap = {};
    eventMetrics.forEach((m) => {
      if (!chapterMap[m.unit]) {
        chapterMap[m.unit] = { unit: m.unit, totalEvents: 0, totalRegistered: 0, totalAttended: 0 };
      }
      chapterMap[m.unit].totalEvents += 1;
      chapterMap[m.unit].totalRegistered += m.registered;
      chapterMap[m.unit].totalAttended += m.attended;
    });

    const chapterComparison = Object.values(chapterMap).map((c) => ({
      unit: c.unit,
      events: c.totalEvents,
      totalRegistered: c.totalRegistered,
      totalAttended: c.totalAttended,
      avgAttendanceRate: c.totalRegistered > 0 ? Math.round((c.totalAttended / c.totalRegistered) * 100) : 0,
    }));

    // Time-trend (by month/date)
    const timeTrend = eventMetrics.map((m) => ({
      date: new Date(m.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      rate: m.attendanceRate,
      title: m.title.length > 20 ? m.title.substring(0, 18) + "…" : m.title,
      unit: m.unit,
    }));

    // Overview KPIs
    const totalEventsRegistered = eventMetrics.reduce((acc, e) => acc + e.registered, 0);
    const totalEventsAttended   = eventMetrics.reduce((acc, e) => acc + e.attended, 0);
    const overallRate = totalEventsRegistered > 0 ? Math.round((totalEventsAttended / totalEventsRegistered) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEvents: eventMetrics.length,
        totalRegistered: totalEventsRegistered,
        totalAttended: totalEventsAttended,
        overallAttendanceRate: overallRate,
        underperformingCount: eventMetrics.filter((e) => e.isUnderperforming).length,
        events: eventMetrics,
        chapterComparison,
        timeTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/leaderboard
 * Computes duty completion score and awards badges for active officers.
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const assignments = await DutyAssignment.find({ status: "active" })
      .populate("user", "name email globalRole")
      .populate({
        path: "positionTemplate",
        populate: { path: "unit", select: "name" },
      });

    // Compute duty completion for each officer
    const leaderboard = await Promise.all(
      assignments
        .filter((a) => a.user)
        .map(async (a) => {
          const userId = a.user._id;

          // Check officer's activity signals
          const [eventsCreated, proposalsSubmitted] = await Promise.all([
            Event.countDocuments({ createdBy: userId }),
            BudgetProposal.countDocuments({ submittedBy: userId }),
          ]);

          // Scoring logic:
          // Base score for holding active duty: 50 pts
          // Events created / organized: +20 pts each
          // Budget / reports submitted: +15 pts each
          const baseScore = 50;
          const activityScore = eventsCreated * 20 + proposalsSubmitted * 15;
          const totalScore = Math.min(100, baseScore + activityScore);

          let badge = null;
          if (totalScore >= 90) {
            badge = { name: "Gold", icon: "🥇", color: "#eab308", min: 90 };
          } else if (totalScore >= 75) {
            badge = { name: "Silver", icon: "🥈", color: "#94a3b8", min: 75 };
          } else if (totalScore >= 50) {
            badge = { name: "Bronze", icon: "🥉", color: "#d97706", min: 50 };
          }

          return {
            userId: a.user._id,
            name: a.user.name,
            email: a.user.email,
            position: a.positionTemplate?.positionName || "Officer",
            unit: a.positionTemplate?.unit?.name || "SB",
            completionScore: totalScore,
            eventsCreated,
            proposalsSubmitted,
            badge,
          };
        })
    );

    // Rank from highest to lowest score
    leaderboard.sort((a, b) => b.completionScore - a.completionScore);

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/analytics/advisor-digest/:unitId
 * Manual trigger: compiles advisor digest email and sends it via Nodemailer.
 */
const sendAdvisorDigest = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const unit = await Unit.findById(unitId);
    if (!unit) {
      const err = new Error("Unit not found.");
      err.statusCode = 404;
      return next(err);
    }

    // Fetch advisor email (or user with advisor position)
    const advisorAssignment = await DutyAssignment.findOne({ status: "active" })
      .populate({
        path: "positionTemplate",
        match: { unit: unit._id, positionName: { $regex: /advisor|counselor/i } },
      })
      .populate("user", "name email");

    const recipientEmail = advisorAssignment?.user?.email || "advisor@ieee-sngce.in";
    const advisorName    = advisorAssignment?.user?.name  || `Prof. Advisor (${unit.name})`;

    // Gather digest data
    const [events, pendingDuties, pendingBudgets] = await Promise.all([
      Event.find({ unit: unit._id }).select("title date attendance status").limit(5),
      DutyAssignment.countDocuments({ "positionTemplate.unit": unit._id, status: "vacant" }),
      BudgetProposal.find({ unit: unit._id, status: "pending" }),
    ]);

    // Send digest email via Nodemailer
    const transporter = await getTransporter();

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <div style="background:#00629B;padding:20px;color:#fff;text-align:center">
          <h2 style="margin:0">IEEE SB SNGCE — Advisor Executive Digest</h2>
          <p style="margin:4px 0 0;font-size:0.9rem">${unit.name} Chapter Status Report</p>
        </div>
        <div style="padding:24px;background:#fff">
          <p>Dear <strong>${advisorName}</strong>,</p>
          <p>Here is your chapter status digest for <strong>${unit.name}</strong>:</p>

          <h3 style="color:#00629B;border-bottom:2px solid #e2e8f0;padding-bottom:6px">🗓️ Recent Events & Attendance</h3>
          <ul>
            ${events.map((e) => `<li><strong>${e.title}</strong> — ${e.attendance?.length || 0} attendees (${e.status})</li>`).join("")}
          </ul>

          <h3 style="color:#00629B;border-bottom:2px solid #e2e8f0;padding-bottom:6px">💰 Pending Budget Allocations</h3>
          <p>${pendingBudgets.length} request(s) awaiting approval.</p>

          <h3 style="color:#00629B;border-bottom:2px solid #e2e8f0;padding-bottom:6px">👥 Vacant ExeCom Duties</h3>
          <p>${pendingDuties} vacant post(s) in chapter roster.</p>
        </div>
        <div style="background:#f8fafc;padding:12px;text-align:center;font-size:0.8rem;color:#64748b">
          IEEE Student Branch · Sree Narayana Gurukulam College of Engineering
        </div>
      </div>
    `;

    // Attempt email delivery gracefully
    let emailSent = false;
    try {
      await transporter.sendMail({
        from: '"IEEE SB SNGCE" <noreply@ieee-sngce.in>',
        to: recipientEmail,
        subject: `[Advisor Digest] ${unit.name} Chapter Executive Report`,
        html: emailHtml,
      });
      emailSent = true;
    } catch {
      // In dev environment, Ethereal may not be configured; log gracefully
      emailSent = false;
    }

    res.status(200).json({
      success: true,
      message: `Digest generated for ${advisorName} (${recipientEmail}).`,
      emailSent,
      data: {
        advisorName,
        recipientEmail,
        eventsCount: events.length,
        pendingBudgetsCount: pendingBudgets.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventAnalytics,
  getLeaderboard,
  sendAdvisorDigest,
};
