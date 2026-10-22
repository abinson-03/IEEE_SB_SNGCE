import React, { useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";

const CertificateTemplateModal = ({ event, isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const fileInputRef                    = useRef(null);

  if (!isOpen || !event) return null;

  const currentTemplate = event.certificateTemplatePath;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    // Validate type: strictly JPG and PNG
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError("Invalid file type. Only JPG and PNG images are supported.");
      return;
    }

    // Validate size: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB size limit. Please upload an image under 5MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("template", selectedFile);

    try {
      const res = await axiosInstance.post(
        `/events/${event._id}/certificate-template`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setSuccess("Certificate template saved successfully!");
      if (onSuccess) {
        onSuccess(event._id, res.data.certificateTemplatePath);
      }
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload certificate template.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Revert to the default IEEE certificate design for this event?")) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await axiosInstance.delete(`/events/${event._id}/certificate-template`);
      setSuccess("Custom template removed. Default design will be used.");
      if (onSuccess) {
        onSuccess(event._id, null);
      }
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove custom template.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={handleClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 620,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "var(--radius)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "var(--sp-lg)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--navy)" }}>
              🎨 Certificate Template Design
            </h3>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Event: <strong>{event.title}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "var(--sp-lg)" }}>
          {/* Status Indicator */}
          <div style={{ marginBottom: "var(--sp-md)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Current Template Status:</span>
            {currentTemplate ? (
              <span
                style={{
                  background: "#ede9fe",
                  color: "#6d28d9",
                  border: "1px solid #c4b5fd",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                ✓ Custom Background Configured
              </span>
            ) : (
              <span
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                🏛️ Default IEEE Branded Layout
              </span>
            )}
          </div>

          {/* Guidelines */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: "0.82rem",
              color: "#475569",
              marginBottom: "var(--sp-md)",
              lineHeight: 1.5,
            }}
          >
            <strong>📌 Template Requirements:</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: "1.2rem" }}>
              <li>Landscape orientation recommended (e.g. 1920×1080 or A4 ratio).</li>
              <li>Max file size: <strong>5MB</strong>. Format: <strong>JPG or PNG</strong>.</li>
              <li>Attendee names, event title, dates, and verification IDs will be dynamically overlaid on top.</li>
            </ul>
          </div>

          {/* Active Preview */}
          {(previewUrl || currentTemplate) && (
            <div style={{ marginBottom: "var(--sp-md)", textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)", marginBottom: 6, textAlign: "left" }}>
                {previewUrl ? "Preview of Selected File:" : "Active Custom Template:"}
              </div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 200,
                  background: "#f1f5f9",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: "1.5px dashed #00629B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={previewUrl || currentTemplate}
                  alt="Certificate Template"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "var(--sp-md)" }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "8px 12px", background: "#f0fdf4", color: "#16a34a", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "var(--sp-md)", fontWeight: 600 }}>
              ✓ {success}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap", marginTop: "var(--sp-md)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ fontSize: "0.85rem" }}
              >
                📁 {previewUrl || currentTemplate ? "Choose Another Image" : "Choose Image File"}
              </button>

              {currentTemplate && !previewUrl && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleRemove}
                  disabled={uploading}
                  style={{ fontSize: "0.85rem", color: "#dc2626", borderColor: "#fca5a5" }}
                >
                  🗑️ Revert to Default
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {previewUrl && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{ fontSize: "0.85rem", padding: "6px 18px" }}
                >
                  {uploading ? "Saving..." : "Save Template"}
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClose}
                disabled={uploading}
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplateModal;
