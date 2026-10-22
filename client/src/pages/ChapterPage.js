import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/UserAvatar";
import PostNoticeModal from "../components/PostNoticeModal";
import { getMediaUrl } from "../utils/mediaUtils";
import "./ChapterPage.css";

const CHAPTERS_LIST = ["CIS", "CS", "SPS", "WIE"];

const CHAPTER_META = {
  CIS: {
    emoji: "🧠",
    icon: "psychology",
    color: "#904c00",
    bgGradient: "linear-gradient(135deg, #131b2e 0%, #3d2000 60%, #904c00 100%)",
    full: "Computational Intelligence Society",
    tagline: "Advancing Artificial Intelligence, Machine Learning & Neural Systems",
    code: "IEEE CIS SBC SNGCE",
    logo: "/logos/ieee_cis_logo.png",
    badgeBg: "#ffdcc3",
    badgeColor: "#2f1500",
    focusPills: [
      { icon: "neurology", label: "Neural Nets" },
      { icon: "schema", label: "Fuzzy Logic" },
      { icon: "memory", label: "Bio-AI" },
    ],
  },
  CS: {
    emoji: "💻",
    icon: "terminal",
    color: "#004976",
    bgGradient: "linear-gradient(135deg, #131b2e 0%, #003354 60%, #004976 100%)",
    full: "Computer Society",
    tagline: "Advancing Computing Science, Software Architecture & Open Source",
    code: "IEEE CS SBC SNGCE",
    logo: "/logos/ieee_computer_society.png",
    badgeBg: "#ccdefe",
    badgeColor: "#004976",
    focusPills: [
      { icon: "code", label: "Algorithms" },
      { icon: "cloud", label: "Cloud Systems" },
      { icon: "terminal", label: "Open Source" },
    ],
  },
  SPS: {
    emoji: "📡",
    icon: "graphic_eq",
    color: "#00629b",
    bgGradient: "linear-gradient(135deg, #131b2e 0%, #002942 60%, #00629b 100%)",
    full: "Signal Processing Society",
    tagline: "Unlocking Telemetry, Audio DSP, Computer Vision & Antenna Pipelines",
    code: "IEEE SPS SBC SNGCE",
    logo: "/logos/ieee_sps_logo_black.png",
    badgeBg: "#e2e7ff",
    badgeColor: "#00629b",
    focusPills: [
      { icon: "graphic_eq", label: "Audio & DSP" },
      { icon: "visibility", label: "Vision AI" },
      { icon: "sensors", label: "Telemetry" },
    ],
  },
  WIE: {
    emoji: "⚡",
    icon: "diamond",
    color: "#be185d",
    bgGradient: "linear-gradient(135deg, #131b2e 0%, #4a0429 60%, #be185d 100%)",
    full: "Women in Engineering",
    tagline: "Championing Women Engineers & Scientists Through Leadership & Grants",
    code: "IEEE WIE AG SNGCE",
    logo: null,
    badgeBg: "#dae2fd",
    badgeColor: "#414750",
    focusPills: [
      { icon: "supervisor_account", label: "Mentorship" },
      { icon: "military_tech", label: "Leadership" },
      { icon: "school", label: "STEM Grants" },
    ],
  },
  SB: {
    emoji: "🏛️",
    icon: "verified",
    color: "#004976",
    bgGradient: "linear-gradient(135deg, #131b2e 0%, #004976 100%)",
    full: "Student Branch",
    tagline: "Official IEEE Student Branch SNGCE Hub",
    code: "IEEE SB SNGCE",
    logo: "/logos/sb_sngce_transparent.png",
    badgeBg: "#eaedff",
    badgeColor: "#004976",
    focusPills: [
      { icon: "groups", label: "Leadership" },
      { icon: "event", label: "Innovation" },
      { icon: "school", label: "Excellence" },
    ],
  },
};

