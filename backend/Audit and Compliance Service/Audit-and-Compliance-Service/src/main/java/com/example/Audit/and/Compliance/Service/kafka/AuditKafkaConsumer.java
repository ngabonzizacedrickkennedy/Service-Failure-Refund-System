package com.example.Audit.and.Compliance.Service.kafka;

import com.example.Audit.and.Compliance.Service.client.UserLookupClient;
import com.example.Audit.and.Compliance.Service.model.AuditLog;
import com.example.Audit.and.Compliance.Service.service.AuditLogService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditKafkaConsumer {

    private final AuditLogService auditLogService;
    private final UserLookupClient userLookup;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // ── User Management Service events ───────────────────────────────────

    @Transactional
    @KafkaListener(topics = "user-registered", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onUserRegistered(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String userId = str(data, "userId");
            String role   = str(data, "payload");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "user-deleted", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onUserDeleted(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String userId = str(data, "userId");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "user-status-changed", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onUserStatusChanged(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String userId = str(data, "userId");
            String status = str(data, "payload");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "worker-profile-saved", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onWorkerProfileSaved(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String userId = str(data, "userId");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "project-provider-profile-saved", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onProviderProfileSaved(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String userId = str(data, "userId");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "admin-provider-message", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onAdminProviderMessage(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String providerId   = str(data, "providerId");
            String subject      = str(data, "subject");
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
        } finally {
            ack.acknowledge();
        }
    }

    // ── Execution Service events ─────────────────────────────────────────

    @Transactional
    @KafkaListener(topics = "project-posted", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onProjectPosted(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String payload    = record.value();
            String projectId  = null;
            String providerId = null;
            if (payload != null && payload.contains(":")) {
                String[] parts = payload.split(":", 2);
                projectId  = parts[0];
                providerId = parts[1];
            }
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "worker-cv-submitted", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onWorkerCvSubmitted(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String workerId   = record.value();
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "worker-assigned-to-project", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onWorkerAssigned(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String projectId    = str(data, "projectId");
            String workerId     = str(data, "workerId");
            String providerId   = str(data, "providerId");
            String projectTitle = str(data, "projectTitle");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "worker-cv-approval", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onWorkerCvApproval(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String payload    = record.value();
            String workerId   = null;
            String status     = null;
            if (payload != null) {
                int sep = payload.lastIndexOf(':');
                if (sep >= 0) {
                    workerId = payload.substring(0, sep);
                    status   = payload.substring(sep + 1);
                }
            }
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "project-marked-failed", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onProjectFailed(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String projectId    = str(data, "projectId");
            String providerId   = str(data, "providerId");
            String workerId     = str(data, "workerId");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "project-marked-completed", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onProjectCompleted(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String projectId = record.value();
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "claim-filed", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onClaimFiled(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String payload    = record.value();
            String claimId    = null;
            String projectId  = null;
            String workerId   = null;
            if (payload != null) {
                String[] parts = payload.split(":", 3);
                if (parts.length == 3) {
                    claimId   = parts[0];
                    projectId = parts[1];
                    workerId  = parts[2];
                }
            }
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "worker-claim-response-submitted", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onWorkerClaimResponse(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            String payload    = record.value();
            String claimId    = null;
            String workerId   = null;
            if (payload != null && payload.contains(":")) {
                String[] parts = payload.split(":", 2);
                claimId  = parts[0];
                workerId = parts[1];
            }
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
        } finally {
            ack.acknowledge();
        }
    }

    // ── AI Engine events ─────────────────────────────────────────────────

    @Transactional
    @KafkaListener(topics = "geolocation-verified", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onGeolocationVerified(ConsumerRecord<String, String> record, Acknowledgment ack) {
        handleGeolocationEvent(record.value(), "GEOLOCATION_VERIFIED", ack);
    }

    @Transactional
    @KafkaListener(topics = "geolocation-flagged", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onGeolocationFlagged(ConsumerRecord<String, String> record, Acknowledgment ack) {
        handleGeolocationEvent(record.value(), "GEOLOCATION_FLAGGED", ack);
    }

    private void handleGeolocationEvent(String claimId, String action, Acknowledgment ack) {
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
        } finally {
            ack.acknowledge();
        }
    }

    // ── Evaluation Service events ────────────────────────────────────────

    @Transactional
    @KafkaListener(topics = "claim-decision", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onClaimDecision(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String claimId      = str(data, "claimId");
            String workerId     = str(data, "workerId");
            String providerId   = str(data, "providerId");
            String decision     = str(data, "decision");
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
        } finally {
            ack.acknowledge();
        }
    }

    // ── Refund Service events ────────────────────────────────────────────

    @Transactional
    @KafkaListener(topics = "refund-initiated", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onRefundInitiated(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String claimId      = str(data, "claimId");
            String providerId   = str(data, "providerId");
            String workerId     = str(data, "workerId");
            String projectId    = str(data, "projectId");
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
        } finally {
            ack.acknowledge();
        }
    }

    @Transactional
    @KafkaListener(topics = "refund-completed", groupId = "audit-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onRefundCompleted(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            Map<String, Object> data = parseJson(record.value());
            String claimId      = str(data, "claimId");
            String providerId   = str(data, "providerId");
            String amount       = str(data, "amount");
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
        } finally {
            ack.acknowledge();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private Map<String, Object> parseJson(String payload) throws Exception {
        if (payload == null || !payload.trim().startsWith("{")) {
            return Map.of();
        }
        return MAPPER.readValue(payload, new TypeReference<Map<String, Object>>() {});
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    private String toJson(Map<String, String> map) {
        try {
            return MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }
}
