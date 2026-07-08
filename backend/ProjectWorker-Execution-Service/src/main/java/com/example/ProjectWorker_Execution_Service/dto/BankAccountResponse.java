package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BankAccountResponse {
    private String id;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private boolean defaultAccount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
