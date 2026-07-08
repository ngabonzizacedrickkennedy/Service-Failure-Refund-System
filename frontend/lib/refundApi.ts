import Axios from "axios";

const REFUND_API_URL =
  process.env.NEXT_PUBLIC_REFUND_API_URL || "http://localhost:8086";

const refundApi = Axios.create({
  baseURL: REFUND_API_URL,
  headers: { "Content-Type": "application/json" },
});

refundApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

refundApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default refundApi;
