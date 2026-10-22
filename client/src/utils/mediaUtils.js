/**
 * Media & Asset URL utility.
 * Resolves static media paths (e.g. /uploads/events/..., /uploads/profiles/...)
 * to point to the Express backend host instead of the React SPA dev server origin.
 */

export const getServerOrigin = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export const getMediaUrl = (url, fallback = "") => {
  if (!url || typeof url !== "string") return fallback;
  const cleanUrl = url.trim();
  if (!cleanUrl) return fallback;

  // Already an absolute or data/blob URL
  if (
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://") ||
    cleanUrl.startsWith("data:") ||
    cleanUrl.startsWith("blob:")
  ) {
    return cleanUrl;
  }

  const origin = getServerOrigin();
  const normalizedPath = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  return `${origin}${normalizedPath}`;
};

export default getMediaUrl;
