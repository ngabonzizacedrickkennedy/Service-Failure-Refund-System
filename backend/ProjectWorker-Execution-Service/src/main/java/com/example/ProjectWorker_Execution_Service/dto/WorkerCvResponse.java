package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WorkerCvResponse {
    private String id;
    private String workerId;
    private String workerName;
    private String workerEmail;
    private String cvFileUrl;
    private int yearsOfExperience;
    private String specialization;
    private String additionalCredentials;
    private double ratingScore;
    private String ratingReasoning;
    private String approvalStatus;
    private int completedProjects;
    private int pastFailures;
    private boolean banned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
