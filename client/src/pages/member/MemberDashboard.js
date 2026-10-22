import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import MemberEvents    from "./MemberEvents";
import MemberCerts     from "./MemberCerts";
import MemberProfile   from "./MemberProfile";
import MemberDirectory from "./MemberDirectory";

const NAV_ITEMS = [
  { label: "My Events",         path: "/member",                 icon: "🗓️", end: true },
  { label: "My Certificates",   path: "/member/my-certificates", icon: "🏆" },
  { label: "Profile",           path: "/member/profile",         icon: "👤" },
  { label: "Member Directory",  path: "/member/directory",       icon: "👥" },
];

const MemberDashboard = () => (
  <DashboardLayout title="Member Dashboard" navItems={NAV_ITEMS} color="#7c3aed">
    <Routes>
      <Route index                 element={<MemberEvents />} />
      <Route path="my-events"       element={<MemberEvents />} />
      <Route path="events"         element={<MemberEvents />} />
      <Route path="certs"          element={<MemberCerts />} />
      <Route path="my-certificates" element={<MemberCerts />} />
      <Route path="certificates"   element={<MemberCerts />} />
      <Route path="profile"        element={<MemberProfile />} />
      <Route path="directory"      element={<MemberDirectory />} />
      <Route path="*"              element={<Navigate to="/member" replace />} />
    </Routes>
  </DashboardLayout>
);

export default MemberDashboard;
