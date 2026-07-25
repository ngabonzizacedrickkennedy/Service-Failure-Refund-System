package com.example.User_Management_Service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends transactional email through the Resend HTTP API (https://api.resend.com/emails)
 * over port 443, rather than SMTP. Render's free/starter tiers block outbound SMTP
 * ports (25/465/587), so SMTP sends hang and fail; the HTTPS API is not blocked.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String RESEND_ENDPOINT = "https://api.resend.com/emails";

    private final RestTemplate restTemplate;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    public void sendOtpEmail(String toEmail, String otp) {
        send(toEmail, "SSFRS - Your verification code",
            "Hello,\n\n" +
            "Your one-time verification code is:\n\n" +
            "  " + otp + "\n\n" +
            "This code expires in 10 minutes. Do not share it with anyone.\n\n" +
            "If you did not attempt to log in, please ignore this email.\n\n" +
            "– SSFRS Team"
        );
    }

    public void sendAccountCreatedEmail(String toEmail, String fullName, String temporaryPassword, String loginUrl) {
        send(toEmail, "SSFRS - Your account has been created",
            "Hello " + fullName + ",\n\n" +
            "An administrator has created an account for you on the SSFRS platform.\n\n" +
            "Here are your login credentials:\n\n" +
            "  Email:              " + toEmail + "\n" +
            "  Temporary Password: " + temporaryPassword + "\n\n" +
            "Please log in using the link below and change your password immediately:\n\n" +
            "  " + loginUrl + "\n\n" +
            "For security reasons, do not share these credentials with anyone.\n\n" +
            "– SSFRS Team"
        );
    }

    public void sendAdminMessageEmail(String toEmail, String providerName, String subject, String messageText) {
        send(toEmail, "SSFRS – Message from Admin: " + subject,
            "Hello " + providerName + ",\n\n" +
            "You have received a message from the SSFRS administrator:\n\n" +
            "Subject: " + subject + "\n\n" +
            messageText + "\n\n" +
            "Please log in to the SSFRS platform to view your notifications.\n\n" +
            "– SSFRS Team"
        );
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        send(toEmail, "SSFRS - Reset your password",
            "Hello,\n\n" +
            "We received a request to reset your SSFRS password.\n\n" +
            "Click the link below to set a new password (valid for 30 minutes):\n\n" +
            resetLink + "\n\n" +
            "If you did not request a password reset, you can safely ignore this email.\n\n" +
            "– SSFRS Team"
        );
    }

    private void send(String toEmail, String subject, String text) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.error("[Email] RESEND_API_KEY is not configured — cannot send '{}' to {}", subject, toEmail);
            throw new IllegalStateException("Email service is not configured. Please contact the administrator.");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("from", fromEmail);
        body.put("to", List.of(toEmail));
        body.put("subject", subject);
        body.put("text", text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        try {
            restTemplate.postForEntity(RESEND_ENDPOINT, new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            log.error("[Email] Failed to send '{}' to {} via Resend: {}", subject, toEmail, e.getMessage());
            throw new IllegalStateException("We could not send the email right now. Please try again shortly.");
        }
    }
}
