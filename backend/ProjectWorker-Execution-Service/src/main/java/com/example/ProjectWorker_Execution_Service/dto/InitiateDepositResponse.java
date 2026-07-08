package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InitiateDepositResponse {
    private String transactionId;
    private String referenceId;
    private String status;
}
