import executionApi from "./executionApi";
import evaluationApi from "./evaluationApi";

export interface JustificationResponse {
  id: string;
  claimId: string;
  workerId: string;
  description: string;
  evidenceUrls: string[];
  status: "SUBMITTED" | "VALIDATED" | "REJECTED";
  evaluatorNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JustificationWithClaimDto {
  claimId: string;
  projectId: string;
  workerId: string;
  providerId: string;
  claimDescription: string;
  claimStatus: string;
  claimCreatedAt: string;
  justificationId: string | null;
  justificationDescription: string | null;
  evidenceUrls: string[];
  justificationStatus: "SUBMITTED" | "VALIDATED" | "REJECTED" | null;
  evaluatorNotes: string | null;
  justificationCreatedAt: string | null;
}

export const justificationService = {
  async submitJustification(
    claimId: string,
    description: string,
    evidenceFiles: File[]
  ): Promise<JustificationResponse> {
    const form = new FormData();
    form.append("description", description);
    evidenceFiles.forEach((f) => form.append("evidenceFiles", f));
    const res = await executionApi.post<JustificationResponse>(
      `/api/justifications/claim/${claimId}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  async getJustification(claimId: string): Promise<JustificationResponse | null> {
    try {
      const res = await executionApi.get<JustificationResponse>(
        `/api/justifications/claim/${claimId}`,
        { cache: false }
      );
      return res.data;
    } catch {
      return null;
    }
  },

  // Evaluator endpoints
  async getAllJustifications(): Promise<JustificationWithClaimDto[]> {
    const res = await evaluationApi.get<JustificationWithClaimDto[]>(
      "/api/evaluator/justifications",
      { cache: false }
    );
    return res.data;
  },

  async requestJustificationEmail(
    claimId: string,
    workerEmail: string,
    workerName: string
  ): Promise<void> {
    await evaluationApi.post(`/api/evaluator/justifications/${claimId}/request-email`, {
      workerEmail,
      workerName,
    });
  },

  async validateJustification(
    claimId: string,
    notes?: string
  ): Promise<JustificationWithClaimDto> {
    const res = await evaluationApi.patch<JustificationWithClaimDto>(
      `/api/evaluator/justifications/${claimId}/validate`,
      { notes: notes || "" }
    );
    return res.data;
  },

  async rejectJustification(
    claimId: string,
    notes?: string
  ): Promise<JustificationWithClaimDto> {
    const res = await evaluationApi.patch<JustificationWithClaimDto>(
      `/api/evaluator/justifications/${claimId}/reject`,
      { notes: notes || "" }
    );
    return res.data;
  },
};
