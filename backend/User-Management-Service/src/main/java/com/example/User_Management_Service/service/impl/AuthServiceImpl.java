package com.example.User_Management_Service.service.impl;

import com.example.User_Management_Service.dto.ForgotPasswordRequest;
import com.example.User_Management_Service.dto.LoginRequest;
import com.example.User_Management_Service.dto.LoginResponse;
import com.example.User_Management_Service.dto.OtpVerifyRequest;
import com.example.User_Management_Service.dto.RegisterRequest;
import com.example.User_Management_Service.dto.ResetPasswordRequest;
import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.exception.AccountLockedException;
import com.example.User_Management_Service.exception.DuplicateEmailException;
import com.example.User_Management_Service.exception.UserNotFoundException;
import com.example.User_Management_Service.kafka.UserEventPublisher;
import com.example.User_Management_Service.model.Role;
import com.example.User_Management_Service.model.TrustedDevice;
import com.example.User_Management_Service.model.User;
import com.example.User_Management_Service.repository.TrustedDeviceRepository;
import com.example.User_Management_Service.repository.UserRepository;
import com.example.User_Management_Service.security.JwtTokenProvider;
import com.example.User_Management_Service.service.AuthService;
import com.example.User_Management_Service.service.EmailService;
import com.example.User_Management_Service.service.S3UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Hashtable;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserEventPublisher userEventPublisher;
    private final S3UploadService s3UploadService;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int RESET_TOKEN_EXPIRY_MINUTES = 30;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found with this email."));

        if (user.isLocked()) {
            throw new AccountLockedException("Your account is locked due to multiple failed login attempts.");
        }

        if (!user.isActive()) {
            throw new AccountLockedException("Your account is disabled. Please contact the administrator.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLocked(true);
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password.");
        }

        user.setFailedLoginAttempts(0);

        String deviceToken = request.getDeviceToken();
        if (deviceToken != null && !deviceToken.isBlank()
                && trustedDeviceRepository.existsByUserIdAndDeviceToken(user.getId(), deviceToken)) {
            userRepository.save(user);
            return buildFullResponse(user, deviceToken);
        }

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);

        return LoginResponse.builder()
                .requiresOtp(true)
                .email(user.getEmail())
                .build();
    }

    @Override
    @Transactional
    public LoginResponse verifyOtp(OtpVerifyRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found with this email."));

        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new IllegalArgumentException("No pending verification for this account.");
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            userRepository.save(user);
            throw new IllegalArgumentException("Verification code has expired. Please log in again.");
        }

        if (!user.getOtpCode().equals(request.getOtp())) {
            throw new IllegalArgumentException("Invalid verification code.");
        }

        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String deviceToken = (request.getDeviceToken() != null && !request.getDeviceToken().isBlank())
                ? request.getDeviceToken()
                : UUID.randomUUID().toString();

        if (!trustedDeviceRepository.existsByUserIdAndDeviceToken(user.getId(), deviceToken)) {
            trustedDeviceRepository.save(TrustedDevice.builder()
                    .userId(user.getId())
                    .deviceToken(deviceToken)
                    .build());
        }

        return buildFullResponse(user, deviceToken);
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (!isEmailDomainValid(request.getEmail())) {
            throw new IllegalArgumentException("The email address does not appear to exist. Please use a valid email.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("An account with this email already exists.");
        }

        if (request.getRole() == Role.EVALUATOR || request.getRole() == Role.REFUND_OFFICE || request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("This role cannot be self-registered.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .build();

        userRepository.save(user);
        userEventPublisher.publishUserRegistered(user.getId(), user.getRole().name());

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found with this email."));

        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES));
        userRepository.save(user);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findAll().stream()
                .filter(u -> request.getToken().equals(u.getPasswordResetToken()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset link."));

        if (user.getPasswordResetExpiry() == null || LocalDateTime.now().isAfter(user.getPasswordResetExpiry())) {
            user.setPasswordResetToken(null);
            user.setPasswordResetExpiry(null);
            userRepository.save(user);
            throw new IllegalArgumentException("Password reset link has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        userRepository.save(user);
    }

    private LoginResponse buildFullResponse(User user, String deviceToken) {
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        String signedImageUrl = user.getProfileImageUrl() != null
                ? s3UploadService.generatePresignedUrl(user.getProfileImageUrl())
                : null;

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .profileImageUrl(signedImageUrl)
                .deviceToken(deviceToken)
                .requiresOtp(false)
                .build();
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    private boolean isEmailDomainValid(String email) {
        try {
            String domain = email.substring(email.indexOf('@') + 1);
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            DirContext ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(domain, new String[]{"MX"});
            return attrs.get("MX") != null;
        } catch (Exception e) {
            return false;
        }
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
