import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import AdminOverview from "./AdminOverview";
import AdminUsers    from "./AdminUsers";
import AdminCMS      from "./AdminCMS";
import AdminBudget   from "./AdminBudget";
import AdminMinutes  from "./AdminMinutes";
import AdminAudit    from "./AdminAudit";
import OfficerEvents from "../officer/OfficerEvents";
import OfficerJoinRequests from "../officer/OfficerJoinRequests";
import AnalyticsPage from "../AnalyticsPage";
import MemberProfile from "../member/MemberProfile";

const NAV_ITEMS = [
  { label: "System Overview",     path: "/admin",        icon: "📊", end: true },
  { label: "Events & Attendance", path: "/admin/events", icon: "🗓️" },
  { label: "Analytics & Insights",path: "/admin/analytics", icon: "📈" },
  { label: "Join Requests",       path: "/admin/join-requests", icon: "🤝" },
  { label: "User Management",     path: "/admin/users",  icon: "👥" },
  { label: "Promotion CMS",       path: "/admin/cms",    icon: "📋" },
  { label: "Budget Review",       path: "/admin/budget", icon: "💰" },
  { label: "Meeting Minutes",     path: "/admin/minutes",icon: "📝" },
  { label: "Audit Trail",         path: "/admin/audit",  icon: "🔍" },
  { label: "My Profile",          path: "/admin/profile",icon: "👤" },
];

const AdminDashboard = () => (
  <DashboardLayout title="Admin Panel" navItems={NAV_ITEMS} color="#1a2744">
    <Routes>
      <Route index          element={<AdminOverview />} />
      <Route path="events"  element={<OfficerEvents />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="join-requests" element={<OfficerJoinRequests isAdmin={true} />} />
      <Route path="users"   element={<AdminUsers />} />
      <Route path="cms"     element={<AdminCMS />} />
      <Route path="budget"  element={<AdminBudget />} />
      <Route path="minutes" element={<AdminMinutes />} />
      <Route path="audit"   element={<AdminAudit />} />
      <Route path="profile" element={<MemberProfile />} />
      <Route path="*"       element={<Navigate to="/admin" replace />} />
    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;
