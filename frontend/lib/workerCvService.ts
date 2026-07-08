import executionApi from "./executionApi";

export interface WorkerCvResponse {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  cvFileUrl: string | null;
  yearsOfExperience: number;
  specialization: string;
  additionalCredentials: string | null;
  ratingScore: number;
  ratingReasoning: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  completedProjects: number;
  pastFailures: number;
  banned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FailedProjectSummary {
  claimId: string;
  projectId: string;
  projectTitle: string;
  projectBudget: number | null;
  claimStatus: string;
  claimCreatedAt: string;
}

export interface WorkerMonitorEntry {
  workerId: string;
  workerName: string;
  workerEmail: string;
  specialization: string;
  ratingScore: number;
  yearsOfExperience: number;
  completedProjects: number;
  pastFailures: number;
  approvalStatus: string;
  banned: boolean;
  failedProjects: FailedProjectSummary[];
}

export const workerCvService = {
  async submitOrUpdateCv(
    specialization: string,
    yearsOfExperience: number,
    additionalCredentials: string,
    cvFile?: File
  ): Promise<WorkerCvResponse> {
    const form = new FormData();
    form.append("specialization", specialization);
    form.append("yearsOfExperience", String(yearsOfExperience));
    form.append("additionalCredentials", additionalCredentials);
    if (cvFile) form.append("cvFile", cvFile);
    const res = await executionApi.post<WorkerCvResponse>("/api/worker-cv", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getMyCv(): Promise<WorkerCvResponse> {
    const res = await executionApi.get<WorkerCvResponse>("/api/worker-cv/my");
    return res.data;
  },

  async getWorkerCv(workerId: string): Promise<WorkerCvResponse> {
    const res = await executionApi.get<WorkerCvResponse>(`/api/worker-cv/${workerId}`);
    return res.data;
  },

  async getAllCvs(): Promise<WorkerCvResponse[]> {
    const res = await executionApi.get<WorkerCvResponse[]>("/api/worker-cv/all");
    return res.data;
  },

  async setApprovalStatus(workerId: string, approvalStatus: "APPROVED" | "REJECTED" | "PENDING"): Promise<void> {
    await executionApi.patch(`/api/worker-cv/${workerId}/approval`, { approvalStatus });
  },

  async getWorkersForMonitor(): Promise<WorkerMonitorEntry[]> {
    const res = await executionApi.get<WorkerMonitorEntry[]>("/api/worker-cv/monitor");
    return res.data;
  },

  async setBanStatus(workerId: string, banned: boolean): Promise<void> {
    await executionApi.patch(`/api/worker-cv/${workerId}/ban`, { banned });
  },
};
