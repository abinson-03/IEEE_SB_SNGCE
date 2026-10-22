import React, { useEffect, useState, useRef, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import "./NotificationBell.css";

const POLL_INTERVAL_MS = 30000; // 30 seconds

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    axiosInstance.get("/notifications")
      .then((r) => {
        setNotifications(r.data.data || []);
        setUnreadCount(r.data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    if (!isAuthenticated) return;
    const id = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications, isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markOneRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notif-bell" ref={dropdownRef}>
      <button
        className="notif-bell__btn"
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications">
          <div className="notif-dropdown__header">
            <span className="notif-dropdown__title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-dropdown__mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-dropdown__list">
            {loading && notifications.length === 0 ? (
              <div className="notif-dropdown__empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-dropdown__empty">No notifications yet.</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  className={`notif-item${n.read ? "" : " notif-item--unread"}`}
                  onClick={() => !n.read && markOneRead(n._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && !n.read && markOneRead(n._id)}
                >
                  <div className="notif-item__dot" />
                  <div className="notif-item__body">
                    <p className="notif-item__title">{n.title}</p>
                    <p className="notif-item__msg">{n.message}</p>
                    <span className="notif-item__time">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
