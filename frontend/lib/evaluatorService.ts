import evaluationApi from "./evaluationApi";

export interface EvaluatorClaimResponse {
  id: string;
  projectId: string;
  providerId: string;
  workerId: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUND_INITIATED" | "REFUNDED";
  proofDocumentUrls: string[];
  ghostProjectImageUrls: string[];
  messageEvidence: string | null;
  geotagPhotoUrl: string | null;
  extractedLat: number | null;
  extractedLon: number | null;
  extractedPhotoTimestamp: string | null;
  workerResponse: string | null;
  aiMediationReport: string | null;
  constructionLocation: string | null;
  projectTitle: string | null;
  projectStatus: "OPEN" | "ASSIGNED" | "COMPLETED" | "FAILED" | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageEvidenceItem {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  sentAt: string;
}

export const evaluatorService = {
  async getAllClaims(status?: string): Promise<EvaluatorClaimResponse[]> {
    const params = status && status !== "ALL" ? { status } : {};
    const res = await evaluationApi.get("/api/evaluator/claims", { params });
    return res.data;
  },

  async getClaimById(id: string): Promise<EvaluatorClaimResponse> {
    const res = await evaluationApi.get(`/api/evaluator/claims/${id}`);
    return res.data;
  },

  async approveClaim(id: string): Promise<EvaluatorClaimResponse> {
    const res = await evaluationApi.patch(`/api/evaluator/claims/${id}/approve`);
    return res.data;
  },

  async rejectClaim(id: string): Promise<EvaluatorClaimResponse> {
    const res = await evaluationApi.patch(`/api/evaluator/claims/${id}/reject`);
    return res.data;
  },
};
