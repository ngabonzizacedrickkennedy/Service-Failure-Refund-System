package com.example.Audit.and.Compliance.Service.controller;

import com.example.Audit.and.Compliance.Service.client.UserLookupClient;
import com.example.Audit.and.Compliance.Service.model.AuditLog;
import com.example.Audit.and.Compliance.Service.service.AuditLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Internal event endpoints for the Audit-and-Compliance Service.
 * Replaces the former AuditKafkaConsumer — each former Kafka topic is now a
 * synchronous HTTP POST under /api/internal/events/<name>. Each endpoint writes
 * an AuditLog using the exact same builder logic the Kafka handlers used, now
 * reading its fields from a Map<String,String> body instead of Kafka records.
 */
@Slf4j
@RestController
@RequestMapping("/api/internal/events")
@RequiredArgsConstructor
public class AuditEventController {

    private final AuditLogService auditLogService;
    private final UserLookupClient userLookup;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${internal.api-key}")
    private String internalApiKey;

    private boolean bad(String key) {
        return internalApiKey == null || !internalApiKey.equals(key);
    }

    // ── User Management Service events ───────────────────────────────────

    @Transactional
    @PostMapping("/user-registered")
    public ResponseEntity<Void> userRegistered(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String userId = body.get("userId");
            String role   = body.get("role");
            String name   = userLookup.fetchName(userId);
            auditLogService.save(AuditLog.builder()
                    .actorId(userId != null ? userId : "SYSTEM")
                    .actorName(name)
                    .actorRole(role)
                    .action("USER_REGISTERED")
                    .service("User Management")
                    .resourceType("USER")
                    .resourceId(userId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "role", role != null ? role : "",
                            "name", name != null ? name : "")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed user-registered: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/user-deleted")
    public ResponseEntity<Void> userDeleted(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String userId = body.get("userId");
            String name   = userLookup.fetchName(userId);
            auditLogService.save(AuditLog.builder()
                    .actorId("ADMIN")
                    .actorName("Admin")
                    .actorRole("ADMIN")
                    .action("USER_DELETED")
                    .service("User Management")
                    .resourceType("USER")
                    .resourceId(userId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "deletedUserId", userId != null ? userId : "",
                            "deletedUserName", name != null ? name : "Unknown")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed user-deleted: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/user-status-changed")
    public ResponseEntity<Void> userStatusChanged(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String userId = body.get("userId");
            String status = body.get("status");
            String name   = userLookup.fetchName(userId);
            auditLogService.save(AuditLog.builder()
                    .actorId("ADMIN")
                    .actorName("Admin")
                    .actorRole("ADMIN")
                    .action("USER_STATUS_CHANGED")
                    .service("User Management")
                    .resourceType("USER")
                    .resourceId(userId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "affectedUser", name != null ? name : (userId != null ? userId : ""),
                            "newStatus", status != null ? status : "")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed user-status-changed: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/worker-profile-saved")
    public ResponseEntity<Void> workerProfileSaved(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String userId = body.get("userId");
            String name   = userLookup.fetchName(userId);
            auditLogService.save(AuditLog.builder()
                    .actorId(userId != null ? userId : "SYSTEM")
                    .actorName(name)
                    .actorRole("WORKER")
                    .action("WORKER_PROFILE_UPDATED")
                    .service("User Management")
                    .resourceType("USER")
                    .resourceId(userId)
                    .outcome("SUCCESS")
                    .details("{}")
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed worker-profile-saved: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/provider-profile-saved")
    public ResponseEntity<Void> providerProfileSaved(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String userId = body.get("userId");
            String name   = userLookup.fetchName(userId);
            auditLogService.save(AuditLog.builder()
                    .actorId(userId != null ? userId : "SYSTEM")
                    .actorName(name)
                    .actorRole("PROVIDER")
                    .action("PROVIDER_PROFILE_UPDATED")
                    .service("User Management")
                    .resourceType("USER")
                    .resourceId(userId)
                    .outcome("SUCCESS")
                    .details("{}")
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed project-provider-profile-saved: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/admin-provider-message")
    public ResponseEntity<Void> adminProviderMessage(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String providerId   = body.get("providerId");
            String subject      = body.get("subject");
            String providerName = userLookup.fetchName(providerId);
            auditLogService.save(AuditLog.builder()
                    .actorId("ADMIN")
                    .actorName("Admin")
                    .actorRole("ADMIN")
                    .action("ADMIN_MESSAGE_SENT")
                    .service("User Management")
                    .resourceType("USER")
                    .resourceId(providerId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "recipientName", providerName != null ? providerName : (providerId != null ? providerId : ""),
                            "subject", subject != null ? subject : "")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed admin-provider-message: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    // ── Execution Service events ─────────────────────────────────────────

    @Transactional
    @PostMapping("/project-posted")
    public ResponseEntity<Void> projectPosted(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String projectId  = body.get("projectId");
            String providerId = body.get("providerId");
            String providerName = userLookup.fetchName(providerId);
            auditLogService.save(AuditLog.builder()
                    .actorId(providerId != null ? providerId : "SYSTEM")
                    .actorName(providerName)
                    .actorRole("PROVIDER")
                    .action("PROJECT_POSTED")
                    .service("Execution")
                    .resourceType("PROJECT")
                    .resourceId(projectId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "projectId",    projectId    != null ? projectId    : "",
                            "providerName", providerName != null ? providerName : (providerId != null ? providerId : ""))))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed project-posted: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/worker-cv-submitted")
    public ResponseEntity<Void> workerCvSubmitted(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String workerId   = body.get("workerId");
            String workerName = userLookup.fetchName(workerId);
            auditLogService.save(AuditLog.builder()
                    .actorId(workerId != null ? workerId : "SYSTEM")
                    .actorName(workerName)
                    .actorRole("WORKER")
                    .action("WORKER_CV_SUBMITTED")
                    .service("Execution")
                    .resourceType("WORKER_CV")
                    .resourceId(workerId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of("workerName", workerName != null ? workerName : "")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed worker-cv-submitted: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/worker-assigned")
    public ResponseEntity<Void> workerAssigned(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String projectId    = body.get("projectId");
            String workerId     = body.get("workerId");
            String providerId   = body.get("providerId");
            String projectTitle = body.get("projectTitle");
            String workerName   = userLookup.fetchName(workerId);
            String providerName = userLookup.fetchName(providerId);
            auditLogService.save(AuditLog.builder()
                    .actorId("ADMIN")
                    .actorName("Admin")
                    .actorRole("ADMIN")
                    .action("WORKER_ASSIGNED_TO_PROJECT")
                    .service("Execution")
                    .resourceType("PROJECT")
                    .resourceId(projectId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "workerName",   workerName   != null ? workerName   : (workerId   != null ? workerId   : ""),
                            "providerName", providerName != null ? providerName : (providerId != null ? providerId : ""),
                            "projectTitle", projectTitle != null ? projectTitle : "")))
                    .build());
            log.info("[Audit] WORKER_ASSIGNED_TO_PROJECT project={} worker={}", projectId, workerId);
        } catch (Exception e) {
            log.error("[Audit] Failed worker-assigned-to-project: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/worker-cv-approval")
    public ResponseEntity<Void> workerCvApproval(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String workerId   = body.get("workerId");
            String status     = body.get("status");
            String workerName = userLookup.fetchName(workerId);
            auditLogService.save(AuditLog.builder()
                    .actorId("ADMIN")
                    .actorName("Admin")
                    .actorRole("ADMIN")
                    .action("CV_APPROVAL_DECISION")
                    .service("Execution")
                    .resourceType("WORKER_CV")
                    .resourceId(workerId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "workerName", workerName != null ? workerName : (workerId != null ? workerId : ""),
                            "decision",   status     != null ? status     : "")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed worker-cv-approval: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/project-failed")
    public ResponseEntity<Void> projectFailed(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String projectId    = body.get("projectId");
            String providerId   = body.get("providerId");
            String workerId     = body.get("workerId");
            String providerName = userLookup.fetchName(providerId);
            String workerName   = userLookup.fetchName(workerId);
            auditLogService.save(AuditLog.builder()
                    .actorId(providerId != null ? providerId : "SYSTEM")
                    .actorName(providerName)
                    .actorRole("PROVIDER")
                    .action("PROJECT_MARKED_FAILED")
                    .service("Execution")
                    .resourceType("PROJECT")
                    .resourceId(projectId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "providerName", providerName != null ? providerName : (providerId != null ? providerId : ""),
                            "workerName",   workerName   != null ? workerName   : (workerId   != null ? workerId   : ""))))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed project-marked-failed: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/project-completed")
    public ResponseEntity<Void> projectCompleted(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String projectId = body.get("projectId");
            auditLogService.save(AuditLog.builder()
                    .actorId("SYSTEM")
                    .actorName("System")
                    .actorRole("SYSTEM")
                    .action("PROJECT_MARKED_COMPLETED")
                    .service("Execution")
                    .resourceType("PROJECT")
                    .resourceId(projectId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of("projectId", projectId != null ? projectId : "")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed project-marked-completed: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/claim-filed")
    public ResponseEntity<Void> claimFiled(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String claimId    = body.get("claimId");
            String projectId  = body.get("projectId");
            String workerId   = body.get("workerId");
            String workerName = userLookup.fetchName(workerId);
            auditLogService.save(AuditLog.builder()
                    .actorId("SYSTEM")
                    .actorName("System")
                    .actorRole("PROVIDER")
                    .action("CLAIM_FILED")
                    .service("Execution")
                    .resourceType("CLAIM")
                    .resourceId(claimId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "claimId",    claimId    != null ? claimId    : "",
                            "projectId",  projectId  != null ? projectId  : "",
                            "workerName", workerName != null ? workerName : (workerId != null ? workerId : ""))))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed claim-filed: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/worker-claim-response")
    public ResponseEntity<Void> workerClaimResponse(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String claimId    = body.get("claimId");
            String workerId   = body.get("workerId");
            String workerName = userLookup.fetchName(workerId);
            auditLogService.save(AuditLog.builder()
                    .actorId(workerId != null ? workerId : "SYSTEM")
                    .actorName(workerName)
                    .actorRole("WORKER")
                    .action("WORKER_CLAIM_RESPONSE_SUBMITTED")
                    .service("Execution")
                    .resourceType("CLAIM")
                    .resourceId(claimId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "claimId",    claimId    != null ? claimId    : "",
                            "workerName", workerName != null ? workerName : (workerId != null ? workerId : ""))))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed worker-claim-response-submitted: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    // ── AI Engine events ─────────────────────────────────────────────────

    @Transactional
    @PostMapping("/geolocation-verified")
    public ResponseEntity<Void> geolocationVerified(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        handleGeolocationEvent(body.get("claimId"), "GEOLOCATION_VERIFIED");
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/geolocation-flagged")
    public ResponseEntity<Void> geolocationFlagged(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        handleGeolocationEvent(body.get("claimId"), "GEOLOCATION_FLAGGED");
        return ResponseEntity.ok().build();
    }

    private void handleGeolocationEvent(String claimId, String action) {
        try {
            auditLogService.save(AuditLog.builder()
                    .actorId("SYSTEM")
                    .actorName("AI Engine")
                    .actorRole("SYSTEM")
                    .action(action)
                    .service("AI Engine")
                    .resourceType("GEOLOCATION")
                    .resourceId(claimId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "claimId", claimId != null ? claimId : "",
                            "note", "Full geolocation data available via AI Engine for this claim.")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed {}: {}", action, e.getMessage());
        }
    }

    // ── Evaluation Service events ────────────────────────────────────────

    @Transactional
    @PostMapping("/claim-decision")
    public ResponseEntity<Void> claimDecision(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String claimId      = body.get("claimId");
            String workerId     = body.get("workerId");
            String providerId   = body.get("providerId");
            String decision     = body.get("decision");
            boolean approved    = "APPROVED".equalsIgnoreCase(decision);
            String workerName   = userLookup.fetchName(workerId);
            String providerName = userLookup.fetchName(providerId);
            auditLogService.save(AuditLog.builder()
                    .actorId("SYSTEM")
                    .actorName("Evaluator")
                    .actorRole("EVALUATOR")
                    .action(approved ? "EVALUATOR_DECISION_APPROVED" : "EVALUATOR_DECISION_REJECTED")
                    .service("Evaluation")
                    .resourceType("CLAIM")
                    .resourceId(claimId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "claimId",      claimId      != null ? claimId      : "",
                            "workerName",   workerName   != null ? workerName   : (workerId   != null ? workerId   : ""),
                            "providerName", providerName != null ? providerName : (providerId != null ? providerId : ""),
                            "decision",     decision     != null ? decision     : "")))
                    .build());
            log.info("[Audit] EVALUATOR_DECISION claim={} decision={}", claimId, decision);
        } catch (Exception e) {
            log.error("[Audit] Failed claim-decision: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    // ── Refund Service events ────────────────────────────────────────────

    @Transactional
    @PostMapping("/refund-initiated")
    public ResponseEntity<Void> refundInitiated(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String claimId      = body.get("claimId");
            String providerId   = body.get("providerId");
            String workerId     = body.get("workerId");
            String projectId    = body.get("projectId");
            String providerName = userLookup.fetchName(providerId);
            String workerName   = userLookup.fetchName(workerId);
            auditLogService.save(AuditLog.builder()
                    .actorId("SYSTEM")
                    .actorName("Refund System")
                    .actorRole("SYSTEM")
                    .action("REFUND_INITIATED")
                    .service("Refund")
                    .resourceType("CLAIM")
                    .resourceId(claimId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "providerName", providerName != null ? providerName : (providerId != null ? providerId : ""),
                            "workerName",   workerName   != null ? workerName   : (workerId   != null ? workerId   : ""),
                            "projectId",    projectId    != null ? projectId    : "")))
                    .build());
        } catch (Exception e) {
            log.error("[Audit] Failed refund-initiated: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/refund-completed")
    public ResponseEntity<Void> refundCompleted(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        try {
            String claimId      = body.get("claimId");
            String providerId   = body.get("providerId");
            String amount       = body.get("amount");
            String providerName = userLookup.fetchName(providerId);
            auditLogService.save(AuditLog.builder()
                    .actorId(providerId != null ? providerId : "SYSTEM")
                    .actorName(providerName)
                    .actorRole("REFUND_OFFICE")
                    .action("REFUND_COMPLETED")
                    .service("Refund")
                    .resourceType("CLAIM")
                    .resourceId(claimId)
                    .outcome("SUCCESS")
                    .details(toJson(Map.of(
                            "providerName", providerName != null ? providerName : (providerId != null ? providerId : ""),
                            "amount",       amount       != null ? amount       : "")))
                    .build());
            log.info("[Audit] REFUND_COMPLETED claimId={} amount={}", claimId, amount);
        } catch (Exception e) {
            log.error("[Audit] Failed refund-completed: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private String toJson(Map<String, String> map) {
        try {
            return MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }
}
