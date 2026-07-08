package com.example.User_Management_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@Builder
@Jacksonized
public class UserResponse {

    private String id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private boolean active;
    private boolean locked;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}