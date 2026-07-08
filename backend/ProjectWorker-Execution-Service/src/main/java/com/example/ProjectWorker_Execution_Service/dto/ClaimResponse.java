package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ClaimResponse {
    private String id;
    private String projectId;
    private String providerId;
    private String workerId;
    private String description;
    private String status;
    private List<String> proofDocumentUrls;
    private String geotagPhotoUrl;
    private Double extractedLat;
    private Double extractedLon;
    private String extractedPhotoTimestamp;
    private List<String> ghostProjectImageUrls;
    private String messageEvidence;
    private String workerResponse;
    private String aiMediationReport;
    private BigDecimal projectBudget;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
