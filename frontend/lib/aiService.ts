import axios from "axios";

const aiApi = axios.create({ baseURL: "http://localhost:8083" });

export interface ImageVerificationResult {
  claim_id: string;
  location_status: "VERIFIED" | "MISMATCH" | "UNCERTAIN";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  what_is_visible: string;
  location_indicators: string;
  analysis: string;
  reasoning: string;
}

export interface ApologyValidationResult {
  claim_id: string;
  has_apology: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
  apology_excerpt: string | null;
}

export const aiService = {
  async verifyImageLocation(
    claimId: string,
    imageUrls: string[],
    constructionLocation: string
  ): Promise<ImageVerificationResult> {
    const res = await aiApi.post<ImageVerificationResult>("/api/ai/geolocation/verify-image", {
      claim_id: claimId,
      image_urls: imageUrls,
      construction_location: constructionLocation,
    });
    return res.data;
  },

  async validateApology(
    claimId: string,
    messageEvidence: string | null
  ): Promise<ApologyValidationResult> {
    const res = await aiApi.post<ApologyValidationResult>("/api/ai/claim/validate-apology", {
      claim_id: claimId,
      message_evidence: messageEvidence,
    });
    return res.data;
  },
};
