package com.example.Notification_Reporting_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {
    private String id;
    private String type;
    private String title;
    private String message;
    private String data;
    private boolean read;
    private LocalDateTime createdAt;
}
