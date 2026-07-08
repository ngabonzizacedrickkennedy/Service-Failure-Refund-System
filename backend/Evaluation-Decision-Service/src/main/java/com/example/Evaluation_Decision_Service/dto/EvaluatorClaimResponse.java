package com.example.Evaluation_Decision_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class EvaluatorClaimResponse {
    private String id;
    private String projectId;
    private String providerId;
    private String workerId;
    private String description;
    private String status;
    private List<String> proofDocumentUrls;
    private List<String> ghostProjectImageUrls;
    private String messageEvidence;
    private String geotagPhotoUrl;
    private Double extractedLat;
    private Double extractedLon;
    private String extractedPhotoTimestamp;
    private String workerResponse;
    private String aiMediationReport;
    private String constructionLocation;
    private String projectTitle;
    private String projectStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
