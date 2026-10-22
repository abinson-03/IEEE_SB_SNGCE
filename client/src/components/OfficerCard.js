import React from "react";
import UserAvatar from "./UserAvatar";
import "./OfficerCard.css";

const getBadgeStyle = (pos = "") => {
  const p = (pos || "").toLowerCase();
  if (p.includes("counselor") || p.includes("advisor")) {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
      fontWeight: 700,
    };
  }
  if (p.includes("chair")) {
    return {
      background: "#e0f2fe",
      color: "#0369a1",
      border: "1px solid #bae6fd",
      fontWeight: 700,
    };
  }
  if (p.includes("secretary") || p.includes("treasurer")) {
    return {
      background: "#ecfdf5",
      color: "#047857",
      border: "1px solid #a7f3d0",
      fontWeight: 700,
    };
  }
  if (p.includes("lead") || p.includes("coordinator") || p.includes("webmaster") || p.includes("master")) {
    return {
      background: "#f3e8ff",
      color: "#6b21a8",
      border: "1px solid #e9d5ff",
      fontWeight: 600,
    };
  }
  return {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    fontWeight: 600,
  };
};

/**
 * OfficerCard
 * Displays a chapter officer with avatar (photo or IEEE-blue initials fallback),
 * name, and position badge.
 */
const OfficerCard = ({ name, positionName, profilePhoto, academicYear }) => {
  const badgeStyle = getBadgeStyle(positionName);

  return (
    <div className="officer-card">
      <div className="officer-card__avatar-wrap">
        <UserAvatar
          src={profilePhoto}
          name={name}
          size={64}
          className="officer-card__avatar"
        />
      </div>
      <div className="officer-card__body">
        <h4 className="officer-card__name">{name}</h4>
        <span
          className="officer-card__role"
          style={{
            ...badgeStyle,
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.74rem",
            lineHeight: 1.3,
            maxWidth: "100%",
            wordBreak: "break-word",
          }}
        >
          {positionName}
        </span>
        {academicYear && (
          <span className="officer-card__year" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {academicYear}
          </span>
        )}
      </div>
    </div>
  );
};

export default OfficerCard;
