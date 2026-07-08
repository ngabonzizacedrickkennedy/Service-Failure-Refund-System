import Axios from "axios";
import { setupCache } from "axios-cache-interceptor";

const EXECUTION_API_URL =
  process.env.NEXT_PUBLIC_EXECUTION_API_URL || "http://localhost:8082";

const executionApi = setupCache(
  Axios.create({
    baseURL: EXECUTION_API_URL,
    headers: { "Content-Type": "application/json" },
  }),
  { ttl: 1000 * 60 * 5 } // cache GET responses for 5 minutes
);

executionApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

executionApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      executionApi.storage.clear();
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default executionApi;
