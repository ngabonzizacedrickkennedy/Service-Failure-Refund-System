package com.example.User_Management_Service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("SSFRS - Your verification code");
        message.setText(
            "Hello,\n\n" +
            "Your one-time verification code is:\n\n" +
            "  " + otp + "\n\n" +
            "This code expires in 10 minutes. Do not share it with anyone.\n\n" +
            "If you did not attempt to log in, please ignore this email.\n\n" +
            "– SSFRS Team"
        );
        mailSender.send(message);
    }

    public void sendAccountCreatedEmail(String toEmail, String fullName, String temporaryPassword, String loginUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("SSFRS - Your account has been created");
        message.setText(
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
        mailSender.send(message);
    }

    public void sendAdminMessageEmail(String toEmail, String providerName, String subject, String messageText) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("SSFRS – Message from Admin: " + subject);
        message.setText(
            "Hello " + providerName + ",\n\n" +
            "You have received a message from the SSFRS administrator:\n\n" +
            "Subject: " + subject + "\n\n" +
            messageText + "\n\n" +
            "Please log in to the SSFRS platform to view your notifications.\n\n" +
            "– SSFRS Team"
        );
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("SSFRS - Reset your password");
        message.setText(
            "Hello,\n\n" +
            "We received a request to reset your SSFRS password.\n\n" +
            "Click the link below to set a new password (valid for 30 minutes):\n\n" +
            resetLink + "\n\n" +
            "If you did not request a password reset, you can safely ignore this email.\n\n" +
            "– SSFRS Team"
        );
        mailSender.send(message);
    }
}
