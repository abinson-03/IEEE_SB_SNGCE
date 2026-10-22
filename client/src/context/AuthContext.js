import React, { createContext, useContext, useState, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

/**
 * AuthContext
 * Provides authentication state (user, token) and actions (login, logout)
 * to the entire React component tree via Context API.
 *
 * Persistence strategy: JWT and user object are stored in localStorage so
 * sessions survive page refreshes. Sprint 3+ can layer in refresh tokens.
 *
 * Consumed by child components via the useAuth() hook.
 */

// ─── Context creation ───────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Helper: load initial state from localStorage ───────────────────────────
const loadStoredAuth = () => {
  try {
    const token = localStorage.getItem("ieee_token");
    const user = JSON.parse(localStorage.getItem("ieee_user"));
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

// ─── Provider ───────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const stored = loadStoredAuth();
  const [token, setToken] = useState(stored.token || null);
  const [user, setUser] = useState(stored.user || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * login(email, password)
   * Calls POST /api/auth/login, stores the JWT and user in localStorage,
   * and updates context state.
   * Returns the user object on success; throws on failure.
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post("/auth/login", { email, password });
      const { token: newToken, user: newUser } = data;

      // Persist to localStorage
      localStorage.setItem("ieee_token", newToken);
      localStorage.setItem("ieee_user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * register(name, email, password, globalRole?)
   * Calls POST /api/auth/register. On success, automatically logs the user in
   * (stores token and user) so they land on the dashboard directly.
   * Returns the user object on success.
   */
  const register = useCallback(async (name, email, password, globalRole, chapterMemberships) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
        ...(globalRole && { globalRole }),
        ...(chapterMemberships && { chapterMemberships }),
      });
      const { token: newToken, user: newUser } = data;

      localStorage.setItem("ieee_token", newToken);
      localStorage.setItem("ieee_user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * logout()
   * Calls POST /api/auth/logout (confirms on server), then clears local state
   * and localStorage. The JWT itself is stateless — the client drop is the
   * effective logout until token blacklisting is added in Sprint 3+.
   */
  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // Ignore errors — we clear locally regardless
    } finally {
      localStorage.removeItem("ieee_token");
      localStorage.removeItem("ieee_user");
      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * updateUser(updatedUser)
   * Updates the current user state and persists to localStorage.
   */
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem("ieee_user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Custom hook ─────────────────────────────────────────────────────────────
/**
 * useAuth()
 * Convenience hook for consuming AuthContext. Must be used inside <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
};

export default AuthContext;
