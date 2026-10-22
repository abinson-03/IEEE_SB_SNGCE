import React, { useState, useEffect } from "react";
import { getMediaUrl } from "../utils/mediaUtils";

/**
 * UserAvatar
 * Renders user's profile photo or falls back cleanly to initials on an IEEE-blue (#00629B) circle.
 * Never shows a broken image icon.
 */
const UserAvatar = ({
  src,
  name = "User",
  size = 40,
  fontSize,
  className = "",
  style = {},
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset imgError whenever src changes so new uploads or user changes re-attempt loading
  useEffect(() => {
    setImgError(false);
  }, [src]);

  // Compute initials
  const initials = (name || "U")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const finalFontSize = fontSize || Math.max(Math.round(size * 0.42), 11);

  // Resolve image source (supports full URLs, data/blobs, and relative backend uploads)
  const fullSrc = getMediaUrl(src);

  if (fullSrc && !imgError) {
    return (
      <img
        src={fullSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "inline-block",
          verticalAlign: "middle",
          flexShrink: 0,
          border: "2px solid rgba(255,255,255,0.85)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#00629B", // IEEE-blue default circle
        color: "#ffffff",
        fontWeight: 700,
        fontSize: finalFontSize,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "0.04em",
        userSelect: "none",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(0, 98, 155, 0.25)",
        ...style,
      }}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
