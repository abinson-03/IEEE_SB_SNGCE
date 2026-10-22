# IEEE Student Branch SNGCE Portal

A comprehensive, role-based MERN-stack platform built for the **IEEE Student Branch SNGCE (SB SNGCE)** and its technical chapters (**CIS, CS, SPS, WIE**).

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=for-the-badge&logo=mongodb)
![Status](https://img.shields.io/badge/Status-All_Sprints_Complete_(1--7)-success?style=for-the-badge)

---

## 🏁 Sprint Roadmap

All sprints have been completed, verified, and deployed:

| Sprint | Status | Scope & Deliverables |
|:---:|:---:|---|
| **1** | ✅ **Completed** | **Foundation**: MongoDB schemas (15 Mongoose models), JWT Auth, Role middleware (`superadmin`, `execom`, `member`, `guest`), error handling. |
| **2** | ✅ **Completed** | **Public & Chapter Pages**: Dynamic chapter hubs (SB, CIS, CS, SPS, WIE), event browsing, registration API, photo gallery with lightbox. |
| **3** | ✅ **Completed** | **Admin & Officer CMS**: Unit management, ExeCom duty rosters, position templates, officer tasks, meeting minutes, budget proposals. |
| **4** | ✅ **Completed** | **Smart Attendance System**: Secure desk attendance workflow using dynamic Event QR codes and attendee unique registration verification codes. |
| **5** | ✅ **Completed** | **E-Certificate Automation**: Custom Canva certificate template engine, dynamic participant name positioning (`y=346 pt`, `#092718`), digital verification codes & QR verification portal, automated batch email delivery. |
| **6** | ✅ **Completed** | **Analytics & Communications**: Interactive analytics dashboard, registration metrics, real-time notification bell, audit logging. |
| **7** | ✅ **Completed** | **IEEE vTools Reporting & Polish**: Automated chapter-wise vTools PDF event report generation, promotional poster release system with lightbox modals, database sync & full deployment. |

---

## ✨ Key Features

### 📅 1. Event Management & Scheduling
- **Chapter-Wise Event Hosting:** Create, edit, publish, and track events for Student Branch or technical chapters (CIS, CS, SPS, WIE).
- **Date & Time Synchronization:** Localized datetime formatting with strict UTC protection to avoid any timezone shifting.
- **Smart Prioritization:** Upcoming events automatically pinned to the top of Home and Chapter pages.

### 🎟️ 2. Secure Two-Factor Desk Attendance
- **Tamper-Proof Check-In:** Prevents absent users from checking in remotely.
- **Workflow:** 
  1. Attendees receive a unique **Registration Code** upon signing up.
  2. At the event check-in desk, attendees scan the official event QR code.
  3. Scanning opens the check-in portal requesting their unique code.
  4. Instant attendance marking and real-time counter updates.

### 🎓 3. Certificate Generation & Verification Engine
- **Canva Template Support:** ExeCom officers can upload custom Canva certificate backgrounds per event.
- **Precise Typography Overlay:** Participant names dynamically rendered in bold `#092718` typography centered across certificate templates.
- **Digital Authenticity:** Each certificate includes an auto-generated unique verification ID and direct validation QR code.
- **Online Verification Portal:** Public validation page at `/verify-certificate/:code` allows recruiters and institutions to verify certificate authenticity.
- **Batch Email Dispatch:** Automated certificate generation and delivery to participant emails with PDF attachments.

### 📢 4. Promotional Poster Release System
- **Role-Gated Releases:** ExeCom officers can release promotional posters for upcoming chapter events.
- **Multi-Page Showcase:** Dynamic banner showcase on Home page and dedicated Chapter hubs with responsive Lightbox view.
- **Authorized Roles:** Only Design Leads, Chapter Chairs, and Faculty Advisors of the respective chapter can publish posters.

### 📄 5. IEEE vTools PDF Report Generation
- **Official Compliance:** Generates official IEEE vTools event summary reports formatted for reporting to IEEE Section / vTools portal.
- **One-Click Download:** Complete with event metadata, chapter unit, financial overview, speaker details, and participant attendance rosters.

### 👥 6. ExeCom Duty Roster & Governance
- **Position Templates & Roles:** Pre-configured chapter roles (Chair, Vice Chair, Secretary, Treasurer, Webmaster, Design Lead, Faculty Advisor, etc.).
- **Meeting Minutes & Budget Proposals:** Track internal ExeCom meetings, agendas, action items, and financial approval workflows.

---

## 🏛️ System Architecture

```
ieee-sb-portal/
├── package.json                   ← Root orchestration (concurrently dev scripts)
├── client/                        ← React Frontend (React 18, React Router v6, Axios)
│   ├── public/
│   │   ├── index.html
│   │   └── logos/                 ← Official IEEE, SB, CIS, CS, SPS, WIE logos
│   └── src/
│       ├── api/axiosInstance.js   ← Global Axios interceptor with JWT handling
│       ├── context/AuthContext.js ← Context provider for authentication state
│       ├── components/            ← Reusable modals, navbars, layouts, cards
│       ├── pages/                 ← Public pages (Home, About, Events, Chapters)
│       ├── pages/admin/           ← Superadmin CMS (Users, Units, CMS, Budget, Audit)
│       ├── pages/officer/         ← ExeCom Portal (Events, Attendance, Posters, Certificates)
│       └── pages/member/          ← Member Dashboard (Registrations, Certs, Profile)
│
├── server/                        ← Express Backend
│   ├── server.js                  ← App configuration & middleware pipeline
│   ├── config/db.js               ← MongoDB Mongoose connection
│   ├── models/                    ← 15 Mongoose schemas
│   │   ├── User.js, Unit.js, Event.js, Certificate.js, PosterLog.js...
│   ├── controllers/               ← Business logic for events, certs, posters, auth...
│   ├── routes/                    ← REST API endpoints
│   ├── middleware/                ← JWT Auth, role gates (superadmin, execom, owner)
│   ├── utils/                     ← Email transporter, notification triggers
│   ├── db_backup/                 ← Full JSON exports of all database collections
│   └── uploads/                   ← Managed uploads (posters, templates, photos, reports)
│
└── docs/                          ← Technical documentation, diagrams, project reports
```

---

## 🛡️ User Roles & Permissions Matrix

| Capability | Superadmin | Chapter ExeCom | IEEE Member | Guest / Public |
|---|:---:|:---:|:---:|:---:|
| Browse Chapters & Events | ✅ | ✅ | ✅ | ✅ |
| Register for Events | ✅ | ✅ | ✅ | ✅ |
| Verify Certificates Online | ✅ | ✅ | ✅ | ✅ |
| Check-in at Event Desk | ✅ | ✅ | ✅ | ✅ |
| Download Personal Certificates | ✅ | ✅ | ✅ | ❌ |
| Create & Edit Chapter Events | ✅ | ✅ (Own Chapter) | ❌ | ❌ |
| Release Promotional Posters | ✅ | ✅ (Chair/Design/Faculty) | ❌ | ❌ |
| Issue & Email Certificates | ✅ | ✅ (Own Chapter) | ❌ | ❌ |
| Download IEEE vTools Reports | ✅ | ✅ (Own Chapter) | ❌ | ❌ |
| Manage ExeCom Duties & Minutes | ✅ | ✅ (Own Chapter) | ❌ | ❌ |
| Manage Units & Superadmin CMS | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/abinson-03/IEEE_SB_SNGCE.git
cd IEEE_SB_SNGCE

# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Environment Configuration
Create `.env` file inside `server/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ieee_sb_portal
JWT_SECRET=your_super_secret_jwt_key
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Email SMTP (Gmail / Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Create `.env` file inside `client/`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Seeding & Setup
```bash
npm run seed
```
*Seeds the 5 fundamental units (SB, CIS, CS, SPS, WIE), position templates, admin credentials, and sample event records.*

### 5. Run Development Servers
```bash
npm run dev
```
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 📡 REST API Summary

| Route Group | Base Endpoint | Description |
|---|---|---|
| **Auth** | `/api/auth` | User registration, login, profile fetch, password reset |
| **Events** | `/api/events` | Chapter events CRUD, registrations, check-in, attendance stats |
| **Certificates** | `/api/certificates` | Canva templates, PDF batch generation, email delivery, public verification |
| **Posters** | `/api/posters` | Promotional poster releases, chapter filters, officer audit logs |
| **Units** | `/api/units` | IEEE Student Branch and technical chapter records |
| **Officer** | `/api/officer` | Duty assignments, meeting minutes, task assignments, join requests |
| **Admin** | `/api/admin` | Global audit logs, budget proposals, user management, system CMS |
| **Analytics** | `/api/analytics` | Branch metrics, chapter growth, and event participation stats |

---

## 📜 License
Developed for **IEEE Student Branch SNGCE (Kochi Subsection, Kerala Section, Region 10)**.  
All rights reserved © 2026.
