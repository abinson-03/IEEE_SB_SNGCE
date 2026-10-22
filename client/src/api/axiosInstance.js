import axios from "axios";

/**
 * Axios Instance
 * Pre-configured with the API base URL. A request interceptor automatically
 * attaches the JWT from localStorage to every outgoing request header.
 *
 * Design choice: token is stored in localStorage for simplicity in Sprint 1.
 * Sprint 3+ can migrate to httpOnly cookies for improved XSS resistance.
 */
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }
  return "http://localhost:5000/api";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT if present
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ieee_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally (token expired/invalid)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data and redirect to login
      // NOTE: avoid circular import by not importing AuthContext here;
      // the context's logout() also calls localStorage.removeItem.
      localStorage.removeItem("ieee_token");
      localStorage.removeItem("ieee_user");
      // Only redirect if not already on the login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
