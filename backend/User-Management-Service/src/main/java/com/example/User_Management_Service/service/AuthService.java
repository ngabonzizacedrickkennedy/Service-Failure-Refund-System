package com.example.User_Management_Service.service;

import com.example.User_Management_Service.dto.ForgotPasswordRequest;
import com.example.User_Management_Service.dto.LoginRequest;
import com.example.User_Management_Service.dto.LoginResponse;
import com.example.User_Management_Service.dto.OtpVerifyRequest;
import com.example.User_Management_Service.dto.RegisterRequest;
import com.example.User_Management_Service.dto.ResetPasswordRequest;
import com.example.User_Management_Service.dto.UserResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    LoginResponse verifyOtp(OtpVerifyRequest request);

    UserResponse register(RegisterRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}
