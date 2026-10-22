import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import EventCard from "../components/EventCard";

const CHAPTERS = ["All", "CIS", "CS", "SPS", "WIE", "SB"];

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Read filter state from URL so links like /events?unit=CIS work
  const unitFilter   = searchParams.get("unit") || "All";
  const timeFilter   = searchParams.get("time") || "upcoming";

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("status", "published");
    if (unitFilter !== "All") params.set("unit", unitFilter);
    params.set("limit", "50");

    axiosInstance.get(`/events?${params.toString()}`)
      .then((r) => {
        let data = r.data.data || [];
        const now = new Date();
        if (timeFilter === "upcoming") {
          data = data.filter((e) => new Date(e.date) >= now);
        } else if (timeFilter === "past") {
          data = data.filter((e) => new Date(e.date) < now).reverse();
        }
        setEvents(data);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [unitFilter, timeFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };

  return (
    <div>
      {/* Page hero */}
      <div className="page-hero">
        <div className="container">
          <h1>Events</h1>
          <p>Workshops, seminars, hackathons and more — from all IEEE SB chapters.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Filter bar */}
          <div className="filter-bar">
            {/* Time filter */}
            <button
              className={`filter-pill${timeFilter === "upcoming" ? " active" : ""}`}
              onClick={() => setFilter("time", "upcoming")}
            >
              📅 Upcoming
            </button>
            <button
              className={`filter-pill${timeFilter === "past" ? " active" : ""}`}
              onClick={() => setFilter("time", "past")}
            >
              📂 Past
            </button>
            <button
              className={`filter-pill${timeFilter === "all" ? " active" : ""}`}
              onClick={() => setFilter("time", "all")}
            >
              🔍 All
            </button>

            <div style={{ width: 1, background: "var(--border-dark)", alignSelf: "stretch", margin: "0 var(--sp-sm)" }} />

            {/* Chapter filter */}
            {CHAPTERS.map((ch) => (
              <button
                key={ch}
                className={`filter-pill${unitFilter === ch ? " active" : ""}`}
                onClick={() => setFilter("unit", ch)}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-muted mt-sm mb-lg" style={{ fontSize: "0.88rem" }}>
            {loading ? "Loading…" : `${events.length} event${events.length !== 1 ? "s" : ""} found`}
          </p>

          {/* Grid */}
          {loading ? (
            <div className="loading-grid">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton skeleton-card" />)}
            </div>
          ) : events.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
              {events.map((ev) => <EventCard key={ev._id} event={ev} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No events found</h3>
              <p>Try adjusting the filters above.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;
