require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes          = require("./routes/authRoutes");
const statsRoutes         = require("./routes/statsRoutes");
const eventsRoutes        = require("./routes/eventsRoutes");
const unitsRoutes         = require("./routes/unitsRoutes");
const directoryRoutes     = require("./routes/directoryRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const adminRoutes         = require("./routes/adminRoutes");
const officerRoutes       = require("./routes/officerRoutes");
const memberRoutes        = require("./routes/memberRoutes");
const path = require("path");
const certificateRoutes   = require("./routes/certificateRoutes");
const analyticsRoutes     = require("./routes/analyticsRoutes");
const galleryRoutes       = require("./routes/galleryRoutes");
const minutesRoutes       = require("./routes/minutesRoutes");
const posterRoutes        = require("./routes/posterRoutes");
const userRoutes          = require("./routes/userRoutes");
const chapterRoutes       = require("./routes/chapterRoutes");
const noticeRoutes        = require("./routes/noticeRoutes");
const errorHandler        = require("./middleware/errorHandler");

// ─── Bootstrap ───────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

// CORS — allow requests from localhost, 127.0.0.1, and local LAN IPs (e.g. 192.168.x.x)
app.use(
  cors({
    origin: true, // reflects request origin, allows localhost and any LAN IP
    credentials: true,
  })
);

// Parse JSON request bodies (support up to 50mb for image uploads such as payment proofs)
app.use(express.json({ limit: "50mb" }));

// Parse URL-encoded form data (e.g. for simple HTML forms)
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded event photos, posters, and documents statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health-check endpoint — useful for Postman / CI smoke tests
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "IEEE SB Portal API is running." });
});

// Sprint 1 — Auth
app.use("/api/auth", authRoutes);

// Sprint 2 — Public routes (no auth required)
app.use("/api/stats",     statsRoutes);
app.use("/api/events",    eventsRoutes);
app.use("/api/units",     unitsRoutes);
app.use("/api/directory", directoryRoutes);

// Sprint 3 — Protected routes (auth + role enforced inside each router)
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/officer",       officerRoutes);
app.use("/api/member",        memberRoutes);

// Sprint 5 — Certificate automation
app.use("/api/certificates",  certificateRoutes);

// Sprint 6B — Analytics, Gallery, Minutes & Posters
app.use("/api/analytics",     analyticsRoutes);
app.use("/api/gallery",       galleryRoutes);
app.use("/api/minutes",       minutesRoutes);
app.use("/api/posters",       posterRoutes);

// Polish Sprint — Profile, Chapters, Notices
app.use("/api/user",          userRoutes);
app.use("/api/chapters",      chapterRoutes);
app.use("/api/notices",       noticeRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
// Must be registered LAST, after all routes and other middleware
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
