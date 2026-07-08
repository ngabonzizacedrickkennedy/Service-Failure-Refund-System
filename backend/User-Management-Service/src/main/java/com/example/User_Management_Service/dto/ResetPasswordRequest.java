package com.example.User_Management_Service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {

    @NotBlank(message = "Reset token is required")
    private String token;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = ".*[A-Z].*", message = "Must contain an uppercase letter")
    @Pattern(regexp = ".*[a-z].*", message = "Must contain a lowercase letter")
    @Pattern(regexp = ".*[0-9].*", message = "Must contain a number")
    @Pattern(regexp = ".*[@$!%*?&].*", message = "Must contain a special character")
    private String newPassword;
}
