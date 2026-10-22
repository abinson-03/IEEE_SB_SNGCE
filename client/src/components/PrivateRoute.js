import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to /login.
 * Sprint 2+ will add role-based guard support (allowedRoles prop).
 *
 * Usage:
 *   <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
 */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role guard — if allowedRoles is specified, check membership
  if (allowedRoles && user && !allowedRoles.includes(user.globalRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
