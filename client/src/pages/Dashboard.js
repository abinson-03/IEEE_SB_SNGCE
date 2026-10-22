import React from "react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: "2rem" }}>
      <h2 style={{ color: "var(--navy)", marginBottom: "1rem" }}>Dashboard</h2>
      <div className="card">
        <div className="card-body">
          <p>Hello, <strong>{user?.name}</strong>!</p>
          <p style={{ marginTop: 8 }}>Role: <code>{user?.globalRole}</code></p>
          <p style={{ marginTop: 4 }}>Email: {user?.email}</p>
          <button
            onClick={logout}
            className="btn btn-primary mt-lg"
            style={{ background: "var(--primary)" }}
          >
            Sign Out
          </button>
        </div>
      </div>
      <p className="text-muted mt-md" style={{ fontSize: "0.85rem" }}>
        Full dashboard UI coming in Sprint 3.
      </p>
    </div>
  );
};

export default Dashboard;
