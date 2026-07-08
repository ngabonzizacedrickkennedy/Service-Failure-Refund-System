import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
  deviceToken?: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  fullName: string;
  profileImageUrl: string | null;
  deviceToken: string | null;
  requiresOtp: boolean;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
  deviceToken?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: "PROVIDER" | "WORKER";
}

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

function getOrCreateDeviceToken(): string {
  let token = localStorage.getItem("deviceToken");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("deviceToken", token);
  }
  return token;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const deviceToken = getOrCreateDeviceToken();
    const res = await api.post<LoginResponse>("/api/auth/login", {
      ...data,
      deviceToken,
    });
    return res.data;
  },

  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    const deviceToken = getOrCreateDeviceToken();
    const res = await api.post<LoginResponse>("/api/auth/verify-otp", {
      email,
      otp,
      deviceToken,
    });
    return res.data;
  },

  async register(data: RegisterRequest): Promise<UserResponse> {
    const res = await api.post<UserResponse>("/api/auth/register", data);
    return res.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/api/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post("/api/auth/reset-password", { token, newPassword });
  },

  saveSession(data: LoginResponse) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    if (data.deviceToken) {
      localStorage.setItem("deviceToken", data.deviceToken);
    }
  },

  getSession(): LoginResponse | null {
    const user = localStorage.getItem("user");
    if (!user) return null;
    try {
      return JSON.parse(user) as LoginResponse;
    } catch {
      return null;
    }
  },

  updateSessionImage(profileImageUrl: string | null) {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const user = JSON.parse(raw) as LoginResponse;
      user.profileImageUrl = profileImageUrl;
      localStorage.setItem("user", JSON.stringify(user));
    } catch {
      // ignore
    }
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  getDashboardPath(role: string): string {
    switch (role) {
      case "ADMIN":         return "/dashboard/admin";
      case "PROVIDER":      return "/dashboard/provider";
      case "WORKER":        return "/dashboard/worker";
      case "EVALUATOR":     return "/dashboard/evaluator";
      case "REFUND_OFFICE": return "/dashboard/refund-office";
      default:              return "/login";
    }
  },
};
