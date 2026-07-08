package com.example.User_Management_Service.dto;

import com.example.User_Management_Service.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAdminUserRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Temporary password is required")
    private String temporaryPassword;

    private String phone;

    @NotNull(message = "Role is required")
    private Role role;
}