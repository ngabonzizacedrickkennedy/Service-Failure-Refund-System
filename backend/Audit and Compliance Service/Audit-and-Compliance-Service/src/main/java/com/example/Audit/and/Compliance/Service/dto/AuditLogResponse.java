package com.example.Audit.and.Compliance.Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AuditLogResponse {
    private String id;
    private String actorId;
    private String actorName;
    private String actorRole;
    private String action;
    private String service;
    private String resourceType;
    private String resourceId;
    private String outcome;
    private String details;
    private LocalDateTime timestamp;
}
