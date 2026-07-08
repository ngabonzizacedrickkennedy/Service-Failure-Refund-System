package com.example.User_Management_Service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminMessageRequest {

    @NotBlank
    private String providerId;

    @NotBlank
    private String subject;

    @NotBlank
    private String message;
}