const ChapterPage = () => {
  const { unitName } = useParams();
  const name = unitName?.toUpperCase();
  const meta = CHAPTER_META[name] || CHAPTER_META.CS;
  const { isAuthenticated, user, updateUser } = useAuth();

  const [unit, setUnit]         = useState(null);
  const [events, setEvents]     = useState([]);
  const [officers, setOfficers] = useState([]);
  const [chapterAlbums, setChapterAlbums] = useState([]);
  const [notices, setNotices]   = useState([]);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const isOfficerOrAdmin = Boolean(
    isAuthenticated &&
    user &&
    (user.globalRole === "superadmin" ||
     user.globalRole === "execom" ||
     user.globalRole === "chapteradmin")
  );

  const isChapterFacultyOrAdmin = Boolean(
    isAuthenticated &&
    user &&
    (user.globalRole === "superadmin" ||
     (user.globalRole === "chapteradmin" &&
      ((user.chapterMemberships || []).some(
        (ch) => (ch.name || ch) === name || (ch._id || ch) === unit?._id
      ) ||
       officers.some(
         (o) =>
           (o.userId === user._id || o.name === user.name) &&
           /advisor|chair/i.test(o.positionName || "")
       ))))
  );

  const canReleasePosters = Boolean(
    isAuthenticated &&
    user &&
    (user.globalRole === "superadmin" ||
     (user.globalRole === "chapteradmin" &&
      ((user.chapterMemberships || []).some(
        (ch) => (ch.name || ch) === name || (ch._id || ch) === unit?._id
      ) ||
       officers.some(
         (o) =>
           (o.userId === user._id || o.name === user.name) &&
           /advisor|chair/i.test(o.positionName || "")
       ))) ||
     officers.some(
       (o) =>
         (o.userId === user._id || o.name === user.name) &&
         /chair|advisor|counselor|design|creative|marketing|webmaster/i.test(o.positionName || "")
     ))
  );

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

  const [joinLoading, setJoinLoading]         = useState(false);
  const [joinSuccess, setJoinSuccess]         = useState("");
  const [joinError, setJoinError]             = useState("");
  const [shareFeedback, setShareFeedback]     = useState("");
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestInfo, setPendingRequestInfo] = useState(null);
  const [dbIsMember, setDbIsMember]           = useState(false);

  // Posters showcase state
  const [chapterPosters, setChapterPosters]   = useState([]);
  const [selectedPoster, setSelectedPoster]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setJoinSuccess("");
    setJoinError("");
    setShareFeedback("");
    setHasPendingRequest(false);
    setPendingRequestInfo(null);
    setDbIsMember(false);

    // Fetch unit by name
    axiosInstance.get(`/units/${name}`)
      .then((r) => {
        const u = r.data.data;
        setUnit(u);
        // Parallel: chapter events + officers + gallery moments + notices + posters + membership status
        const promises = [
          axiosInstance.get(`/events?unit=${name}&status=published`),
          axiosInstance.get(`/units/${u._id}/officers`),
          axiosInstance.get("/gallery").catch(() => ({ data: { data: [] } })),
          axiosInstance.get("/notices/public?limit=10").catch(() => ({ data: { data: [] } })),
          axiosInstance.get(`/posters?unit=${name}`).catch(() => ({ data: { data: [] } })),
        ];

        if (isAuthenticated) {
          promises.push(
            axiosInstance.get(`/chapters/${name}/my-status`).catch(() => ({ data: { success: false } }))
          );
        }

        return Promise.all(promises);
      })
      .then(([evRes, officerRes, galleryRes, noticeRes, posterRes, statusRes]) => {
        setEvents(evRes.data.data || []);
        setOfficers(officerRes.data.data || []);
        const allAlbums = galleryRes.data?.data || [];
        setChapterAlbums(allAlbums.filter((a) => a.unit === name));
        setNotices(noticeRes.data?.data || []);
        setChapterPosters(posterRes.data?.data || []);

        if (statusRes?.data?.success && statusRes.data.data) {
          const { isMember, hasPendingRequest, pendingRequest, userChapterMemberships } = statusRes.data.data;
          setDbIsMember(isMember);
          setHasPendingRequest(hasPendingRequest);
          setPendingRequestInfo(pendingRequest);
          if (isMember && updateUser && userChapterMemberships) {
            updateUser({ chapterMemberships: userChapterMemberships });
          }
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Chapter not found.");
      })
      .finally(() => setLoading(false));
  }, [name, isAuthenticated, updateUser]);

  const handleJoinRequest = async () => {
    if (!unit?._id && !name) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      const res = await axiosInstance.post(`/chapters/${unit?._id || name}/join-request`);
      setJoinSuccess(res.data.message || `Request to join ${name} submitted!`);
      setHasPendingRequest(true);
      setPendingRequestInfo(res.data.data);
    } catch (err) {
      setJoinError(err.response?.data?.message || "Failed to submit join request.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCopyOfficerLink = (officerName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareFeedback(`Officer profile link for ${officerName} copied!`);
      setTimeout(() => setShareFeedback(""), 3000);
    }
  };

  // Determine if current user is already in this chapter
  const isMember = dbIsMember || user?.chapterMemberships?.some((ch) => {
    if (typeof ch === "string") return ch === unit?._id?.toString();
    return ch?._id?.toString() === unit?._id?.toString() || ch?.name === name;
  });

  if (loading) return (
    <div className="flex-center" style={{ minHeight: "50vh" }}>
      <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%" }} />
    </div>
  );

  if (error) return (
    <div className="empty-state" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="empty-icon">⚠️</div>
      <h3>Chapter not found</h3>
      <p>{error}</p>
      <Link to="/" className="btn btn-outline mt-md" style={{ alignSelf: "center" }}>Go Home</Link>
    </div>
  );

  const rawCover = unit?.coverImage || unit?.bannerImage;
  const coverStyle = rawCover
    ? { backgroundImage: `url('${getMediaUrl(rawCover)}')` }
    : { background: meta.bgGradient || "linear-gradient(135deg, #131b2e 0%, #004976 60%, #00629b 100%)" };

  return (
    <div className="chapter-page">
      <div className="container">

        {/* ── Chapter Switcher Ribbon ── */}
        <div className="chapter-ribbon" role="navigation" aria-label="Chapter selector">
          {CHAPTERS_LIST.map((cName) => {
            const isSelected = name === cName;
            return (
              <Link
                key={cName}
                to={`/chapters/${cName}`}
                className={`chapter-ribbon__item ${isSelected ? "chapter-ribbon__item--active" : ""}`}
              >
                <span>{cName}</span>
                <span style={{ fontSize: "0.72rem", opacity: 0.85 }}>Chapter</span>
              </Link>
            );
          })}
        </div>

        {/* ── Chapter Hero Banner Card ── */}
        <div className="chapter-hero-card">
          <div className="chapter-hero-card__banner" style={coverStyle}>
            <div className="chapter-hero-card__overlay" />

            <div className="chapter-hero-card__top-badges">
              <span
                className="chapter-hero-card__code-badge"
                style={{ backgroundColor: meta.badgeBg, color: meta.badgeColor }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {meta.icon || "verified"}
                </span>
                <span>{meta.code || `IEEE ${name} SBC SNGCE`}</span>
              </span>

              <span className="chapter-hero-card__active-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#904c00" }}>
                  verified
                </span>
                <span>Active Chapter</span>
              </span>
            </div>

            <div className="chapter-hero-card__content">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {meta.logo && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                      height: "46px"
                    }}
                  >
                    <img
                      src={meta.logo}
                      alt={`${name} Official Logo`}
                      style={{ maxHeight: "34px", maxWidth: "150px", objectFit: "contain" }}
                    />
                  </div>
                )}
                <h1 className="chapter-hero-card__title" style={{ margin: 0 }}>
                  {unit?.name || meta.full}
                </h1>
              </div>
              <p className="chapter-hero-card__tagline">
                {unit?.description || meta.tagline}
              </p>
            </div>
          </div>

          <div className="chapter-hero-card__bottom-bar">
            <div className="chapter-hero-card__member-count">
              <div className="chapter-hero-card__member-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  groups
                </span>
              </div>
              <div>
                <div className="chapter-hero-card__member-num">
                  {unit?.membersCount || "86"}
                </div>
                <div className="chapter-hero-card__member-label">Active Members</div>
              </div>
            </div>

            <div className="chapter-hero-card__session-badge">
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#ffdcc3",
                  display: "inline-block",
                }}
              />
              <span>AY 2024–25 Active</span>
            </div>
          </div>
        </div>

        {/* Share feedback toast */}
        {shareFeedback && (
          <div
            style={{
              padding: "10px 16px",
              background: "#e2e7ff",
              color: "#004976",
              borderRadius: "var(--radius)",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "var(--sp-md)",
            }}
          >
            ✓ {shareFeedback}
          </div>
        )}

        {/* ── Mission & Focus ── */}
        <section className="chapter-mission-card">
          <div className="chapter-section-header">
            <h2 className="chapter-section-title">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#004976" }}>
                flag
              </span>
              <span>Mission &amp; Focus</span>
            </h2>
            <span className="chapter-section-badge">{name} CORE</span>
          </div>

          <p className="chapter-mission-text">
            {unit?.description ||
              `IEEE ${name} Student Branch Chapter at SNGCE pioneers engineering research, technical excellence, hands-on symposia, and global professional networking.`}
          </p>

          <div className="chapter-focus-pills">
            {meta.focusPills.map((pill, idx) => (
              <div key={idx} className="chapter-focus-pill">
                <span className="material-symbols-outlined chapter-focus-pill__icon">
                  {pill.icon}
                </span>
                <span className="chapter-focus-pill__label">{pill.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Executive Committee ── */}
        <section style={{ marginBottom: "var(--sp-xl)" }}>
          <div className="chapter-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h2 className="chapter-section-title">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: meta.color || "#004976" }}>
                shield_person
              </span>
              <span>Executive Committee</span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                2025–2026
              </span>
              {isChapterFacultyOrAdmin && (
                <Link
                  to={user?.globalRole === "superadmin" ? `/admin/cms?unit=${unit?._id}` : `/officer/cms`}
                  className="btn btn-outline"
                  style={{
                    fontSize: "0.8rem",
                    padding: "4px 12px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: meta.color || "var(--primary)",
                    borderColor: meta.color || "var(--primary)",
                    textDecoration: "none",
                  }}
                  title="Update & Assign Chapter ExeCom Positions"
                >
                  ⚙️ Manage ExeCom & Positions
                </Link>
              )}
            </div>
          </div>

          {officers.length > 0 ? (
            <div className="chapter-officers-grid">
              {officers.map((o) => {
                const isChair = o.positionName?.toLowerCase().includes("chair");
                return (
                  <div key={o.assignmentId || o._id} className="chapter-officer-card">
                    <div className="chapter-officer-card__avatar">
                      <UserAvatar
                        src={o.profilePhoto}
                        name={o.name}
                        size={64}
                      />
                    </div>
                    <h4 className="chapter-officer-card__name" title={o.name}>
                      {o.name}
                    </h4>
                    <span className="chapter-officer-card__dept">
                      {o.academicYear || "Executive Member"}
                    </span>

                    <span
                      className={`chapter-officer-card__role-badge ${
                        isChair
                          ? "chapter-officer-card__role-badge--chair"
                          : "chapter-officer-card__role-badge--regular"
                      }`}
                    >
                      {isChair && <span>★</span>}
                      <span>{o.positionName}</span>
                    </span>

                    <div className="chapter-officer-card__actions">
                      <button
                        type="button"
                        onClick={() => handleCopyOfficerLink(o.name)}
                        className="chapter-officer-card__btn"
                        title={`Share profile for ${o.name}`}
                        aria-label="Share profile"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          share
                        </span>
                      </button>

                      {o.email && (
                        <a
                          href={`mailto:${o.email}`}
                          className="chapter-officer-card__btn"
                          title={`Email ${o.name}`}
                          aria-label="Email officer"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            mail
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: "var(--sp-xl)", textAlign: "center", marginBottom: "var(--sp-xl)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🪑</div>
              <h3 style={{ margin: "0 0 4px", color: "var(--navy)" }}>Officers not yet assigned</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                The ExeCom for this chapter will be announced soon. Check back later!
              </p>
            </div>
          )}
        </section>

        {/* ── Chapter Announcements & Notices ── */}
        {(notices.length > 0 || isOfficerOrAdmin) && (
          <section style={{ marginBottom: "var(--sp-xl)" }}>
            <div className="chapter-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="chapter-section-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: meta.color || "#004976" }}>
                  campaign
                </span>
                <span>Announcements & Notices</span>
              </h2>
              {isOfficerOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNotice(null);
                    setNoticeModalOpen(true);
                  }}
                  className="btn btn-outline"
                  style={{
                    fontSize: "0.82rem",
                    padding: "6px 12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: meta.color || "var(--primary)",
                    borderColor: meta.color || "var(--primary)",
                  }}
                >
                  📢 + Post Announcement
                </button>
              )}
            </div>

            {notices.length === 0 ? (
              <div className="card" style={{ padding: "var(--sp-lg)", textAlign: "center", color: "var(--text-muted)" }}>
                No active announcements for {name} chapter at the moment.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--sp-md)" }}>
                {notices.map((n) => (
                  <div
                    key={n._id}
                    className="card"
                    style={{
                      padding: "var(--sp-lg)",
                      borderTop: n.pinned ? `4px solid ${meta.color || "#904c00"}` : "4px solid var(--border)",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#fff",
                    }}
                  >
                    {n.pinned && (
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background: meta.badgeBg || "#ffdcc3",
                          color: meta.badgeColor || "#2f1500",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                        }}
                      >
                        📌 PINNED
                      </span>
                    )}
                    <h3 style={{ margin: "0 0 6px", fontSize: "1rem", color: "var(--navy)", paddingRight: n.pinned ? 70 : 0 }}>
                      {n.title}
                    </h3>
                    <p style={{ margin: "0 0 var(--sp-md)", fontSize: "0.86rem", color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-line", flex: 1 }}>
                      {n.body}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      <span>By <strong>{n.postedBy?.name || "IEEE SB ExeCom"}</strong></span>
                      <span>{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>

                    {isOfficerOrAdmin && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8, paddingTop: 6, borderTop: "1px dashed var(--border)" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotice(n);
                            setNoticeModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: "3px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4, borderRadius: 4 }}
                          title="Edit announcement"
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
                            padding: "3px 7px",
                            fontSize: "0.75rem",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                          title="Delete announcement"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Chapter Activities (Events) ── */}
        <section className="chapter-activities">
          <div className="chapter-section-header">
            <h2 className="chapter-section-title">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#004976" }}>
                calendar_month
              </span>
              <span>Chapter Activities</span>
            </h2>
            <Link to={`/events?unit=${name}`} className="chapter-activities__header-link">
              <span>View Schedule</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                chevron_right
              </span>
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="chapter-activities__list">
              {events.slice(0, 4).map((ev) => {
                const eventDate = new Date(ev.date || ev.startDate || Date.now());
                const month = eventDate.toLocaleDateString("en-US", { month: "short" });
                const day = eventDate.toLocaleDateString("en-US", { day: "2-digit" });

                return (
                  <div key={ev._id} className="chapter-activity-card">
                    <div className="chapter-activity-card__left">
                      <div className="chapter-activity-card__date-box">
                        <span className="chapter-activity-card__date-month">{month}</span>
                        <span className="chapter-activity-card__date-day">{day}</span>
                      </div>

                      <div className="chapter-activity-card__info">
                        <span className="chapter-activity-card__type-tag">
                          {ev.category || (ev.isVirtual ? "Webinar" : "Hands-on Lab")}
                        </span>
                        <h4 className="chapter-activity-card__title" title={ev.title}>
                          {ev.title}
                        </h4>
                        <div className="chapter-activity-card__meta">
                          <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#004976" }}>
                            {ev.isVirtual ? "videocam" : "pin_drop"}
                          </span>
                          <span>{ev.location || (ev.isVirtual ? "Virtual Session" : "SNGCE Campus")}</span>
                        </div>
                      </div>
                    </div>

                    <Link to={`/events/${ev._id}`} className="chapter-activity-card__btn">
                      Details
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: "var(--sp-xl)", textAlign: "center", marginBottom: "var(--sp-xl)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📅</div>
              <h3 style={{ margin: "0 0 4px", color: "var(--navy)" }}>No upcoming events</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Stay tuned — {name} chapter activities and workshops are announced regularly.
              </p>
            </div>
          )}
        </section>

        {/* ── Official Chapter Promotional Posters & Releases (Sprint 6B) ── */}
        {(chapterPosters.length > 0 || canReleasePosters) && (
          <section className="chapter-posters-section" style={{ marginBottom: "var(--sp-2xl)" }}>
            <div className="chapter-section-header">
              <h2 className="chapter-section-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: meta.color || "#c2410c" }}>
                  palette
                </span>
                <span>{name} Official Posters & Releases</span>
              </h2>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {chapterPosters.length > 0 && (
                  <span
                    className="badge"
                    style={{
                      background: meta.badgeBg || "#ffedd5",
                      color: meta.badgeColor || "#9a3412",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                    }}
                  >
                    🎨 {chapterPosters.length} {chapterPosters.length === 1 ? "Creative" : "Creatives"}
                  </span>
                )}
                {canReleasePosters && (
                  <Link
                    to="/officer/posters"
                    className="btn btn-outline"
                    style={{
                      padding: "4px 12px",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: meta.color || "var(--primary)",
                      borderColor: meta.color || "var(--primary)",
                    }}
                  >
                    🎨 + Release Poster
                  </Link>
                )}
              </div>
            </div>

            {chapterPosters.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 320px))",
                  gap: "var(--sp-lg)",
                }}
              >
                {chapterPosters.map((poster) => (
                  <div
                    key={poster._id}
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
                    onClick={() => setSelectedPoster(poster)}
                  >
                    <div style={{ position: "relative", height: 260, backgroundColor: "#f8fafc", overflow: "hidden" }}>
                      <img
                        src={getMediaUrl(poster.fileUrl)}
                        alt={poster.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: meta.badgeBg || "var(--primary)",
                          color: meta.badgeColor || "#fff",
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        {name}
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
                        {poster.category}
                      </span>
                    </div>

                    <div style={{ padding: "var(--sp-md)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", color: "var(--navy)" }}>{poster.title}</h3>
                        {poster.caption && (
                          <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                            {poster.caption}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8 }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          📅 {new Date(poster.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: "0.78rem", padding: "3px 10px", borderRadius: 4 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPoster(poster);
                          }}
                        >
                          👁️ View Creative
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: "var(--sp-xl)", textAlign: "center", border: "1.5px dashed var(--border-dark)" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎨</div>
                <h3 style={{ margin: "0 0 4px", color: "var(--navy)" }}>No official posters released yet</h3>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Design Leads, Chapter Chairs, and Faculty Advisors release official promotional posters and banners here.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Chapter Moments & Gallery (Sprint 6B) ── */}
        {chapterAlbums.length > 0 && (
          <section className="chapter-moments" style={{ marginBottom: "var(--sp-2xl)" }}>
            <div className="chapter-section-header">
              <h2 className="chapter-section-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#004976" }}>
                  photo_library
                </span>
                <span>{name} Moments & Highlights</span>
              </h2>
              <Link to="/gallery" className="chapter-activities__header-link">
                <span>View Full Gallery</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  chevron_right
                </span>
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 360px))",
                gap: "var(--sp-lg)",
              }}
            >
              {chapterAlbums.map((a) => (
                <Link
                  key={a.eventId}
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
                    boxShadow: "var(--shadow-sm)",
                    borderRadius: "var(--radius)",
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
                      backgroundColor: "#f1f5f9",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={getMediaUrl(a.coverPhoto)}
                      alt={a.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center 20%",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://placehold.co/400x260/00629B/ffffff?text=IEEE+SB+SNGCE";
                      }}
                    />
                    <span
                      className="badge badge-primary"
                      style={{ position: "absolute", top: 12, left: 12, backdropFilter: "blur(4px)" }}
                    >
                      {a.unit} Chapter
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
                      📷 {a.photoCount} photo{a.photoCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div style={{ padding: "var(--sp-md)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", color: "var(--navy)", fontWeight: 700, lineHeight: 1.35 }}>
                        {a.title}
                      </h3>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        📅 {new Date(a.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, color: "#00629B", fontSize: "0.82rem", fontWeight: 600 }}>
                      <span>Explore Album</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Join SBC Bottom Banner (Real Logic Intact) ── */}
        {name !== "SB" && (
          <div className="chapter-join-banner">
            <div className="chapter-join-banner__left">
              <div className="chapter-join-banner__icon">
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  diversity_3
                </span>
              </div>
              <div>
                <h3 className="chapter-join-banner__title">Join IEEE {name} SBC</h3>
                <p className="chapter-join-banner__sub">
                  Access specialized workshops, compute resources, and chapter privileges.
                </p>
              </div>
            </div>

            <div>
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="chapter-join-banner__btn"
                  style={{ background: "#ffdcc3", color: "#2f1500" }}
                >
                  Sign In to Join →
                </Link>
              ) : isMember ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "#a7f3d0",
                    border: "1px solid #10b981",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  ✓ You are a Member
                </span>
              ) : hasPendingRequest || joinSuccess ? (
                <div style={{ display: "inline-flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 18px",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(200, 146, 42, 0.25)",
                      color: "#fef08a",
                      border: "1px solid #ffdcc3",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    ⏳ {joinSuccess || "Request Pending Approval"}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#fef08a", opacity: 0.85 }}>
                    {pendingRequestInfo?.requestedAt
                      ? `Applied on ${new Date(pendingRequestInfo.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} • Awaiting review`
                      : "Awaiting chapter leadership review"}
                  </span>
                </div>
              ) : (
                <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
                  <button
                    type="button"
                    onClick={handleJoinRequest}
                    disabled={joinLoading}
                    className="chapter-join-banner__btn"
                    style={{ background: "#ffdcc3", color: "#2f1500" }}
                  >
                    {joinLoading ? "Submitting..." : "Apply to Join →"}
                  </button>
                  {joinError && (
                    <span style={{ color: "#fca5a5", fontSize: "0.78rem" }}>
                      ⚠️ {joinError}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
                  <span className="badge badge-primary">{selectedPoster.unit?.name || name}</span>
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
    </div>
  );
};

export default ChapterPage;