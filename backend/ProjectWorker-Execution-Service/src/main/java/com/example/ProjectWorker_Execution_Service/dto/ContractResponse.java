package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;

@Getter
@Builder
@Jacksonized
public class ContractResponse {
    private String id;
    private String projectId;
    private String projectTitle;

    private String workerId;
    private String workerName;
    private String workerEmail;
    private String workerPhone;

    private String providerId;
    private String providerName;
    private String providerEmail;
    private String providerPhone;

    private boolean workerSigned;
    private LocalDateTime workerSignedAt;
    private boolean providerSigned;
    private LocalDateTime providerSignedAt;
    private boolean adminValidated;
    private LocalDateTime validatedAt;
    private LocalDateTime createdAt;
}
