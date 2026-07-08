import executionApi from "./executionApi";

export interface ContractResponse {
  id: string;
  projectId: string;
  projectTitle: string;

  workerId: string;
  workerName: string;
  workerEmail: string | null;
  workerPhone: string | null;

  providerId: string;
  providerName: string;
  providerEmail: string | null;
  providerPhone: string | null;

  workerSigned: boolean;
  workerSignedAt: string | null;
  providerSigned: boolean;
  providerSignedAt: string | null;
  adminValidated: boolean;
  validatedAt: string | null;
  createdAt: string;
}

export const contractService = {
  async getMyContracts(): Promise<ContractResponse[]> {
    const res = await executionApi.get<ContractResponse[]>("/api/contracts/my");
    return res.data;
  },

  async getOrCreateForProject(projectId: string, details?: {
    workerName?: string; workerEmail?: string; workerPhone?: string;
    providerName?: string; providerEmail?: string; providerPhone?: string;
  }): Promise<ContractResponse> {
    const res = await executionApi.post<ContractResponse>(`/api/contracts/project/${projectId}`, details ?? {});
    return res.data;
  },

  async sign(contractId: string): Promise<ContractResponse> {
    const res = await executionApi.patch<ContractResponse>(`/api/contracts/${contractId}/sign`);
    return res.data;
  },

  async getAllContracts(): Promise<ContractResponse[]> {
    const res = await executionApi.get<ContractResponse[]>("/api/contracts/all");
    return res.data;
  },

  async validate(contractId: string): Promise<ContractResponse> {
    const res = await executionApi.patch<ContractResponse>(`/api/contracts/${contractId}/validate`);
    return res.data;
  },
};
