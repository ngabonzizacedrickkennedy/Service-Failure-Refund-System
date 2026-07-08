import axios from "axios";

const REFUND_API_URL =
  process.env.NEXT_PUBLIC_REFUND_API_URL || "http://localhost:8086";

const refundApi = axios.create({
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

export interface RefundClaimResponse {
  id: string;
  projectId: string;
  providerId: string;
  workerId: string;
  description: string;
  status: string;
  proofDocumentUrls: string[];
  ghostProjectImageUrls: string[];
  messageEvidence: string | null;
  geotagPhotoUrl: string | null;
  extractedLat: number | null;
  extractedLon: number | null;
  extractedPhotoTimestamp: string | null;
  workerResponse: string | null;
  aiMediationReport: string | null;
  projectBudget: number | null;
  createdAt: string;
  updatedAt: string;
}

export const refundService = {
  async initiateRefund(id: string): Promise<RefundClaimResponse> {
    const res = await refundApi.patch<RefundClaimResponse>(`/api/evaluator/claims/${id}/initiate-refund`);
    return res.data;
  },

  async getRefundPendingClaims(): Promise<RefundClaimResponse[]> {
    const res = await refundApi.get<RefundClaimResponse[]>("/api/refund-office/claims");
    return res.data;
  },

  async getRefundedClaims(): Promise<RefundClaimResponse[]> {
    const res = await refundApi.get<RefundClaimResponse[]>("/api/refund-office/claims/refunded");
    return res.data;
  },

  async processRefund(claimId: string): Promise<RefundClaimResponse> {
    const res = await refundApi.patch<RefundClaimResponse>(`/api/refund-office/claims/${claimId}/process-refund`);
    return res.data;
  },
};
