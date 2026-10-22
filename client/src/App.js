import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth context
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Route guards
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home        from "./pages/Home";
import About       from "./pages/About";
import ChapterPage from "./pages/ChapterPage";
import Events      from "./pages/Events";
import Directory   from "./pages/Directory";
import GalleryPage from "./pages/GalleryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import VerifyCertificatePage from "./pages/VerifyCertificatePage";

// Auth pages
import LoginPage          from "./pages/LoginPage";
import RegisterPage       from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage  from "./pages/ResetPasswordPage";

// Role dashboards (Sprint 3) — each includes nested Routes internally
import AdminDashboard   from "./pages/admin/AdminDashboard";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import MemberDashboard  from "./pages/member/MemberDashboard";

// Sprint 4 pages
import EventDetailPage from "./pages/EventDetailPage";
import CheckInPage     from "./pages/CheckInPage";

// ── Layout wrappers ───────────────────────────────────────────────────────────
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

const AuthLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

/**
 * SmartDashboardRedirect
 * Reads the logged-in user's globalRole and sends them to their
 * role-appropriate dashboard. Unauthenticated → /login.
 */
const SmartDashboardRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.globalRole === "superadmin")    return <Navigate to="/admin" replace />;
  if (user?.globalRole === "chapteradmin") return <Navigate to="/officer" replace />;
  if (user?.globalRole === "execom")        return <Navigate to="/officer" replace />;
  return <Navigate to="/member" replace />;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                   element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/about"              element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/chapters/:unitName" element={<PublicLayout><ChapterPage /></PublicLayout>} />
        <Route path="/events"             element={<PublicLayout><Events /></PublicLayout>} />
        <Route path="/directory"          element={<PublicLayout><Directory /></PublicLayout>} />
        <Route path="/gallery"            element={<PublicLayout><GalleryPage /></PublicLayout>} />
        <Route path="/verify-certificate" element={<PublicLayout><VerifyCertificatePage /></PublicLayout>} />
        <Route path="/analytics"          element={<ProtectedRoute allowedRoles={["execom", "chapteradmin", "superadmin"]}><PublicLayout><AnalyticsPage /></PublicLayout></ProtectedRoute>} />

        {/* ── Sprint 4: Event detail & Check-in ── */}
        <Route path="/events/:id"           element={<PublicLayout><EventDetailPage /></PublicLayout>} />
        {/* Check-in is a standalone mobile page — no Navbar/Footer */}
        <Route path="/checkin/:eventId"     element={<CheckInPage />} />

        {/* ── Auth ── */}
        <Route path="/login"           element={<AuthLayout><LoginPage /></AuthLayout>} />
        <Route path="/register"        element={<AuthLayout><RegisterPage /></AuthLayout>} />
        <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
        <Route path="/reset-password"  element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />

        {/* ── Protected Dashboards ── */}

        {/* Super Admin — /admin — ONLY superadmin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Officer — /officer — execom + chapteradmin + superadmin */}
        <Route
          path="/officer/*"
          element={
            <ProtectedRoute allowedRoles={["execom", "chapteradmin", "superadmin"]}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Member — /member — ONLY member (not execom or superadmin) */}
        <Route
          path="/member/*"
          element={
            <ProtectedRoute allowedRoles={["member"]}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />

        {/* /dashboard → smart redirect to role-correct dashboard */}
        <Route
          path="/dashboard"
          element={<SmartDashboardRedirect />}
        />

        {/* ── 403 ── */}
        <Route path="/unauthorized" element={
          <PublicLayout>
            <div className="empty-state" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="empty-icon">🚫</div>
              <h3>403 — Unauthorized</h3>
              <p>You do not have permission to view this page.</p>
              <a href="/" className="btn btn-outline mt-md" style={{ alignSelf: "center" }}>Go Home</a>
            </div>
          </PublicLayout>
        } />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
