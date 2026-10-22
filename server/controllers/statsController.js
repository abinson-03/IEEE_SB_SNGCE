const Event = require("../models/Event");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Unit = require("../models/Unit");

/**
 * GET /api/stats/public
 * Returns four aggregate counts for the animated "Live Impact Stats Bar"
 * on the Home page. All counts are public — no auth required.
 *
 * Uses Promise.all for parallel DB queries (fastest).
 */
const getPublicStats = async (req, res, next) => {
  try {
    const [totalEvents, certificatesIssued, activeMembers, totalChapters] =
      await Promise.all([
        // Count all non-draft events (published + archived = ever organised)
        Event.countDocuments({ status: { $in: ["published", "archived"] } }),
        Certificate.countDocuments(),
        // Active members = users with member or execom role (excludes guests)
        User.countDocuments({ globalRole: { $in: ["member", "execom", "superadmin"] } }),
        // Only technical chapters (not the SB itself)
        Unit.countDocuments({ type: "chapter" }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        certificatesIssued,
        activeMembers,
        totalChapters,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicStats };
