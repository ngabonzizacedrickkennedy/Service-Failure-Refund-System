package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AccountResponse {
    private String id;
    private String userId;
    private String role;
    private String accountNumber;
    private BigDecimal balance;
    private BigDecimal pendingBalance;
    private LocalDateTime createdAt;
}
