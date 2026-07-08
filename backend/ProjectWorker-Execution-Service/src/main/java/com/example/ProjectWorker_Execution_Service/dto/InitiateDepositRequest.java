package com.example.ProjectWorker_Execution_Service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class InitiateDepositRequest {

    @NotBlank
    private String projectId;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotBlank
    @Pattern(regexp = "^\\d{9,15}$", message = "Enter a valid MoMo phone number (digits only).")
    private String payerMsisdn;
}
