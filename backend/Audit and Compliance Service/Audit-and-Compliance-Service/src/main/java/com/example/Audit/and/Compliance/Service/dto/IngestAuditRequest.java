package com.example.Audit.and.Compliance.Service.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class IngestAuditRequest {
    private String actorId;
    private String actorName;
    private String actorRole;
    private String action;
    private String service;
    private String resourceType;
    private String resourceId;
    private String outcome;
    private String details;
}
