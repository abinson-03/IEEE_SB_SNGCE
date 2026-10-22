import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <img
              src="/logos/sb_sngce_transparent.png"
              alt="IEEE SB SNGCE Logo"
              className="footer__logo-img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="footer__logo-text">
              <span className="footer__logo-title">IEEE SB SNGCE</span>
              <span className="footer__logo-sub">Student Branch • Kerala Section</span>
            </div>
          </Link>
          <p className="footer__tagline">
            Sree Narayana Gurukulam College of Engineering, Kadayiruppu, Kolenchery, Kerala - 682311.
            Affiliated to IEEE Kerala Section &amp; IEEE Region 10.
          </p>

          {/* Institutional Partner & Regional Logos */}
          <div className="footer__partner-logos">
            <img
              src="/logos/IEEE_MB_blue.png"
              alt="IEEE Master Brand"
              className="footer__partner-logo footer__partner-logo--white"
              title="IEEE Master Brand"
            />
            <img
              src="/logos/R10_SAC.png"
              alt="IEEE Region 10 SAC"
              className="footer__partner-logo footer__partner-logo--white"
              title="IEEE R10 SAC"
            />
            <img
              src="/logos/r10_logo_white.png"
              alt="IEEE Region 10"
              className="footer__partner-logo"
              title="IEEE Region 10"
            />
          </div>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Quick Links</h4>
          <ul className="footer__list">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/events">Events Calendar</Link></li>
            <li><Link to="/directory">Member Directory</Link></li>
            <li><Link to="/gallery">Photo Gallery</Link></li>
            <li><Link to="/verify-certificate">Verify Certificate</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Technical Chapters</h4>
          <ul className="footer__list">
            <li><Link to="/chapters/CIS">Computational Intelligence (CIS)</Link></li>
            <li><Link to="/chapters/CS">Computer Society (CS)</Link></li>
            <li><Link to="/chapters/SPS">Signal Processing Society (SPS)</Link></li>
            <li><Link to="/chapters/WIE">Women in Engineering (WIE)</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Connect &amp; Social</h4>
          <ul className="footer__list footer__list--social">
            <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">🔗 LinkedIn</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📷 Instagram</a></li>
            <li><a href="mailto:ieee@sngce.ac.in" aria-label="Email">✉️ ieee@sngce.ac.in</a></li>
          </ul>
          <div className="footer__social-img-wrap">
            <img
              src="/logos/social_media_bottom.png"
              alt="Social Media Handles"
              className="footer__social-img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {year} IEEE Student Branch SNGCE. All rights reserved.</p>
          <p>
            An official Student Branch affiliated with{" "}
            <a href="https://www.ieee.org" target="_blank" rel="noreferrer">
              IEEE.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
