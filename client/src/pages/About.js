import React from "react";
import { Link } from "react-router-dom";

const MILESTONES = [
  { year: "2010", event: "IEEE Student Branch established at SNGCE." },
  { year: "2015", event: "Computer Society (CS) Chapter formed." },
  { year: "2017", event: "Computational Intelligence Society (CIS) Chapter launched." },
  { year: "2019", event: "Signal Processing Society (SPS) Chapter added." },
  { year: "2021", event: "Women in Engineering (WIE) Affinity Group established." },
  { year: "2024", event: "Portal modernisation initiative started." },
];

const About = () => (
  <div>
    {/* Page hero */}
    <div className="page-hero">
      <div className="container">
        <h1>About IEEE SB SNGCE</h1>
        <p>Our mission, history, and the community driving innovation.</p>
      </div>
    </div>

    {/* Mission */}
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h2 className="section-title">Our Mission</h2>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "var(--text-muted)", marginBottom: "var(--sp-lg)" }}>
          The IEEE Student Branch at Sree Narayana Gurukulam College of Engineering, Kadayiruppu (SNGCE) is dedicated to
          fostering technological innovation and excellence for the benefit of humanity. We provide
          students with opportunities to grow professionally and technically through workshops,
          seminars, competitions, and collaborative projects.
        </p>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "var(--text-muted)" }}>
          As an official chapter of the world&apos;s largest technical professional organisation, IEEE,
          we connect our members with a global network of engineers and researchers.
        </p>
      </div>
    </section>

    {/* Milestones timeline */}
    <section className="section section--alt">
      <div className="container" style={{ maxWidth: 700 }}>
        <h2 className="section-title">Our Journey</h2>
        <div className="about-timeline">
          {MILESTONES.map((m) => (
            <div key={m.year} className="about-timeline__item">
              <div className="about-timeline__year">{m.year}</div>
              <div className="about-timeline__event">{m.event}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Chapters overview */}
    <section className="section">
      <div className="container">
        <h2 className="section-title text-center">Our Chapters</h2>
        <p className="section-subtitle text-center" style={{ margin: "0 auto var(--sp-2xl)" }}>
          Four technical chapters, each with independent leadership and events.
        </p>
        <div className="grid-2" style={{ maxWidth: 800, margin: "0 auto" }}>
          {[
            { name: "CIS", full: "Computational Intelligence Society", desc: "AI, ML, neural networks, and fuzzy logic.", logo: "/logos/ieee_cis_logo.png" },
            { name: "CS",  full: "Computer Society",  desc: "Software engineering, systems, and computing.", logo: "/logos/ieee_computer_society.png" },
            { name: "SPS", full: "Signal Processing Society", desc: "DSP, communications, and multimedia signal processing.", logo: "/logos/ieee_sps_logo_black.png" },
            { name: "WIE", full: "Women in Engineering", desc: "Promoting gender diversity in engineering and technology.", logo: null },
          ].map((ch) => (
            <div key={ch.name} className="card">
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-sm)" }}>
                  <span className="badge badge-primary">{ch.name}</span>
                  {ch.logo && (
                    <img src={ch.logo} alt={ch.name} style={{ height: "26px", maxWidth: "110px", objectFit: "contain" }} />
                  )}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem" }}>{ch.full}</h3>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "var(--sp-md)" }}>{ch.desc}</p>
                <Link to={`/chapters/${ch.name}`} className="btn btn-outline" style={{ fontSize: "0.82rem", padding: "0.4rem 1rem" }}>
                  Visit Chapter →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <style>{`
      .about-timeline { display: flex; flex-direction: column; gap: 0; position: relative; }
      .about-timeline::before { content: ""; position: absolute; left: 72px; top: 0; bottom: 0; width: 2px; background: var(--border-dark); }
      .about-timeline__item { display: flex; gap: var(--sp-lg); align-items: flex-start; padding: var(--sp-md) 0; }
      .about-timeline__year { min-width: 60px; font-weight: 800; font-size: 0.95rem; color: var(--primary); text-align: right; padding-top: 2px; }
      .about-timeline__event { background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--sp-sm) var(--sp-md); font-size: 0.92rem; flex: 1; margin-left: var(--sp-lg); box-shadow: var(--shadow-sm); }
    `}</style>
  </div>
);

export default About;
