package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class FailedProjectSummary {
    private String claimId;
    private String projectId;
    private String projectTitle;
    private BigDecimal projectBudget;
    private String claimStatus;
    private LocalDateTime claimCreatedAt;
}
