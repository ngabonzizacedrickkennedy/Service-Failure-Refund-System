
import Axios from "axios";
import { setupCache } from "axios-cache-interceptor";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const api = setupCache(
  Axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  }),
  { ttl: 1000 * 60 * 5 } // cache GET responses for 5 minutes
);

// Attach JWT token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If token expired (401), clear cache + localStorage and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      api.storage.clear();
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
