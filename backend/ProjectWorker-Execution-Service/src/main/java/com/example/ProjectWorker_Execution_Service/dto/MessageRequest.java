package com.example.ProjectWorker_Execution_Service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageRequest {
    @NotBlank
    private String recipientId;
    @NotBlank
    private String text;
}
