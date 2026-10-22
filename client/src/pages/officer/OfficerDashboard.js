import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout    from "../../components/DashboardLayout";
import OfficerDuties      from "./OfficerDuties";
import OfficerTasks       from "./OfficerTasks";
import OfficerJoinRequests from "./OfficerJoinRequests";
import OfficerEvents      from "./OfficerEvents";
import OfficerMembers     from "./OfficerMembers";
import OfficerCerts       from "./OfficerCerts";
import AdminMinutes       from "../admin/AdminMinutes";
import AdminCMS           from "../admin/AdminCMS";
import OfficerPosters     from "./OfficerPosters";
import AnalyticsPage      from "../AnalyticsPage";
import MemberProfile      from "../member/MemberProfile";
import { useAuth }        from "../../context/AuthContext";

const OfficerDashboard = () => {
  const { user } = useAuth();
  const isChapterAdmin = user?.globalRole === "chapteradmin";

  const navItems = [
    { label: "My Duties",         path: "/officer",               icon: "🎖️", end: true },
    ...(isChapterAdmin ? [{ label: "ExeCom & Positions", path: "/officer/cms", icon: "🏛️" }] : []),
    { label: "Officer Tasks",     path: "/officer/tasks",         icon: "📋" },
    { label: "Join Requests",     path: "/officer/join-requests", icon: "🤝" },
    { label: "My Events",         path: "/officer/events",        icon: "🗓️" },
    { label: "Member List",       path: "/officer/members",       icon: "👥" },
    { label: "Certificate Queue", path: "/officer/certificates",  icon: "🏆" },
    { label: "Meeting Minutes",   path: "/officer/minutes",       icon: "📝" },
    { label: "Posters Log",       path: "/officer/posters",       icon: "🎨" },
    { label: "Analytics",         path: "/officer/analytics",     icon: "📊" },
    { label: "My Profile",        path: "/officer/profile",       icon: "👤" },
  ];

  return (
    <DashboardLayout title="Officer Dashboard" navItems={navItems} color="#00629B">
      <Routes>
        <Route index                element={<OfficerDuties />} />
        <Route path="cms"           element={<AdminCMS />} />
        <Route path="tasks"         element={<OfficerTasks />} />
        <Route path="join-requests" element={<OfficerJoinRequests />} />
        <Route path="events"        element={<OfficerEvents />} />
        <Route path="my-events"     element={<OfficerEvents />} />
        <Route path="members"       element={<OfficerMembers />} />
        <Route path="certs"         element={<OfficerCerts />} />
        <Route path="certificates"   element={<OfficerCerts />} />
        <Route path="minutes"       element={<AdminMinutes />} />
        <Route path="posters"       element={<OfficerPosters />} />
        <Route path="analytics"     element={<AnalyticsPage />} />
        <Route path="profile"       element={<MemberProfile />} />
        <Route path="*"             element={<Navigate to="/officer" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default OfficerDashboard;
