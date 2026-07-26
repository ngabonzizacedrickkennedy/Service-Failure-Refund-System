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
 *
 * Every message goes out as multipart: a branded HTML body (see {@link EmailTemplates})
 * plus a plain-text alternative for clients that block HTML.
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
        String html = EmailTemplates.page(
                "Your SSFRS verification code is " + otp + " — expires in 10 minutes.",
                "Security",
                "Your verification code",
                EmailTemplates.paragraph("Use the code below to finish signing in to your SSFRS account.")
                        + EmailTemplates.codeBlock(otp)
                        + EmailTemplates.callout("warning",
                                "This code expires in <strong>10 minutes</strong> and can only be used once. "
                                        + "Never share it with anyone &mdash; SSFRS staff will never ask you for it.")
                        + EmailTemplates.note("If you did not try to sign in, you can safely ignore this email.")
        );

        String text = """
                Hello,

                Your one-time verification code is:

                  %s

                This code expires in 10 minutes. Do not share it with anyone.

                If you did not attempt to log in, please ignore this email.

                - SSFRS Team""".formatted(otp);

        send(toEmail, "SSFRS - Your verification code", text, html);
    }

    public void sendAccountCreatedEmail(String toEmail, String fullName, String temporaryPassword, String loginUrl) {
        String html = EmailTemplates.page(
                "An SSFRS account has been created for you. Here are your sign-in details.",
                "Welcome aboard",
                "Your account is ready",
                EmailTemplates.paragraph("Hello <strong>" + EmailTemplates.escape(fullName) + "</strong>,")
                        + EmailTemplates.paragraph(
                                "An administrator has created an SSFRS account for you. "
                                        + "Use the credentials below to sign in for the first time.")
                        + EmailTemplates.panelStart()
                        + EmailTemplates.row("Email address", toEmail, false)
                        + EmailTemplates.row("Temporary password", temporaryPassword, true)
                        + EmailTemplates.panelEnd()
                        + EmailTemplates.button("Sign in to SSFRS", loginUrl)
                        + EmailTemplates.fallbackLink(loginUrl)
                        + EmailTemplates.callout("danger",
                                "<strong>Change this password right after your first sign-in.</strong> "
                                        + "It is temporary, and anyone with access to this email can use it.")
        );

        String text = """
                Hello %s,

                An administrator has created an account for you on the SSFRS platform.

                Here are your login credentials:

                  Email:              %s
                  Temporary Password: %s

                Please log in using the link below and change your password immediately:

                  %s

                For security reasons, do not share these credentials with anyone.

                - SSFRS Team""".formatted(fullName, toEmail, temporaryPassword, loginUrl);

        send(toEmail, "SSFRS - Your account has been created", text, html);
    }

    public void sendAdminMessageEmail(String toEmail, String providerName, String subject, String messageText) {
        String html = EmailTemplates.page(
                "New message from the SSFRS administrator: " + subject,
                "Administrator message",
                subject,
                EmailTemplates.paragraph("Hello <strong>" + EmailTemplates.escape(providerName) + "</strong>,")
                        + EmailTemplates.paragraph("You have received a message from the SSFRS administrator.")
                        + EmailTemplates.callout("info", EmailTemplates.multiline(messageText))
                        + EmailTemplates.note("Log in to the SSFRS platform to view this and your other notifications.")
        );

        String text = """
                Hello %s,

                You have received a message from the SSFRS administrator:

                Subject: %s

                %s

                Please log in to the SSFRS platform to view your notifications.

                - SSFRS Team""".formatted(providerName, subject, messageText);

        send(toEmail, "SSFRS - Message from Admin: " + subject, text, html);
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String html = EmailTemplates.page(
                "Reset your SSFRS password — this link is valid for 30 minutes.",
                "Security",
                "Reset your password",
                EmailTemplates.paragraph(
                        "We received a request to reset the password for your SSFRS account. "
                                + "Click the button below to choose a new one.")
                        + EmailTemplates.button("Set a new password", resetLink)
                        + EmailTemplates.fallbackLink(resetLink)
                        + EmailTemplates.callout("warning", "This link expires in <strong>30 minutes</strong> and can only be used once.")
                        + EmailTemplates.note("If you did not request a password reset, no action is needed &mdash; your password stays unchanged.")
        );

        String text = """
                Hello,

                We received a request to reset your SSFRS password.

                Click the link below to set a new password (valid for 30 minutes):

                %s

                If you did not request a password reset, you can safely ignore this email.

                - SSFRS Team""".formatted(resetLink);

        send(toEmail, "SSFRS - Reset your password", text, html);
    }

    private void send(String toEmail, String subject, String text, String html) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.error("[Email] RESEND_API_KEY is not configured — cannot send '{}' to {}", subject, toEmail);
            throw new IllegalStateException("Email service is not configured. Please contact the administrator.");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("from", fromEmail);
        body.put("to", List.of(toEmail));
        body.put("subject", subject);
        body.put("text", text);
        body.put("html", html);

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
