// src/utils/api.js
import axios from "axios";

// Create a base axios instance pointing to your Phoenix API
const apiClient = axios.create({
  baseURL: "http://192.168.1.112:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send cookies if needed
});

// Base HTTP method helpers
export const post = (url, data) => apiClient.post(url, data);
export const get = (url, params) => apiClient.get(url, { params });
export const put = (url, data) => apiClient.put(url, data);
export const del = (url) => apiClient.delete(url);

// ===========================
// Specific API Functions
// ===========================

// Auth
export const login = async (email, password) => {
  const response = await post("/auth/login", { email, password });
  return response.data;
};

export const logout = async (token) => {
  const response = await post("/auth/logout", { token });
  return response.data;
};

export const getProfile = async () => {
  const response = await get("/auth/profile");
  return response.data;
};
// Team Management
export const getTeamMembers = async () => {
  const response = await get("/users");
  return response.data;
};

// Add more API functions as needed:
// export const updateProfile = async (data) => {
//   const response = await put('/profile', data);
//   return response.data;
// };

export default apiClient;
