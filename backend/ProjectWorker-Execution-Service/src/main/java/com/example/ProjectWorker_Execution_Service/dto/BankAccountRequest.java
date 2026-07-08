package com.example.ProjectWorker_Execution_Service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class BankAccountRequest {

    @NotBlank
    private String bankName;

    @NotBlank
    private String accountNumber;

    @NotBlank
    private String accountHolderName;
}
