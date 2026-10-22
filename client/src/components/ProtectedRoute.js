import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Two-layer guard:
 *   1. Not authenticated  → redirect to /login
 *   2. Wrong role        → redirect to /unauthorized
 *
 * Props:
 *   allowedRoles {string[]}  e.g. ["superadmin"] or ["execom", "superadmin"]
 *   children     {ReactNode}
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Wait for auth context to finish initialising (avoids flash-redirect on refresh)
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.globalRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
