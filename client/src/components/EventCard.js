import React from "react";
import { Link } from "react-router-dom";
import "./EventCard.css";

/**
 * EventCard
 * Displays a single event in a card format.
 * Props: { event: { _id, title, description, date, venue, unit, status } }
 */
const CHAPTER_COLORS = {
  CIS: "#7c3aed",
  CS:  "#0369a1",
  SPS: "#065f46",
  WIE: "#be185d",
  SB:  "#1a2744",
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-IN", { day: "2-digit" }),
    month: d.toLocaleDateString("en-IN", { month: "short" }),
    year: d.getFullYear(),
    full: d.toLocaleDateString("en-IN", { dateStyle: "medium" }),
  };
};

const EventCard = ({ event }) => {
  if (!event) return null;
  const { title, description, date, venue, unit, status } = event;
  const fmt = formatDate(date);
  const unitName = unit?.name || "SB";
  const accentColor = CHAPTER_COLORS[unitName] || CHAPTER_COLORS.SB;
  const isPast = new Date(date) < new Date();

  return (
    <Link to={`/events/${event._id}`} className="event-card" style={{ "--chapter-color": accentColor }}>
      {/* Date badge */}
      <div className="event-card__date-col">
        <span className="event-card__day">{fmt.day}</span>
        <span className="event-card__month">{fmt.month}</span>
        <span className="event-card__year">{fmt.year}</span>
      </div>

      {/* Content */}
      <div className="event-card__body">
        <div className="event-card__meta">
          <span className="badge" style={{ background: accentColor + "22", color: accentColor }}>
            {unitName}
          </span>
          {isPast && <span className="badge badge-muted">Past</span>}
          {!isPast && status === "published" && <span className="badge badge-success">Upcoming</span>}
        </div>
        <h3 className="event-card__title">{title}</h3>
        {description && (
          <p className="event-card__desc">{description.slice(0, 100)}{description.length > 100 ? "…" : ""}</p>
        )}
        {venue && <p className="event-card__venue">📍 {venue}</p>}
      </div>
    </Link>
  );
};

export default EventCard;
