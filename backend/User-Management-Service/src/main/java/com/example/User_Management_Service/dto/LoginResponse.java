package com.example.User_Management_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String userId;
    private String email;
    private String role;
    private String fullName;
    private String profileImageUrl;
    private String deviceToken;
    private boolean requiresOtp;
}