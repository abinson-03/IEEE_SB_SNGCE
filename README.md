# IEEE SB Portal

A role-based MERN-stack platform for a college IEEE Student Branch and its technical chapters (CIS, CS, SPS, WIE).

> **Current sprint:** Sprint 1 — Foundation only.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Clone & install
```bash
git clone <repo-url>
cd ieee-sb-portal
npm run install:all
```

### 2. Configure environment
```bash
# Copy and edit the server env file
cp server/.env.example server/.env
# Set MONGO_URI and JWT_SECRET in server/.env
```

### 3. Seed the database
```bash
npm run seed
# Creates 5 Units: SB, CIS, CS, SPS, WIE
```

### 4. Run both servers
```bash
npm run dev
# Starts server (port 5000) + client (port 3000) concurrently
```

---

## Project Structure

```
ieee-sb-portal/
├── package.json              ← root (concurrently scripts)
├── server/
│   ├── server.js             ← Express entry point
│   ├── .env                  ← environment variables (gitignored)
│   ├── .env.example
│   ├── config/
│   │   └── db.js             ← Mongoose connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Unit.js
│   │   ├── PositionTemplate.js
│   │   ├── DutyAssignment.js
│   │   ├── Event.js
│   │   └── Certificate.js
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── errorHandler.js
│   └── scripts/
│       └── seed.js
└── client/
    └── src/
        ├── App.js            ← Router + placeholder pages
        ├── index.js
        ├── api/
        │   └── axiosInstance.js    ← JWT interceptor
        ├── context/
        │   └── AuthContext.js      ← Auth state + login/logout
        └── components/
            └── PrivateRoute.js
```

---

## API Endpoints (Sprint 1)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/health` | Public | Server health check |
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| POST | `/api/auth/logout` | Private | Confirm logout |
| GET | `/api/auth/me` | Private | Get current user |

---

## User Roles

| Role | Description |
|------|-------------|
| `superadmin` | Full platform access, manages units and position templates |
| `execom` | Chapter officer, assigned via DutyAssignment |
| `member` | IEEE member belonging to one or more chapters |
| `guest` | Default public role |

---

## Sprint Roadmap

| Sprint | Scope |
|--------|-------|
| **1** ✅ | Foundation: DB, Auth, Models, Middleware |
| 2 | Public chapter pages, event browsing, registration API |
| 3 | Admin CMS: manage units, positions, duty assignments |
| 4 | QR attendance system |
| 5 | E-certificates: PDF generation + email delivery |
| 6 | Analytics dashboard, notifications |
| 7 | Automated reporting, polish, deployment |
