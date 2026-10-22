import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getMediaUrl } from "../utils/mediaUtils";

const GalleryPage = () => {
  const { user } = useAuth();
  const isOfficer = user && ["execom", "chapteradmin", "superadmin"].includes(user.globalRole);

  const [albums, setAlbums]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [events, setEvents]                   = useState([]);
  const [uploadEventId, setUploadEventId]     = useState("");
  const [uploadCaption, setUploadCaption]     = useState("");
  const [selectedFiles, setSelectedFiles]     = useState([]);
  const [geoCoords, setGeoCoords]             = useState({ lat: null, lng: null });
  const [geoStatus, setGeoStatus]             = useState("");
  const [uploading, setUploading]             = useState(false);
  const [uploadMsg, setUploadMsg]             = useState({ text: "", type: "" });

  // Photo edit states (for officers)
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editCaption, setEditCaption]   = useState("");
  const [editIsCover, setEditIsCover]   = useState(false);
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState("");
  const [actionAlert, setActionAlert]   = useState({ text: "", type: "" });

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/gallery");
      setAlbums(res.data.data || []);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleOpenAlbum = async (album) => {
    setSelectedAlbum(album);
    setActionAlert({ text: "", type: "" });
    setLoadingPhotos(true);
    try {
      const res = await api.get(`/gallery/${album.eventId}`);
      setAlbumPhotos(res.data.data || []);
    } catch {
      setAlbumPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleOpenUpload = async (preselectedEventId = null) => {
    setUploadMsg({ text: "", type: "" });
    setSelectedFiles([]);
    setGeoCoords({ lat: null, lng: null });
    setGeoStatus("");
    try {
      const res = await api.get("/events?status=all");
      const evs = res.data.data || [];
      setEvents(evs);
      if (preselectedEventId) {
        setUploadEventId(preselectedEventId);
      } else if (evs.length > 0) {
        setUploadEventId(evs[0]._id);
      }
      setShowUploadModal(true);
    } catch {
      alert("Failed to load events list.");
    }
  };

  // Browser Geolocation API
  const handleCaptureGeo = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported by your browser.");
      return;
    }
    setGeoStatus("Fetching GPS coordinates…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus(`📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        setGeoStatus(`GPS error: ${err.message}`);
      },
      { timeout: 10000 }
    );
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setUploadMsg({ text: "Please choose at least 1 image file.", type: "error" });
      return;
    }
    if (selectedFiles.length > 20) {
      setUploadMsg({ text: "Maximum 20 photos per batch allowed.", type: "error" });
      return;
    }

    setUploading(true);
    setUploadMsg({ text: "", type: "" });

    try {
      const formData = new FormData();
      formData.append("caption", uploadCaption);
      if (geoCoords.lat && geoCoords.lng) {
        formData.append("lat", geoCoords.lat);
        formData.append("lng", geoCoords.lng);
      }
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("photos", selectedFiles[i]);
      }

      await api.post(`/events/${uploadEventId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadMsg({ text: "Photos uploaded successfully to event album!", type: "success" });
      fetchAlbums();
      if (selectedAlbum && selectedAlbum.eventId === uploadEventId) {
        api.get(`/gallery/${uploadEventId}`).then((res) => setAlbumPhotos(res.data.data || []));
      }
      setTimeout(() => setShowUploadModal(false), 1500);
    } catch (err) {
      setUploadMsg({ text: err.response?.data?.message || "Upload failed.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  // Open Edit Photo Modal
  const handleOpenEditPhoto = (photo) => {
    setEditingPhoto(photo);
    setEditCaption(photo.caption || "");
    setEditIsCover(Boolean(photo.isCover));
    setEditError("");
  };

  // Save changes to photo (caption / isCover)
  const handleSavePhotoEdit = async (e) => {
    e.preventDefault();
    if (!editingPhoto) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await api.patch(`/gallery/photos/${editingPhoto._id}`, {
        caption: editCaption,
        isCover: editIsCover,
      });

      const updated = res.data.data;
      // Update local photo list
      setAlbumPhotos((prev) =>
        prev.map((p) => {
          if (p._id === updated._id) {
            return { ...p, caption: updated.caption, isCover: updated.isCover };
          }
          if (updated.isCover) {
            return { ...p, isCover: false };
          }
          return p;
        })
      );

      setActionAlert({ text: "Photo updated successfully!", type: "success" });
      setEditingPhoto(null);
      fetchAlbums();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update photo.");
    } finally {
      setEditSaving(false);
    }
  };

  // Quick single-click set as album cover
  const handleQuickSetCover = async (photo) => {
    try {
      await api.patch(`/gallery/photos/${photo._id}`, { isCover: true });
      setAlbumPhotos((prev) =>
        prev.map((p) => ({
          ...p,
          isCover: p._id === photo._id,
        }))
      );
      setActionAlert({ text: "Album cover photo updated!", type: "success" });
      fetchAlbums();
    } catch (err) {
      setActionAlert({ text: err.response?.data?.message || "Failed to update cover.", type: "error" });
    }
  };

  // Delete a photo from album
  const handleDeletePhoto = async (photo) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this photo from the event album?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/gallery/photos/${photo._id}`);
      const remaining = albumPhotos.filter((p) => p._id !== photo._id);
      setAlbumPhotos(remaining);

      if (editingPhoto && editingPhoto._id === photo._id) {
        setEditingPhoto(null);
      }

      if (remaining.length === 0) {
        setSelectedAlbum(null);
      }

      setActionAlert({ text: "Photo deleted successfully.", type: "success" });
      fetchAlbums();
    } catch (err) {
      setActionAlert({ text: err.response?.data?.message || "Failed to delete photo.", type: "error" });
    }
  };

  return (
    <div className="container" style={{ padding: "var(--sp-2xl) var(--sp-md)", maxWidth: 1200 }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--sp-md)", marginBottom: "var(--sp-xl)" }}>
        <div>
          <h1 style={{ fontSize: "2.2rem", color: "var(--navy)", margin: "0 0 6px" }}>Event Photo Album & Gallery</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Visual records, workshop highlights, and geotagged moments across all IEEE SB chapters.
          </p>
        </div>

        {isOfficer && (
          <button className="btn btn-primary" onClick={() => handleOpenUpload()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>📸</span> Upload Event Photos
          </button>
        )}
      </div>

      {/* ── Album Grid ── */}
      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius)" }} />
      ) : albums.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 360px))", gap: "var(--sp-lg)" }}>
          {albums.map((a) => (
            <div
              key={a.eventId}
              className="card"
              onClick={() => handleOpenAlbum(a)}
              style={{
                maxWidth: 380,
                width: "100%",
                cursor: "pointer",
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Cover Photo */}
              <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", backgroundColor: "#f1f5f9", overflow: "hidden" }}>
                <img
                  src={getMediaUrl(a.coverPhoto)}
                  alt={a.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", display: "block" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://placehold.co/400x260/00629B/ffffff?text=IEEE+SB+SNGCE";
                  }}
                />
                <span
                  className="badge badge-primary"
                  style={{ position: "absolute", top: 12, left: 12, backdropFilter: "blur(4px)" }}
                >
                  {a.unit} Chapter
                </span>
                <span
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    background: "rgba(0,0,0,0.75)",
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                >
                  📷 {a.photoCount} photo{a.photoCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Album Details */}
              <div style={{ padding: "var(--sp-md)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", color: "var(--navy)", margin: "0 0 6px", fontWeight: 700 }}>
                    {a.title}
                  </h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    📅 {new Date(a.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>

                {isOfficer && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>ExeCom Managed</span>
                    <span style={{ fontSize: "0.78rem", color: "#00629B", fontWeight: 600 }}>Manage Album ✏️</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>No event albums yet</h3>
          <p>Photos uploaded by chapter officers will appear here in the gallery.</p>
        </div>
      )}

      {/* ── Album Expanded Modal ── */}
      {selectedAlbum && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
          padding: "var(--sp-md)",
        }}>
          <div className="card" style={{ width: 920, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", padding: "var(--sp-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-lg)", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span className="badge badge-primary">{selectedAlbum.unit} Chapter</span>
                <h2 style={{ fontSize: "1.4rem", color: "var(--navy)", margin: "6px 0 2px" }}>{selectedAlbum.title}</h2>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {new Date(selectedAlbum.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} • {albumPhotos.length} photo{albumPhotos.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isOfficer && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: "0.82rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
                    onClick={() => handleOpenUpload(selectedAlbum.eventId)}
                  >
                    <span>➕</span> Add Photos
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  style={{ fontSize: "1.2rem", padding: "4px 10px" }}
                  onClick={() => setSelectedAlbum(null)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* In-modal alerts */}
            {actionAlert.text && (
              <div className={`alert alert-${actionAlert.type}`} style={{ marginBottom: "var(--sp-md)", padding: "8px 12px", fontSize: "0.84rem" }}>
                {actionAlert.text}
              </div>
            )}

            {loadingPhotos ? (
              <div className="skeleton" style={{ height: 250, borderRadius: "var(--radius)" }} />
            ) : albumPhotos.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 280px))", gap: "var(--sp-md)" }}>
                {albumPhotos.map((photo) => (
                  <div
                    key={photo._id}
                    style={{
                      maxWidth: 290,
                      width: "100%",
                      borderRadius: "var(--radius)",
                      overflow: "hidden",
                      border: photo.isCover ? "2px solid #00629B" : "1px solid var(--border)",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: photo.isCover ? "0 4px 12px rgba(0, 98, 155, 0.16)" : "var(--shadow-sm)",
                    }}
                  >
                    {/* Photo with open full-size link */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", overflow: "hidden", backgroundColor: "#f8fafc" }}>
                      <a href={getMediaUrl(photo.url)} target="_blank" rel="noopener noreferrer" title="Click to view full size">
                        <img
                          src={getMediaUrl(photo.url)}
                          alt={photo.caption || "Event Photo"}
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", display: "block" }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://placehold.co/400x260/00629B/ffffff?text=IEEE+SB+Event";
                          }}
                        />
                      </a>

                      {photo.isCover && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "linear-gradient(135deg, #00629B 0%, #004976 100%)",
                            color: "#fff",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 4,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          }}
                        >
                          ⭐ Cover Photo
                        </span>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: photo.caption ? "var(--text)" : "var(--text-muted)", fontStyle: photo.caption ? "normal" : "italic", marginBottom: 4 }}>
                          {photo.caption || "No caption provided"}
                        </div>
                        {photo.geoLocation?.lat && photo.geoLocation?.lng && (
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 6 }}>
                            📍 {photo.geoLocation.lat.toFixed(4)}, {photo.geoLocation.lng.toFixed(4)}
                          </div>
                        )}
                      </div>

                      {/* Officer Edit Bar */}
                      {isOfficer && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, paddingTop: 8, borderTop: "1px solid #f1f5f9", marginTop: 6 }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: "0.75rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={() => handleOpenEditPhoto(photo)}
                            title="Edit caption & cover"
                          >
                            ✏️ Edit
                          </button>

                          {!photo.isCover && (
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ fontSize: "0.75rem", padding: "4px 8px", color: "#00629B", borderColor: "#bae6fd" }}
                              onClick={() => handleQuickSetCover(photo)}
                              title="Make this the album cover photo"
                            >
                              ⭐ Set Cover
                            </button>
                          )}

                          <button
                            type="button"
                            style={{
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                              background: "#fff",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                            }}
                            onClick={() => handleDeletePhoto(photo)}
                            title="Delete photo from album"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: "center", color: "var(--text-muted)" }}>No photos available for this event.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Photo Modal (for Officers) ── */}
      {editingPhoto && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300,
          padding: "var(--sp-md)",
        }}>
          <div className="card" style={{ width: 480, maxWidth: "95vw", padding: "var(--sp-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-md)" }}>
              <h3 style={{ margin: 0, color: "var(--navy)" }}>Edit Photo</h3>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "1rem", padding: "2px 8px" }}
                onClick={() => setEditingPhoto(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: "center", marginBottom: "var(--sp-md)" }}>
              <img
                src={getMediaUrl(editingPhoto.url)}
                alt="Preview"
                style={{ maxHeight: 180, maxWidth: "100%", borderRadius: "var(--radius)", objectFit: "contain", border: "1px solid var(--border)" }}
              />
            </div>

            {editError && (
              <div className="alert alert-error" style={{ marginBottom: "var(--sp-md)" }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSavePhotoEdit}>
              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Caption (Max 200 characters)
                </label>
                <input
                  type="text"
                  value={editCaption}
                  maxLength={200}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="e.g. Inaugural keynote session"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-lg)", display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="makeCoverCheckbox"
                  checked={editIsCover}
                  onChange={(e) => setEditIsCover(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <label htmlFor="makeCoverCheckbox" style={{ fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", color: "var(--navy)" }}>
                  ⭐ Set as Album Cover Photo
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                  onClick={() => handleDeletePhoto(editingPhoto)}
                >
                  🗑️ Delete Photo
                </button>

                <div style={{ display: "flex", gap: "var(--sp-sm)" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingPhoto(null)} disabled={editSaving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editSaving}>
                    {editSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ExeCom Photo Upload Modal ── */}
      {showUploadModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200,
          padding: "var(--sp-md)",
        }}>
          <div className="card" style={{ width: 500, maxWidth: "95vw", padding: "var(--sp-xl)" }}>
            <h3 style={{ margin: "0 0 6px", color: "var(--navy)" }}>Upload Event Photos</h3>
            <p style={{ margin: "0 0 var(--sp-md)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              ExeCom Officer media upload. Files stored securely on server disk storage.
            </p>

            {uploadMsg.text && (
              <div className={`alert alert-${uploadMsg.type}`} style={{ marginBottom: "var(--sp-md)" }}>
                {uploadMsg.text}
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Select Event *</label>
                <select
                  required
                  value={uploadEventId}
                  onChange={(e) => setUploadEventId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                >
                  {events.map((e) => (
                    <option key={e._id} value={e._id}>{e.title} ({new Date(e.date).toLocaleDateString("en-IN")})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Select Photos (Max 20, max 5MB each, .jpg/.png/.webp) *
                </label>
                <input
                  type="file"
                  required
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  style={{ width: "100%", padding: "6px" }}
                />
                {selectedFiles.length > 0 && (
                  <div style={{ fontSize: "0.78rem", color: "#16a34a", marginTop: 4 }}>
                    {selectedFiles.length} file(s) selected
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "var(--sp-md)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Caption (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hands-on coding session in Lab 3"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1.5px solid var(--border-dark)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--sp-lg)", background: "#f8fafc", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>📍 Capture Geolocation</span>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Records coordinates for official audit & reports</div>
                  </div>
                  <button type="button" className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.78rem" }} onClick={handleCaptureGeo}>
                    Get Location
                  </button>
                </div>
                {geoStatus && <div style={{ fontSize: "0.78rem", color: "#00629B", marginTop: 6 }}>{geoStatus}</div>}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-sm)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? "Uploading Photos…" : "Upload to Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
