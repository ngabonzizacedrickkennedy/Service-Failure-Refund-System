package com.example.ProjectWorker_Execution_Service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkerClaimResponseRequest {

    @NotBlank(message = "Response is required")
    private String response;
}
