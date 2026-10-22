import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import UserAvatar from "./UserAvatar";
import "./Navbar.css";

const CHAPTERS = [
  { name: "CIS", label: "Computational Intelligence" },
  { name: "CS",  label: "Computer Society" },
  { name: "SPS", label: "Signal Processing" },
  { name: "WIE", label: "Women in Engineering" },
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`} role="navigation" aria-label="Main navigation">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={close}>
          <img
            src="/logos/sb_sngce_transparent.png"
            alt="IEEE SB SNGCE Logo"
            className="navbar__logo-img"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="navbar__logo-text-group">
            <span className="navbar__logo-main">
              <span className="navbar__logo-ieee">IEEE SB</span>
              <span className="navbar__logo-sb"> SNGCE</span>
            </span>
            <span className="navbar__logo-sub">Student Branch</span>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="navbar__links">
          <li><NavLink to="/" end className={({ isActive }) => isActive ? "navbar__link active" : "navbar__link"}>Home</NavLink></li>
          <li><NavLink to="/about" className={({ isActive }) => isActive ? "navbar__link active" : "navbar__link"}>About</NavLink></li>

          {/* Chapters dropdown */}
          <li className="navbar__dropdown-wrap">
            <button className="navbar__link navbar__dropdown-btn" aria-haspopup="true">
              Chapters <span className="navbar__caret">▾</span>
            </button>
            <ul className="navbar__dropdown">
              {CHAPTERS.map((ch) => (
                <li key={ch.name}>
                  <Link to={`/chapters/${ch.name}`} className="navbar__dropdown-link">
                    <span className="navbar__dropdown-name">{ch.name}</span>
                    <span className="navbar__dropdown-sub">{ch.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          <li><NavLink to="/events" className={({ isActive }) => isActive ? "navbar__link active" : "navbar__link"}>Events</NavLink></li>
          <li><NavLink to="/gallery" className={({ isActive }) => isActive ? "navbar__link active" : "navbar__link"}>Gallery</NavLink></li>
          <li><NavLink to="/directory" className={({ isActive }) => isActive ? "navbar__link active" : "navbar__link"}>Directory</NavLink></li>
        </ul>

        {/* Right-side: notification bell + CTA or user pill */}
        <div className="navbar__right">
          <NotificationBell />

          {isAuthenticated ? (
            <div className="navbar__user-menu" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <UserAvatar
                src={user?.profilePhoto}
                name={user?.name}
                size={32}
              />
              <span className="navbar__user-pill" title={user?.email}>
                {user?.name?.split(" ")[0]}
              </span>
              <Link
                to="/dashboard"
                className="btn btn-primary navbar__cta"
                style={{
                  fontSize: "0.82rem",
                  padding: "0.4rem 0.85rem",
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                📊 Dashboard
              </Link>
              <button
                className="btn btn-outline--light navbar__cta"
                onClick={logout}
                style={{ fontSize: "0.82rem", padding: "0.4rem 0.9rem" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary navbar__cta">Sign In</Link>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`navbar__hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile${menuOpen ? " open" : ""}`}>
        <NavLink to="/" end onClick={close} className="navbar__mobile-link">Home</NavLink>
        <NavLink to="/about" onClick={close} className="navbar__mobile-link">About</NavLink>
        <div className="navbar__mobile-section">Chapters</div>
        {CHAPTERS.map((ch) => (
          <Link key={ch.name} to={`/chapters/${ch.name}`} onClick={close} className="navbar__mobile-link navbar__mobile-link--sub">
            {ch.name} — {ch.label}
          </Link>
        ))}
        <NavLink to="/events" onClick={close} className="navbar__mobile-link">Events</NavLink>
        <NavLink to="/gallery" onClick={close} className="navbar__mobile-link">Gallery</NavLink>
        <NavLink to="/directory" onClick={close} className="navbar__mobile-link">Directory</NavLink>

        <div style={{ margin: "1rem 1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={close} className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
                📊 Dashboard
              </Link>
              <button className="btn btn-outline--light" onClick={() => { logout(); close(); }}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={close} className="btn btn-primary">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
