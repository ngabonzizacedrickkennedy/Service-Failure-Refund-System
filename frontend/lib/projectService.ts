import executionApi from "./executionApi";

export interface ProjectImageResponse {
  id: string;
  imageUrl: string;
  description: string;
  displayOrder: number;
}

export const PROJECT_CATEGORIES = [
  { value: "SOFTWARE_DEVELOPMENT", label: "Software Development" },
  { value: "DESIGN_CREATIVE",      label: "Design & Creative" },
  { value: "DATA_AI",              label: "Data & AI" },
  { value: "MANAGEMENT",           label: "Project & Product Management" },
  { value: "ENGINEERING",          label: "Engineering" },
  { value: "CONSTRUCTION",         label: "Construction" },
  { value: "MARKETING",            label: "Marketing & Content" },
  { value: "FINANCE_ACCOUNTING",   label: "Finance & Accounting" },
  { value: "LEGAL_COMPLIANCE",     label: "Legal & Compliance" },
  { value: "HEALTHCARE",           label: "Healthcare" },
  { value: "EDUCATION_TRAINING",   label: "Education & Training" },
  { value: "LOGISTICS",            label: "Logistics & Supply Chain" },
  { value: "OTHER",                label: "Other" },
] as const;

export type ProjectCategoryValue = typeof PROJECT_CATEGORIES[number]["value"];

export interface CreateProjectRequest {
  title: string;
  scopeOfWork: string;
  requiredSkills: string;
  category: ProjectCategoryValue;
  constructionLocation?: string;
  deadline: string;
  budget: number;
  images?: { file: File; description: string }[];
}

export interface ProjectResponse {
  id: string;
  providerId: string;
  title: string;
  scopeOfWork: string;
  requiredSkills: string;
  category: ProjectCategoryValue | null;
  categoryDisplayName: string | null;
  constructionLocation: string | null;
  deadline: string;
  budget: number;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "FAILED";
  funded: boolean;
  assignedWorkerId: string | null;
  images: ProjectImageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface RankedWorkerResponse {
  workerId: string;
  workerName: string;
  workerEmail: string;
  specialization: string;
  yearsOfExperience: number;
  ratingScore: number;
  rankScore: number;
}

export const projectService = {
  async createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    const form = new FormData();
    form.append("title", data.title);
    form.append("scopeOfWork", data.scopeOfWork);
    form.append("requiredSkills", data.requiredSkills);
    form.append("category", data.category);
    if (data.constructionLocation) form.append("constructionLocation", data.constructionLocation);
    form.append("deadline", data.deadline);
    form.append("budget", String(data.budget));

    if (data.images && data.images.length > 0) {
      data.images.forEach((img) => {
        form.append("images", img.file);
        form.append("imageDescriptions", img.description);
      });
    }

    const res = await executionApi.post<ProjectResponse>("/api/projects", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getMyProjects(): Promise<ProjectResponse[]> {
    const res = await executionApi.get<ProjectResponse[]>("/api/projects/my", { cache: false });
    return res.data;
  },

  async getAllProjects(): Promise<ProjectResponse[]> {
    const res = await executionApi.get<ProjectResponse[]>("/api/projects/all", { cache: false });
    return res.data;
  },

  async getOpenProjects(): Promise<ProjectResponse[]> {
    const res = await executionApi.get<ProjectResponse[]>("/api/projects/open");
    return res.data;
  },

  async getAssignedProjects(): Promise<ProjectResponse[]> {
    const res = await executionApi.get<ProjectResponse[]>("/api/projects/assigned", { cache: false });
    return res.data;
  },

  async getProject(id: string): Promise<ProjectResponse> {
    const res = await executionApi.get<ProjectResponse>(`/api/projects/${id}`);
    return res.data;
  },

  async markCompleted(id: string): Promise<ProjectResponse> {
    const res = await executionApi.patch<ProjectResponse>(`/api/projects/${id}/complete`);
    return res.data;
  },

  async markFailed(id: string): Promise<ProjectResponse> {
    const res = await executionApi.patch<ProjectResponse>(`/api/projects/${id}/fail`);
    return res.data;
  },

  async getCandidates(id: string): Promise<RankedWorkerResponse[]> {
    const res = await executionApi.get<RankedWorkerResponse[]>(`/api/projects/${id}/candidates`);
    return res.data;
  },

  async assignWorker(projectId: string, workerId: string): Promise<ProjectResponse> {
    const res = await executionApi.post<ProjectResponse>(
      `/api/projects/${projectId}/assign/${workerId}`
    );
    return res.data;
  },

  async repostProject(id: string): Promise<ProjectResponse> {
    const res = await executionApi.post<ProjectResponse>(`/api/projects/${id}/repost`);
    return res.data;
  },
};
