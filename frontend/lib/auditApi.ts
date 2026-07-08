import Axios from "axios";

const AUDIT_API_URL =
  process.env.NEXT_PUBLIC_AUDIT_API_URL || "http://localhost:8087";

const auditApi = Axios.create({
  baseURL: AUDIT_API_URL,
  headers: { "Content-Type": "application/json" },
});

auditApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

auditApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default auditApi;
