// src/store/authStore.js
import { ref, computed } from "vue";
import * as api from "@/utils/api";
import db from "@/db/database";

const TOKEN_KEY = "timemanager_token";
const REFRESH_TOKEN_KEY = "timemanager_refresh_token";
const USER_KEY = "timemanager_user";

// Helper function to normalize role
function normalizeRole(role) {
  if (role === "general_manager") return "gm";
  return role;
}

// Reactive state
export const token = ref(localStorage.getItem(TOKEN_KEY) || null);
export const refreshToken = ref(
  localStorage.getItem(REFRESH_TOKEN_KEY) || null
);
export const user = ref(null);

// Computed
export const isAuthenticated = computed(() => !!token.value && !!user.value);
export const userRole = computed(() => user.value?.role || null);
export const isManager = computed(() =>
  ["manager", "gm"].includes(user.value?.role)
);
export const isGM = computed(() => user.value?.role === "gm");

/**
 * Initialize auth from localStorage
 */
export async function initializeAuth() {
  console.log("🔐 Initializing auth...");

  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      token.value = storedToken;
      const userData = JSON.parse(storedUser);

      // Normalize role
      userData.role = normalizeRole(userData.role);
      user.value = userData;

      // Set token in axios headers
      api.default.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${storedToken}`;

      // Try to fetch fresh profile if online
      if (navigator.onLine) {
        try {
          await fetchProfile();
        } catch (err) {
          console.warn("Failed to fetch fresh profile:", err);
        }
      }

      console.log(
        "✅ Auth initialized:",
        user.value?.email,
        "Role:",
        user.value?.role
      );
    } else {
      console.log("❌ No stored auth found");
    }
  } catch (error) {
    console.error("Auth initialization error:", error);
    clearAuth();
  }
}

/**
 * Login user
 */
export async function login(email, password) {
  try {
    const response = await api.post("/auth/login", { email, password });

    if (response.data.success) {
      const {
        token: authToken,
        refreshToken: refToken,
        user: userData,
      } = response.data;

      // Normalize role
      userData.role = normalizeRole(userData.role);

      // Store in state FIRST
      token.value = authToken;
      refreshToken.value = refToken;
      user.value = userData;

      // Then store in localStorage
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      // Set axios header
      api.default.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${authToken}`;

      // Save user to local DB
      db.saveUserData(userData.id, userData);

      console.log(
        "✅ Login successful:",
        userData.email,
        "Role:",
        userData.role
      );

      // Return immediately with success
      return { success: true, user: userData };
    }

    return { success: false, error: "Login failed" };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Login failed",
    };
  }
}

/**
 * Register user (GM only)
 */
export async function register(userData) {
  try {
    const response = await api.post("/auth/register", { user: userData });

    if (response.data.success) {
      return { success: true, user: response.data.user };
    }

    return { success: false, error: "Registration failed" };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Registration failed",
    };
  }
}

/**
 * Fetch current user profile
 */
export async function fetchProfile() {
  try {
    const response = await api.get("/auth/profile");

    if (response.data.success) {
      const userData = response.data.user;

      // Normalize role
      userData.role = normalizeRole(userData.role);

      user.value = userData;
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      // Update local DB
      db.saveUserData(userData.id, userData);

      return userData;
    }
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    throw error;
  }
}

/**
 * Refresh auth token
 */
export async function refreshAuthToken() {
  try {
    if (!refreshToken.value) {
      throw new Error("No refresh token available");
    }

    const response = await api.post("/auth/refresh", {
      refresh_token: refreshToken.value,
    });

    if (response.data.success) {
      const newToken = response.data.token;
      token.value = newToken;
      localStorage.setItem(TOKEN_KEY, newToken);
      api.default.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newToken}`;

      return true;
    }

    return false;
  } catch (error) {
    console.error("Token refresh error:", error);
    clearAuth();
    return false;
  }
}

/**
 * Logout user
 */
export async function logout() {
  try {
    // Call logout endpoint (optional, backend doesn't require it)
    await api.post("/auth/logout");
  } catch (error) {
    console.warn("Logout API call failed:", error);
  } finally {
    clearAuth();
  }
}

/**
 * Clear all auth data
 */
export function clearAuth() {
  token.value = null;
  refreshToken.value = null;
  user.value = null;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  delete api.default.defaults.headers.common["Authorization"];

  console.log("🚪 Auth cleared");
}

/**
 * Get auth data
 */
export function getAuth() {
  return {
    token: token.value,
    refreshToken: refreshToken.value,
    user: user.value,
  };
}

/**
 * Check if user is authenticated
 */
export async function checkAuth() {
  return isAuthenticated.value;
}

/**
 * Get user role
 */
export async function getUserRole() {
  return userRole.value;
}

// Setup axios interceptor for token refresh
api.default.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${token.value}`;
        return api.default(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

console.log("✅ Auth store initialized");
