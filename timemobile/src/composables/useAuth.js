import { ref } from "vue";
import * as api from "@/utils/api";

export function useAuth() {
  const user = ref(null);
  const token = ref(localStorage.getItem("token") || "");
  const refreshToken = ref(localStorage.getItem("refreshToken") || "");
  const loading = ref(false);
  const error = ref("");

  const setTokens = (newToken, newRefresh) => {
    token.value = newToken;
    refreshToken.value = newRefresh;
    localStorage.setItem("token", newToken);
    localStorage.setItem("refreshToken", newRefresh);
  };

  const clearTokens = () => {
    token.value = "";
    refreshToken.value = "";
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    user.value = null;
  };

  const login = async (email, password) => {
    loading.value = true;
    error.value = "";
    try {
      const res = await api.login(email, password);
      if (res.success) {
        setTokens(res.token, res.refreshToken);
        user.value = res.user;
      } else {
        error.value = res.error || "Login failed";
      }
    } catch (err) {
      error.value = err.message || "Login error";
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    if (token.value) {
      await api.logout(token.value);
    }
    clearTokens();
  };

  const fetchProfile = async () => {
    if (!token.value) return;
    try {
      // Set authorization header
      api.default.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token.value}`;
      const res = await api.get("/auth/profile");
      if (res.data) user.value = res.data;
    } catch (err) {
      console.error("Profile fetch error", err);
    }
  };

  return {
    user,
    token,
    refreshToken,
    loading,
    error,
    login,
    logout,
    fetchProfile,
  };
}
