import Axios from "axios";

const NOTIFICATION_API_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || "http://localhost:8084";

const notificationApi = Axios.create({
  baseURL: NOTIFICATION_API_URL,
  headers: { "Content-Type": "application/json" },
});

notificationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  async getMyNotifications(): Promise<NotificationItem[]> {
    const res = await notificationApi.get<NotificationItem[]>("/api/notifications/my");
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await notificationApi.get<{ count: number }>("/api/notifications/my/unread-count");
    return res.data.count;
  },

  async markRead(id: string): Promise<void> {
    await notificationApi.patch(`/api/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await notificationApi.patch("/api/notifications/read-all");
  },

  parseData(data: string): Record<string, string> {
    try {
      return JSON.parse(data) as Record<string, string>;
    } catch {
      return {};
    }
  },

  getLinkForNotification(notification: NotificationItem): string {
    const d = notificationService.parseData(notification.data);
    switch (notification.type) {
      case "WORKER_ASSIGNED":
        return "/dashboard/worker/projects";
      case "PROVIDER_WORKER_ASSIGNED":
        return d.projectId
          ? `/dashboard/provider/projects/${d.projectId}`
          : "/dashboard/provider/projects";
      case "WORKER_APPROVED":
      case "WORKER_REJECTED":
      case "WORKER_CV_STATUS":
        return "/dashboard/worker/cv";
      case "PROJECT_MARKED_FAILED":
        return "/dashboard/admin/projects";
      case "CLAIM_APPROVED_AGAINST_WORKER":
      case "CLAIM_REJECTED_AGAINST_WORKER":
        return "/dashboard/worker/claims";
      case "CLAIM_APPROVED_FOR_PROVIDER":
      case "CLAIM_REJECTED_FOR_PROVIDER":
        return d.claimId
          ? `/dashboard/provider/claims/${d.claimId}`
          : "/dashboard/provider/claims";
      case "REFUND_PROCESS_REQUESTED":
        return "/dashboard/refund-office/claims";
      case "REFUND_COMPLETED":
        return "/dashboard/provider/account";
      case "ADMIN_MESSAGE":
        return "/dashboard/provider/projects";
      default:
        return "#";
    }
  },
};
