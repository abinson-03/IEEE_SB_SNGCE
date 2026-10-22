const User = require("../models/User");
const DutyAssignment = require("../models/DutyAssignment");

/**
 * Calculates official IEEE hierarchy rank for position-wise sorting.
 * Lower rank = higher organizational hierarchy.
 */
const getPositionRank = (posName = "", unitName = "") => {
  const title = (posName || "").toLowerCase().trim();
  const u = (unitName || "").toUpperCase().trim();

  // 1. Branch Faculty Counselor
  if (title.includes("counselor")) return 1;

  // 2. Chapter Faculty Advisors
  if (title.includes("advisor")) return u === "SB" ? 1 : 2;

  // 3. Branch Chair
  if (title === "chair" && u === "SB") return 3;

  // 4. Chapter Chairs
  if (title === "chair") return 4;

  // 5. Branch Vice Chair
  if (title.includes("vice chair") && u === "SB") return 5;

  // 6. Chapter Vice Chairs
  if (title.includes("vice chair")) return 6;

  // 7. Branch Secretary
  if (title === "secretary" && u === "SB") return 7;

  // 8. Chapter Secretaries
  if (title === "secretary") return 8;

  // 9. Joint Secretary
  if (title.includes("joint secretary")) return 9;

  // 10. Branch Treasurer & Chapter Treasurers
  if (title.includes("treasurer")) return u === "SB" ? 10 : 11;

  // 11. Program Lead
  if (title.includes("program lead")) return 12;

  // 12. Webmasters
  if (title.includes("webmaster") || title.includes("web master")) return 13;

  // 13. Design Lead
  if (title.includes("design lead")) return 14;

  // 14. Event Coordinator
  if (title.includes("event coordinator")) return 15;

  // 15. Technical Lead
  if (title.includes("technical lead") || title.includes("tech lead")) return 16;

  // 16. Social Event Lead
  if (title.includes("social event")) return 17;

  // 17. Outreach Coordinator
  if (title.includes("outreach")) return 18;

  // 18. Marketing/Publicity Coordinator
  if (title.includes("marketing") || title.includes("publicity")) return 19;

  // 19. Membership Engagement
  if (title.includes("membership")) return 20;

  // 20. Project Coordinator
  if (title.includes("project coordinator")) return 21;

  if (title.includes("lead")) return 22;
  if (title.includes("coordinator")) return 23;

  return 25; // other officer position
};

/**
 * GET /api/directory
 * Returns a public-safe member directory ordered by official IEEE hierarchy (position-wise).
 * Strictly controlled projection: private credentials (email, password) are never exposed.
 */
const getDirectory = async (req, res, next) => {
  try {
    const { unit, search } = req.query;

    // Build user filter (exclude test / e2e accounts automatically)
    const userFilter = {
      globalRole: { $in: ["member", "execom", "chapteradmin", "superadmin"] },
      name: { $not: { $regex: "^E2E", $options: "i" } },
      email: { $not: { $regex: "^e2e_", $options: "i" } },
    };

    if (search) {
      userFilter.name = { $regex: search, $options: "i" };
    }

    // Explicit projection
    const users = await User.find(userFilter)
      .select("name globalRole chapterMemberships profilePhoto")
      .populate("chapterMemberships", "name type");

    // Filter by unit name if requested
    let filtered = users;
    if (unit && unit.toUpperCase() !== "ALL") {
      const upperUnit = unit.toUpperCase();
      filtered = users.filter((u) =>
        u.chapterMemberships && u.chapterMemberships.some((ch) => ch.name === upperUnit)
      );
    }

    // Enrich each user with their active position and unit
    const userIds = filtered.map((u) => u._id);

    const activeAssignments = await DutyAssignment.find({
      user: { $in: userIds },
      status: "active",
    }).populate({
      path: "positionTemplate",
      select: "positionName unit",
      populate: { path: "unit", select: "name code" },
    });

    // Build assignment lookup per user
    const assignmentsByUser = {};
    for (const a of activeAssignments) {
      if (a.user) {
        const key = a.user.toString();
        if (!assignmentsByUser[key]) assignmentsByUser[key] = [];
        assignmentsByUser[key].push(a);
      }
    }

    const directory = filtered.map((u) => {
      const userAssignments = assignmentsByUser[u._id.toString()] || [];
      const posDetails = [];
      let bestRank = 100;

      for (const a of userAssignments) {
        const pt = a.positionTemplate;
        const posName = pt?.positionName || "Officer";
        const unitObj = pt?.unit;
        const unitName = (typeof unitObj === "object" ? unitObj?.name : "") || "";
        const rank = getPositionRank(posName, unitName);

        if (rank < bestRank) bestRank = rank;

        posDetails.push({
          positionName: posName,
          unitName: unitName,
          rank: rank,
        });
      }

      // Fallback ranking for users without active duty assignments
      if (userAssignments.length === 0) {
        if (u.globalRole === "superadmin") bestRank = 1;
        else if (u.globalRole === "chapteradmin") bestRank = 4;
        else if (u.globalRole === "execom") bestRank = 25;
        else bestRank = 100;
      }

      // Generate polished display position title
      let displayPosition = "Student Member";
      if (posDetails.length > 0) {
        // Pick highest ranked position
        const top = posDetails.sort((a, b) => a.rank - b.rank)[0];
        if (top.unitName && top.unitName !== "SB") {
          displayPosition = `${top.positionName} • ${top.unitName}`;
        } else if (top.unitName === "SB") {
          displayPosition = `${top.positionName} (SB)`;
        } else {
          displayPosition = top.positionName;
        }
      } else if (u.globalRole === "superadmin") {
        displayPosition = "Faculty Counselor";
      } else if (u.globalRole === "chapteradmin") {
        displayPosition = "Chapter Officer";
      } else if (u.globalRole === "execom") {
        displayPosition = "Executive Member";
      }

      return {
        id: u._id,
        name: u.name,
        globalRole: u.globalRole,
        displayPosition: displayPosition,
        hierarchyRank: bestRank,
        chapters: u.chapterMemberships ? u.chapterMemberships.map((ch) => ch.name) : [],
        positions: posDetails.map((p) => p.positionName),
        profilePhoto: u.profilePhoto || null,
      };
    });

    // Sort strictly by hierarchy rank (position-wise), then alphabetically by name
    directory.sort((a, b) => a.hierarchyRank - b.hierarchyRank || a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      total: directory.length,
      data: directory,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDirectory };
