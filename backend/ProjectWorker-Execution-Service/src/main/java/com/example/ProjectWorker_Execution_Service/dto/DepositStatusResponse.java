package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DepositStatusResponse {
    private String referenceId;
    private String status;
    private String failureReason;
    private AccountResponse account;
}
