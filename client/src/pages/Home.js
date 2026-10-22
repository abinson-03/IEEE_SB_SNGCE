import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import StatCounter from "../components/StatCounter";
import EventCard from "../components/EventCard";
import PostNoticeModal from "../components/PostNoticeModal";
import { useAuth } from "../context/AuthContext";
import { getMediaUrl } from "../utils/mediaUtils";
import "./Home.css";

const CHAPTERS = [
  {
    name: "CIS",
    label: "Computational Intelligence Society",
    desc: "Leading explorations in deep learning, evolutionary algorithms, and neural networks.",
    emoji: "🧠",
    logo: "/logos/ieee_cis_logo.png",
    badgeBg: "#ffdcc3",
    badgeColor: "#2f1500",
    color: "#904c00",
  },
  {
    name: "CS",
    label: "Computer Society",
    desc: "The flagship hub for algorithmic problem solving, open source, and full-stack engineering.",
    emoji: "💻",
    logo: "/logos/ieee_computer_society.png",
    badgeBg: "#ccdefe",
    badgeColor: "#004976",
    color: "#004976",
  },
  {
    name: "SPS",
    label: "Signal Processing Society",
    desc: "Unlocking telemetry, audio filtering, computer vision, and high-frequency communication pipelines.",
    emoji: "📡",
    logo: "/logos/ieee_sps_logo_black.png",
    badgeBg: "#e2e7ff",
    badgeColor: "#00629b",
    color: "#00629b",
  },
  {
    name: "WIE",
    label: "Women in Engineering",
    desc: "Championing women engineers and scientists through mentorship, leadership bootcamps, and grants.",
    emoji: "⚡",
    logo: null,
    badgeBg: "#dae2fd",
    badgeColor: "#414750",
    color: "#be185d",
  },
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const isOfficerOrAdmin = Boolean(
    isAuthenticated &&
    user &&
    (user.globalRole === "superadmin" ||
     user.globalRole === "execom" ||
     user.globalRole === "chapteradmin")
  );

  const [stats, setStats]           = useState(null);
  const [events, setEvents]         = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [notices, setNotices]       = useState([]);
  const [posters, setPosters]       = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice]     = useState(null);

  const handleNoticeSaved = (savedNotice, isEditing) => {
    if (isEditing) {
      setNotices((prev) =>
        prev.map((item) => (item._id === savedNotice._id ? savedNotice : item))
      );
    } else {
      setNotices((prev) => [savedNotice, ...prev]);
    }
  };

  const handleNoticeDeleted = (deletedId) => {
    setNotices((prev) => prev.filter((item) => item._id !== deletedId));
  };

  useEffect(() => {
    axiosInstance.get("/stats/public")
      .then((r) => setStats(r.data.data))
      .catch(() => {}); // fail silently — stats are non-critical

    axiosInstance.get("/events?status=published&upcoming=true&limit=4")
      .then((r) => setEvents(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingEvents(false));

    axiosInstance.get("/gallery/recent?limit=3")
      .then((r) => setHighlights(r.data.data || []))
      .catch(() => setHighlights([]));

    axiosInstance.get("/notices/public?limit=5")
      .then((r) => setNotices(r.data.data || []))
      .catch(() => setNotices([]));

    axiosInstance.get("/posters?limit=6")
      .then((r) => setPosters(r.data.data || []))
      .catch(() => setPosters([]));
  }, []);

  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__ambient-glow-1" aria-hidden="true" />
        <div className="home-hero__ambient-glow-2" aria-hidden="true" />

        <div className="container home-hero__inner">
          <div className="home-hero__text">
            {/* Official Branch Badge */}
            <div className="home-hero__verified-badge">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#ffdcc3" }}>
                verified
              </span>
              <span>IEEE Student Branch • SNGCE</span>
            </div>

            <h1 className="home-hero__title">
              Empowering Engineering Minds with{" "}
              <span className="home-hero__title-highlight">Global Excellence</span>
            </h1>
            <p className="home-hero__sub">
              Fostering technological innovation and student excellence across computer science,
              computational intelligence, robotics, and signal processing at Sree Narayana Gurukulam
              College of Engineering.
            </p>
            <div className="home-hero__actions">
              <Link to="/events" className="btn btn-primary home-hero__btn-main">
                <span>Explore Events</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
              </Link>
              <Link to="/register" className="btn btn-accent home-hero__btn-accent">
                <span>Join IEEE SB</span>
              </Link>
              <a href="#chapters-section" className="btn btn-outline--light">
                <span>Explore Chapters</span>
              </a>
            </div>
          </div>

          <div className="home-hero__graphic" aria-hidden="true">
            <div className="home-hero__ring home-hero__ring--1" />
            <div className="home-hero__ring home-hero__ring--2" />
            <div className="home-hero__ring home-hero__ring--3" />
            <div className="home-hero__emblem-card">
              <img
                src="/logos/sb_sngce_transparent.png"
                alt="IEEE SB SNGCE Emblem"
                className="home-hero__emblem-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="home-hero__ieee-mark">IEEE SB</span>
              <span className="home-hero__emblem-sub">SNGCE CHAPTERS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Impact Stats Bar (Bento Grid) ── */}
      <section className="home-stats">
        <div className="container">
          <div className="home-stats__header">
            <div className="home-stats__pulse-wrap">
              <span className="home-stats__pulse-dot" />
              <span className="home-stats__eyebrow">Chapter Impact</span>
            </div>
            <span className="home-stats__session">Session 2024-25</span>
          </div>

          <div className="home-stats__grid">
            <StatCounter
              target={stats?.totalEvents ?? 0}
              label="Events Conducted"
              icon="🎯"
            />
            <StatCounter
              target={stats?.certificatesIssued ?? 0}
              label="Certificates Issued"
              icon="🏆"
            />
            <StatCounter
              target={stats?.activeMembers ?? 0}
              label="Active Members"
              icon="👥"
            />
            <StatCounter
              target={stats?.totalChapters ?? 0}
              label="Chapters"
              icon="🔬"
              suffix=""
            />
          </div>
        </div>
      </section>

      {/* ── Public Notice Board (Sprint Polish) ── */}
      {(notices.length > 0 || isOfficerOrAdmin) && (
        <section className="section" style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", padding: "var(--sp-xl) 0" }}>
          <div className="container">
            <div className="home__section-header" style={{ marginBottom: "var(--sp-lg)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span className="badge badge-accent" style={{ marginBottom: 6 }}>Announcements</span>
                <h2 className="section-title">Notice Board</h2>
                <p className="section-subtitle">Official branch updates, chapter calls, and notifications.</p>
              </div>
              {isOfficerOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNotice(null);
                    setNoticeModalOpen(true);
                  }}
                  className="btn btn-accent"
                  style={{ fontSize: "0.85rem", padding: "8px 16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                >
                  📢 + Post Announcement
                </button>
              )}
            </div>

            {notices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--sp-xl)", background: "#fff", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>
                <p style={{ margin: 0, color: "var(--text-muted)" }}>No active announcements at the moment.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--sp-md)" }}>
                {notices.map((n) => (
                  <div
                    key={n._id}
                    className="card"
                    style={{
                      padding: "var(--sp-lg)",
                      borderTop: n.pinned ? "4px solid #904c00" : "4px solid var(--primary)",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {n.pinned && (
                      <span
                        style={{
                          position: "absolute",
                          top: 14,
                          right: 14,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: "#ffdcc3",
                          color: "#2f1500",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          border: "1px solid #ffb77d",
                        }}
                      >
                        📌 PINNED
                      </span>
                    )}
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "1.05rem",
                        color: "var(--navy)",
                        paddingRight: n.pinned ? 75 : 0,
                      }}
                    >
                      {n.title}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 var(--sp-md)",
                        fontSize: "0.88rem",
                        color: "var(--text)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-line",
                        flex: 1,
                      }}
                    >
                      {n.body}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.76rem",
                        color: "var(--text-muted)",
                        borderTop: "1px solid var(--border)",
                        paddingTop: 10,
                        marginTop: "auto",
                      }}
                    >
                      <span>
                        Posted by <strong>{n.postedBy?.name || "IEEE SB ExeCom"}</strong>
                      </span>
                      <span>
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {isOfficerOrAdmin && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: "1px dashed var(--border)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotice(n);
                            setNoticeModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{
                            padding: "4px 10px",
                            fontSize: "0.78rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            borderRadius: 4,
                          }}
                          title="Edit this announcement"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to delete "${n.title}"?`)) return;
                            try {
                              await axiosInstance.delete(`/notices/${n._id}`);
                              handleNoticeDeleted(n._id);
                            } catch (err) {
                              alert(err.response?.data?.message || "Failed to delete notice");
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid #fca5a5",
                            color: "#dc2626",
                            padding: "4px 8px",
                            fontSize: "0.78rem",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                          title="Delete this announcement"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <PostNoticeModal
            isOpen={noticeModalOpen}
            noticeToEdit={editingNotice}
            onClose={() => {
              setNoticeModalOpen(false);
              setEditingNotice(null);
            }}
            onNoticePosted={handleNoticeSaved}
            onNoticeDeleted={handleNoticeDeleted}
          />
        </section>
      )}

      {/* ── Technical Chapters Showcase with Official Logos ── */}
      <section className="section section--alt" id="chapters-section">
        <div className="container">
          <div className="home__section-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 6 }}>Societies</span>
              <h2 className="section-title">Technical Chapters</h2>
              <p className="section-subtitle">
                Four specialised chapters fostering domain excellence, research, and technical competitions.
              </p>
            </div>
            <Link to="/about" className="btn btn-outline">
              Learn About Chapters →
            </Link>
          </div>

          <div className="home-chapters__grid">
            {CHAPTERS.map((ch) => (
              <Link
                key={ch.name}
                to={`/chapters/${ch.name}`}
                className="home-chapter-card"
                style={{ "--ch-border-color": ch.color }}
              >
                <div className="home-chapter-card__header">
                  <div className="home-chapter-card__icon-wrap">
                    {ch.logo ? (
                      <img
                        src={ch.logo}
                        alt={`${ch.name} Logo`}
                        className="home-chapter-card__logo-img"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="home-chapter-card__emoji">{ch.emoji}</span>
                    )}
                  </div>
                  <span
                    className="home-chapter-card__badge"
                    style={{ backgroundColor: ch.badgeBg, color: ch.badgeColor }}
                  >
                    {ch.name}
                  </span>
                </div>

                <div className="home-chapter-card__body">
                  <h3 className="home-chapter-card__title">{ch.label}</h3>
                  <p className="home-chapter-card__desc">{ch.desc}</p>
                </div>

                <div className="home-chapter-card__footer">
                  <span className="home-chapter-card__cta">Explore Society</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    chevron_right
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ── */}
      <section className="section">
        <div className="container">
          <div className="home__section-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 6 }}>Calendar</span>
              <h2 className="section-title">Upcoming Events</h2>
              <p className="section-subtitle">Stay in the loop — workshops, seminars, hackathons and more.</p>
            </div>
            <Link to="/events" className="btn btn-outline">View All Events</Link>
          </div>

          {loadingEvents ? (
            <div className="loading-grid">
              {[1,2,3,4].map((i) => <div key={i} className="skeleton skeleton-card" />)}
            </div>
          ) : events.length > 0 ? (
            <div className="home-events__grid">
              {events.map((ev) => <EventCard key={ev._id} event={ev} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No upcoming events</h3>
              <p>Check back soon — events are added regularly.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Official Chapter Promotional Posters & Releases (Sprint 6B) ── */}
      {posters.length > 0 && (
        <section className="section" style={{ background: "#fff", borderTop: "1px solid var(--border)" }}>
          <div className="container">
            <div className="home__section-header">
              <div>
                <span className="badge badge-accent" style={{ background: "#ffedd5", color: "#9a3412", marginBottom: 6 }}>
                  Promotions
                </span>
                <h2 className="section-title">Official Chapter Posters & Releases</h2>
                <p className="section-subtitle">
                  Event creatives, call-for-participation flyers, and banners released by society creative teams.
                </p>
              </div>
              <Link to="/gallery" className="btn btn-outline">Explore Creative Media →</Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 320px))",
                gap: "var(--sp-xl)",
              }}
            >
              {posters.map((p) => (
                <div
                  key={p._id}
                  className="card"
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow-sm)",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => setSelectedPoster(p)}
                >
                  <div style={{ position: "relative", height: 260, backgroundColor: "#f8fafc", overflow: "hidden" }}>
                    <img
                      src={getMediaUrl(p.fileUrl)}
                      alt={p.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <span
                      className="badge badge-primary"
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "#004976",
                        color: "#fff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                      }}
                    >
                      {p.unit?.name || "SB"}
                    </span>
                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        background: "rgba(15, 23, 42, 0.82)",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: 4,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {p.category}
                    </span>
                  </div>

                  <div style={{ padding: "var(--sp-md)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", color: "var(--navy)" }}>{p.title}</h3>
                      {p.caption && (
                        <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                          {p.caption}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        📅 {new Date(p.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: "0.78rem", padding: "3px 10px", borderRadius: 4 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPoster(p);
                        }}
                      >
                        👁️ View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Recent Event Highlights (Sprint 6B) ── */}
      <section className="section" style={{ background: "#f8fafc", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className="home__section-header">
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 6 }}>Moments</span>
              <h2 className="section-title">Recent Event Highlights</h2>
              <p className="section-subtitle">Glimpses of recent workshops, hackathons, and technical gatherings.</p>
            </div>
            <Link to="/gallery" className="btn btn-outline">Explore Full Gallery →</Link>
          </div>

          {highlights.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 360px))",
                gap: "var(--sp-xl)",
              }}
            >
              {highlights.map((h) => (
                <Link
                  key={h.eventId}
                  to="/gallery"
                  className="card"
                  style={{
                    maxWidth: 380,
                    width: "100%",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 10",
                      position: "relative",
                      backgroundColor: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={getMediaUrl(h.coverPhoto)}
                      alt={h.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center 20%",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://placehold.co/400x260/004976/ffffff?text=IEEE+SB+SNGCE";
                      }}
                    />
                    <span
                      className="badge badge-primary"
                      style={{ position: "absolute", top: 12, left: 12, backdropFilter: "blur(4px)" }}
                    >
                      {h.unit} Chapter
                    </span>
                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        background: "rgba(0,0,0,0.75)",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: "0.76rem",
                        fontWeight: 600,
                      }}
                    >
                      📷 {h.photoCount} photo{h.photoCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ padding: "var(--sp-md)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", color: "var(--navy)", fontWeight: 700, lineHeight: 1.35 }}>
                        {h.title}
                      </h3>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        📅 {new Date(h.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 4, color: "#00629B", fontSize: "0.82rem", fontWeight: 600 }}>
                      <span>View Album</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: "var(--sp-xl)", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📸</div>
              <h3 style={{ margin: "0 0 4px", color: "var(--navy)" }}>Visit the Photo Gallery</h3>
              <p style={{ margin: "0 0 var(--sp-md)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Browse through official event photo albums, student workshops, and technical talks.
              </p>
              <Link to="/gallery" className="btn btn-primary" style={{ display: "inline-block" }}>
                Open Event Gallery
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Institutional Quick Services ── */}
      <section className="section" style={{ background: "#ffffff", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className="home-quick-services__grid">
            <div className="home-quick-service-card">
              <span className="material-symbols-outlined home-quick-service-card__icon" style={{ color: "#004976" }}>
                workspace_premium
              </span>
              <div>
                <h4 className="home-quick-service-card__title">Certificate Verification</h4>
                <p className="home-quick-service-card__text">
                  Validate official IEEE event participation credentials with Certificate IDs.
                </p>
              </div>
              <Link to="/verify-certificate" className="home-quick-service-card__link">
                Verify Now →
              </Link>
            </div>

            <div className="home-quick-service-card">
              <span className="material-symbols-outlined home-quick-service-card__icon" style={{ color: "#904c00" }}>
                badge
              </span>
              <div>
                <h4 className="home-quick-service-card__title">Member Directory</h4>
                <p className="home-quick-service-card__text">
                  Connect with student members, ExeCom officers, and chapter leaders.
                </p>
              </div>
              <Link to="/directory" className="home-quick-service-card__link">
                View Roster →
              </Link>
            </div>

            <div className="home-quick-service-card">
              <span className="material-symbols-outlined home-quick-service-card__icon" style={{ color: "#00629b" }}>
                diversity_3
              </span>
              <div>
                <h4 className="home-quick-service-card__title">Executive Workspace</h4>
                <p className="home-quick-service-card__text">
                  Authorized portal for chapter admins, event duty tracking, and CMS.
                </p>
              </div>
              <Link to="/login" className="home-quick-service-card__link">
                Officer Login →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="home-cta">
        <div className="container home-cta__inner">
          <h2>Ready to be part of something bigger?</h2>
          <p>Join IEEE SB SNGCE and connect with passionate innovators and researchers.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "1rem" }}>
            <Link to="/register" className="btn btn-accent" style={{ background: "#ffdcc3", color: "#2f1500", border: "none" }}>
              Join IEEE SB Now
            </Link>
            <Link to="/about" className="btn btn-outline--light">
              About Student Branch
            </Link>
          </div>
        </div>
      </section>
      {/* ── Poster Lightbox Modal ── */}
      {selectedPoster && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
            padding: "var(--sp-md)", backdropFilter: "blur(4px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setSelectedPoster(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 820, width: "100%", maxHeight: "92vh", display: "flex", flexDirection: "column",
              overflow: "hidden", padding: 0, background: "#fff", borderRadius: "var(--radius)",
            }}
          >
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-primary">{selectedPoster.unit?.name || "SB"}</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--navy)" }}>{selectedPoster.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoster(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#0f172a", textAlign: "center", padding: 12, overflow: "auto", maxHeight: "65vh" }}>
              <img
                src={getMediaUrl(selectedPoster.fileUrl)}
                alt={selectedPoster.title}
                style={{ maxHeight: "60vh", maxWidth: "100%", objectFit: "contain", borderRadius: 4 }}
              />
            </div>

            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                {selectedPoster.caption && (
                  <p style={{ margin: "0 0 4px", fontSize: "0.88rem", color: "var(--text)" }}>{selectedPoster.caption}</p>
                )}
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Released by <strong>{selectedPoster.releasedBy?.name || "Design Lead"}</strong> on{" "}
                  {new Date(selectedPoster.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={getMediaUrl(selectedPoster.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: "0.85rem", padding: "6px 14px", textDecoration: "none" }}
                  download
                >
                  ⬇️ Download Poster
                </a>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedPoster(null)}
                  style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
