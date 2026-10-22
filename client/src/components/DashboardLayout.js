import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import "./DashboardLayout.css";

/**
 * DashboardLayout
 * Shared shell for Admin, Officer, and Member dashboards.
 *
 * Props:
 *   title    {string}     Dashboard title shown in sidebar header
 *   navItems {Array}      [{ label, path, icon }]
 *   children {ReactNode}  Page content
 *   color    {string}     Sidebar accent colour (CSS value)
 */
const DashboardLayout = ({ title, navItems = [], children, color = "var(--primary)" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dash-shell">
      {/* Mobile top bar */}
      <div className="dash-topbar" style={{ borderBottomColor: color }}>
        <button
          className="dash-topbar__hamburger"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className="dash-topbar__title">{title}</span>
        <Link to="/" className="dash-topbar__home" title="Back to site">🏠</Link>
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? " open" : ""}`} style={{ "--dash-accent": color }}>
        <div className="dash-sidebar__header">
          <Link to="/" className="dash-sidebar__brand">
            <span className="dash-sidebar__ieee">IEEE</span>
            <span className="dash-sidebar__sb"> SB SNGCE</span>
          </Link>
          <span className="dash-sidebar__dashboard-label">{title}</span>
        </div>

        <nav className="dash-sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `dash-sidebar__link${isActive ? " active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="dash-sidebar__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar__footer">
          <div className="dash-sidebar__user">
            <UserAvatar
              src={user?.profilePhoto}
              name={user?.name}
              size={38}
              className="dash-sidebar__avatar"
              style={{ padding: 0 }}
            />
            <div className="dash-sidebar__user-info">
              <span className="dash-sidebar__user-name">{user?.name}</span>
              <span className="dash-sidebar__user-role">{user?.globalRole}</span>
            </div>
          </div>
          <button className="dash-sidebar__logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
