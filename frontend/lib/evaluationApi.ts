import Axios from "axios";

const EVALUATION_API_URL =
  process.env.NEXT_PUBLIC_EVALUATION_API_URL || "http://localhost:8085";

const evaluationApi = Axios.create({
  baseURL: EVALUATION_API_URL,
  headers: { "Content-Type": "application/json" },
});

evaluationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

evaluationApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default evaluationApi;
