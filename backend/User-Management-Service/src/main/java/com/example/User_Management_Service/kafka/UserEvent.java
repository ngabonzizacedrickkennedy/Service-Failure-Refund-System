package com.example.User_Management_Service.kafka;

import java.time.LocalDateTime;

public record UserEvent(
        String userId,
        EventType eventType,
        String payload,
        LocalDateTime occurredAt
) {}