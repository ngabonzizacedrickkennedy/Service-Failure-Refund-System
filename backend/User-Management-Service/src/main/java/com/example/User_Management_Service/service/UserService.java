package com.example.User_Management_Service.service;

import com.example.User_Management_Service.dto.AdminMessageRequest;
import com.example.User_Management_Service.dto.ChangePasswordRequest;
import com.example.User_Management_Service.dto.CreateAdminUserRequest;
import com.example.User_Management_Service.dto.UpdateUserRequest;
import com.example.User_Management_Service.dto.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {

    UserResponse getUserById(String userId);

    UserResponse updateUser(String userId, UpdateUserRequest request);

    void changePassword(String userId, ChangePasswordRequest request);

    List<UserResponse> getAllUsers();

    List<UserResponse> getProviders();

    List<UserResponse> getUsersByRole(String role);

    void sendMessageToProvider(AdminMessageRequest request);

    void sendStaffMessage(String recipientId, String subject, String message);

    UserResponse createRestrictedUser(CreateAdminUserRequest request);

    UserResponse activateUser(String userId);

    UserResponse deactivateUser(String userId);

    void deleteUser(String userId);

    UserResponse uploadProfileImage(String userId, MultipartFile file);
}