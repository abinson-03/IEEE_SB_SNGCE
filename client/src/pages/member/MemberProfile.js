import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../../components/UserAvatar";

const CHAPTER_COLORS = {
  CIS: { bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd" },
  CS:  { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  SPS: { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
  WIE: { bg: "#fce7f3", color: "#be185d", border: "#f9a8d4" },
  SB:  { bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc" },
};

const MemberProfile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile]         = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Photo upload states
  const fileInputRef                  = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError]   = useState("");

  // Edit profile state
  const [isEditing, setIsEditing]     = useState(false);
  const [editName, setEditName]       = useState("");
  const [editEmail, setEditEmail]     = useState("");
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading]             = useState(false);
  const [pwError, setPwError]                 = useState("");
  const [pwSuccess, setPwSuccess]             = useState("");

  useEffect(() => {
    // Fetch profile from /user/profile (supported for all roles) or /member/profile
    axiosInstance.get("/user/profile")
      .then((r) => {
        const u = r.data.data;
        setProfile(u);
        setEditName(u?.name || "");
        setEditEmail(u?.email || "");
      })
      .catch(() =>
        axiosInstance.get("/member/profile")
          .then((r) => {
            const u = r.data.data;
            setProfile(u);
            setEditName(u?.name || "");
            setEditEmail(u?.email || "");
          })
          .catch((e) => setError(e.response?.data?.message || "Failed to load profile."))
      )
      .finally(() => setLoading(false));

    // Fetch user's own join requests
    axiosInstance.get("/member/join-requests")
      .then((r) => setJoinRequests(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleStartEditing = () => {
    setEditName(profile?.name || "");
    setEditEmail(profile?.email || "");
    setEditError("");
    setEditSuccess("");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditError("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      setEditError("Name and email are required.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    setEditSuccess("");

    try {
      const res = await axiosInstance.patch("/user/profile", {
        name: editName.trim(),
        email: editEmail.trim(),
      });

      const updated = res.data.user;
      setProfile((prev) => ({ ...prev, name: updated.name, email: updated.email }));
      if (updateUser) {
        updateUser({ name: updated.name, email: updated.email });
      }

      setEditSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!currentPassword) {
      setPwError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("New password and confirm password do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await axiosInstance.post("/user/change-password", {
        currentPassword,
        newPassword,
      });

      setPwSuccess(res.data.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err.response?.data?.message || "Failed to change password. Please check your current password.");
    } finally {
      setPwLoading(false);
    }
  };

  // Handle file selection with client validation and live preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError("Invalid file type. Only JPG, PNG, and WebP images are allowed.");
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image too large. Maximum allowed size is 2MB.");
      return;
    }

    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      const res = await axiosInstance.post("/user/profile-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedPhoto = res.data.profilePhoto;
      setProfile((prev) => ({ ...prev, profilePhoto: updatedPhoto }));
      if (updateUser) {
        updateUser({ profilePhoto: updatedPhoto });
      }

      setUploadSuccess("Profile photo updated successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload profile photo.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius)" }} />;
  if (error)   return <p style={{ color: "#dc2626", padding: "var(--sp-md)", background: "#fee2e2", borderRadius: "var(--radius-sm)" }}>⚠️ {error}</p>;

  return (
    <div>
      <div className="dash-page-header">
        <h1>My Profile</h1>
        <p>Your IEEE Student Branch membership and account details.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--sp-lg)", maxWidth: 900 }}>
        {/* Left Column: Profile Card + Change Password Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          {/* Main Profile Card */}
          <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)" }}>
              {/* Profile Avatar / Fallback circle */}
              <div style={{ position: "relative" }}>
                <UserAvatar
                  src={previewUrl || profile?.profilePhoto || authUser?.profilePhoto}
                  name={profile?.name || authUser?.name}
                  size={76}
                />
              </div>

              <div>
                <h2 style={{ fontSize: "1.3rem", color: "var(--navy)", margin: "0 0 4px" }}>{profile?.name}</h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>{profile?.email}</p>
                <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    padding: "2px 10px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: "#d1fae5",
                    color: "#065f46",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}>
                    Active {profile?.globalRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Picture Upload & Preview Section */}
            <div
              style={{
                padding: "var(--sp-md)",
                background: "#f8fafc",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                marginBottom: "var(--sp-lg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "var(--navy)", display: "block" }}>
                    Profile Photo
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Max 2MB (JPG, PNG, WebP)
                  </span>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                  >
                    📷 Change Photo
                  </button>
                </div>
              </div>

              {/* Preview & Confirmation Box */}
              {previewUrl && (
                <div
                  style={{
                    marginTop: "var(--sp-md)",
                    padding: "12px",
                    background: "#ffffff",
                    borderRadius: "var(--radius-sm)",
                    border: "1px dashed #00629B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #00629B" }}
                    />
                    <div>
                      <strong style={{ fontSize: "0.84rem", display: "block", color: "var(--navy)" }}>
                        Confirm New Photo?
                      </strong>
                      <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                        {selectedFile?.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleUploadPhoto}
                      disabled={uploading}
                      style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                    >
                      {uploading ? "Uploading..." : "Save Photo"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancelPreview}
                      disabled={uploading}
                      style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Feedback */}
              {uploadSuccess && (
                <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#065f46", fontWeight: 600 }}>
                  ✓ {uploadSuccess}
                </div>
              )}
              {uploadError && (
                <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#dc2626", fontWeight: 600 }}>
                  ⚠️ {uploadError}
                </div>
              )}
            </div>

            {/* Edit Profile Form or Table */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} style={{ marginTop: "var(--sp-md)" }}>
                <div style={{ marginBottom: "var(--sp-md)" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                  />
                </div>

                <div style={{ marginBottom: "var(--sp-md)" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                  />
                </div>

                <div style={{ marginBottom: "var(--sp-md)", padding: "10px 12px", background: "#f8fafc", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 4 }}>
                    <strong>Membership Role:</strong> <span style={{ textTransform: "uppercase", fontWeight: 700, color: "var(--navy)" }}>{profile?.globalRole}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    ℹ️ Role and chapter memberships are managed by IEEE Administrators and cannot be modified here.
                  </div>
                </div>

                {editError && (
                  <div style={{ marginBottom: "var(--sp-md)", padding: "8px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "var(--radius-sm)", fontSize: "0.84rem" }}>
                    ⚠️ {editError}
                  </div>
                )}

                <div style={{ display: "flex", gap: "var(--sp-sm)" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editSaving}
                    style={{ fontSize: "0.85rem", padding: "8px 18px" }}
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCancelEditing}
                    disabled={editSaving}
                    style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {editSuccess && (
                  <div style={{ marginBottom: "var(--sp-md)", padding: "8px 12px", background: "#ecfdf5", color: "#065f46", borderRadius: "var(--radius-sm)", fontSize: "0.84rem", fontWeight: 600 }}>
                    ✓ {editSuccess}
                  </div>
                )}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {[
                      ["Full Name", profile?.name],
                      ["Email Address", profile?.email],
                      ["Membership Role", profile?.globalRole?.toUpperCase()],
                      ["Joined Date", profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                    ].map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 4px", fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, width: 130 }}>{label}</td>
                        <td style={{ padding: "10px 4px", fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: "var(--sp-md)" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleStartEditing}
                    style={{ fontSize: "0.82rem", padding: "6px 14px" }}
                  >
                    ✏️ Edit Profile Details
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: "1.05rem", color: "var(--navy)", marginBottom: "var(--sp-xs)", display: "flex", alignItems: "center", gap: 6 }}>
              🔒 Change Password
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "var(--sp-md)" }}>
              Update your account password. Enter your current password followed by your new password (minimum 8 characters).
            </p>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                  Current Password *
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                  New Password * (min. 8 characters)
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                />
              </div>

              {pwError && (
                <div style={{ marginBottom: "var(--sp-md)", padding: "8px 12px", background: "#fef2f2", color: "#dc2626", borderRadius: "var(--radius-sm)", fontSize: "0.84rem" }}>
                  ⚠️ {pwError}
                </div>
              )}

              {pwSuccess && (
                <div style={{ marginBottom: "var(--sp-md)", padding: "8px 12px", background: "#ecfdf5", color: "#065f46", borderRadius: "var(--radius-sm)", fontSize: "0.84rem", fontWeight: 600 }}>
                  ✓ {pwSuccess}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading}
                style={{ fontSize: "0.85rem", padding: "8px 18px" }}
              >
                {pwLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>

        {/* Chapters & Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
          {/* Chapter Memberships Card */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: "1rem", color: "var(--navy)", marginBottom: "var(--sp-md)", display: "flex", alignItems: "center", gap: 6 }}>
                🏛️ Chapter Memberships
              </h3>

              {profile?.chapterMemberships && profile.chapterMemberships.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
                  {profile.chapterMemberships.map((c) => {
                    const cStyle = CHAPTER_COLORS[c.name] || { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
                    return (
                      <div
                        key={c._id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          background: cStyle.bg,
                          border: `1px solid ${cStyle.border}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong style={{ color: cStyle.color, fontSize: "0.92rem" }}>{c.name}</strong>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                            {c.description || (c.name === "CS" ? "Computer Society" : c.name === "CIS" ? "Computational Intelligence Society" : c.name === "SPS" ? "Signal Processing Society" : c.name === "WIE" ? "Women in Engineering" : "Chapter")}
                          </div>
                        </div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: cStyle.color, textTransform: "uppercase" }}>
                          Member
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  No chapter memberships assigned yet.
                </p>
              )}

              {/* Pending Join Requests */}
              {joinRequests.some((r) => r.status === "pending") && (
                <div style={{ marginTop: "var(--sp-md)", borderTop: "1px dashed var(--border)", paddingTop: "var(--sp-md)" }}>
                  <h4 style={{ fontSize: "0.85rem", color: "#b45309", marginBottom: "var(--sp-xs)", display: "flex", alignItems: "center", gap: 6 }}>
                    ⏳ Pending Chapter Join Requests
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-xs)" }}>
                    {joinRequests
                      .filter((r) => r.status === "pending")
                      .map((r) => (
                        <div
                          key={r._id}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#92400e", fontSize: "0.85rem" }}>
                              IEEE {r.unit?.name || "Chapter"} SBC
                            </strong>
                            <div style={{ fontSize: "0.74rem", color: "#b45309" }}>
                              Applied on {new Date(r.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • Awaiting Review
                            </div>
                          </div>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
                            Pending
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: "1rem", color: "var(--navy)", marginBottom: "var(--sp-md)" }}>
                ⚡ Quick Actions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
                <Link to="/events" className="btn btn-outline" style={{ fontSize: "0.85rem", textAlign: "left", justifyContent: "flex-start" }}>
                  🗓️ Explore Upcoming Events
                </Link>
                <Link to="/member/my-events" className="btn btn-outline" style={{ fontSize: "0.85rem", textAlign: "left", justifyContent: "flex-start" }}>
                  🎫 View My Registered Events
                </Link>
                <Link to="/directory" className="btn btn-outline" style={{ fontSize: "0.85rem", textAlign: "left", justifyContent: "flex-start" }}>
                  👥 Search Member Directory
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
