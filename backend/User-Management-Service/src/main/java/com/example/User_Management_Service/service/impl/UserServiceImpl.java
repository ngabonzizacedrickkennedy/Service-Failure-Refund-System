package com.example.User_Management_Service.service.impl;

import com.example.User_Management_Service.dto.AdminMessageRequest;
import com.example.User_Management_Service.dto.ChangePasswordRequest;
import com.example.User_Management_Service.dto.CreateAdminUserRequest;
import com.example.User_Management_Service.dto.UpdateUserRequest;
import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.model.Role;
import com.example.User_Management_Service.exception.DuplicateEmailException;
import com.example.User_Management_Service.exception.UserNotFoundException;
import com.example.User_Management_Service.kafka.UserEventPublisher;
import com.example.User_Management_Service.model.User;
import com.example.User_Management_Service.repository.UserRepository;
import com.example.User_Management_Service.service.EmailService;
import com.example.User_Management_Service.service.S3UploadService;
import com.example.User_Management_Service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserEventPublisher userEventPublisher;
    private final S3UploadService s3UploadService;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Cacheable(value = "users", key = "#userId")
    public UserResponse getUserById(String userId) {
        User user = findUserById(userId);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", key = "#userId"),
            @CacheEvict(value = "users-all", allEntries = true)
    })
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        User user = findUserById(userId);
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = findUserById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Cacheable(value = "users-all", key = "'all'")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getProviders() {
        return userRepository.findAllByRole(Role.PROVIDER)
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getUsersByRole(String role) {
        return userRepository.findAllByRole(Role.valueOf(role))
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void sendStaffMessage(String recipientId, String subject, String message) {
        User recipient = findUserById(recipientId);
        try {
            emailService.sendAdminMessageEmail(recipient.getEmail(), recipient.getFullName(), subject, message);
        } catch (Exception e) {
            log.warn("[Email] Could not send staff message email to {}: {}", recipient.getEmail(), e.getMessage());
        }
        userEventPublisher.publishAdminProviderMessage(recipientId, subject, message);
    }

    @Override
    @Transactional
    public void sendMessageToProvider(AdminMessageRequest request) {
        User provider = findUserById(request.getProviderId());
        try {
            emailService.sendAdminMessageEmail(
                    provider.getEmail(),
                    provider.getFullName(),
                    request.getSubject(),
                    request.getMessage()
            );
        } catch (Exception e) {
            log.warn("[Email] Could not send admin message email to {}: {}", provider.getEmail(), e.getMessage());
        }
        userEventPublisher.publishAdminProviderMessage(
                request.getProviderId(),
                request.getSubject(),
                request.getMessage()
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "users-all", allEntries = true)
    public UserResponse createRestrictedUser(CreateAdminUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("An account with this email already exists.");
        }
        String phone = (request.getPhone() != null && !request.getPhone().isBlank())
                ? request.getPhone() : "";
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getTemporaryPassword()))
                .phone(phone)
                .role(request.getRole())
                .build();
        userRepository.save(user);
        userEventPublisher.publishUserRegistered(user.getId(), user.getRole().name());
        try {
            emailService.sendAccountCreatedEmail(
                user.getEmail(),
                user.getFullName(),
                request.getTemporaryPassword(),
                frontendUrl + "/login"
            );
        } catch (Exception e) {
            log.warn("[Email] Could not send account creation email to {}: {}", user.getEmail(), e.getMessage());
        }
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", key = "#userId"),
            @CacheEvict(value = "users-all", allEntries = true)
    })
    public UserResponse activateUser(String userId) {
        User user = findUserById(userId);
        user.setActive(true);
        user.setLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        userEventPublisher.publishUserStatusChanged(user.getId(), "ACTIVATED");
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", key = "#userId"),
            @CacheEvict(value = "users-all", allEntries = true)
    })
    public UserResponse deactivateUser(String userId) {
        User user = findUserById(userId);
        user.setActive(false);
        userRepository.save(user);
        userEventPublisher.publishUserStatusChanged(user.getId(), "DEACTIVATED");
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", key = "#userId"),
            @CacheEvict(value = "users-all", allEntries = true)
    })
    public void deleteUser(String userId) {
        User user = findUserById(userId);
        userRepository.delete(user);
        userEventPublisher.publishUserDeleted(user.getId());
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public UserResponse uploadProfileImage(String userId, MultipartFile file) {
        User user = findUserById(userId);
        s3UploadService.deleteProfileImage(user.getProfileImageUrl());
        String key = s3UploadService.uploadProfileImage(userId, file);
        user.setProfileImageUrl(key);
        userRepository.save(user);
        return mapToUserResponse(user);
    }

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
    }

    private UserResponse mapToUserResponse(User user) {
        String signedUrl = user.getProfileImageUrl() != null
                ? s3UploadService.generatePresignedUrl(user.getProfileImageUrl())
                : null;
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .active(user.isActive())
                .locked(user.isLocked())
                .profileImageUrl(signedUrl)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
