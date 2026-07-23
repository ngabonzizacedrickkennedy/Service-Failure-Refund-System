package com.example.Notification_Reporting_Service.controller;

import com.example.Notification_Reporting_Service.model.Notification;
import com.example.Notification_Reporting_Service.repository.NotificationRepository;
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

@Slf4j
@RestController
@RequestMapping("/api/internal/events")
@RequiredArgsConstructor
public class NotificationEventController {

    private final NotificationRepository notificationRepository;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${internal.api-key}")
    private String internalApiKey;

    private boolean bad(String key) {
        return internalApiKey == null || !internalApiKey.equals(key);
    }

    @Transactional
    @PostMapping("/worker-assigned")
    public ResponseEntity<Void> workerAssigned(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        log.info("[Notification] worker-assigned: {}", body);

        try {
            String projectId    = body.get("projectId");
            String workerId     = body.get("workerId");
            String providerId   = body.get("providerId");
            String projectTitle = body.getOrDefault("projectTitle", "a project");

            if (projectId == null || workerId == null || providerId == null) {
                log.warn("[Notification] Incomplete worker-assigned payload, skipping: {}", body);
                return ResponseEntity.ok().build();
            }

            String workerData = MAPPER.writeValueAsString(Map.of(
                    "projectId", projectId,
                    "projectTitle", projectTitle
            ));
            notificationRepository.save(Notification.builder()
                    .recipientId(workerId)
                    .type("WORKER_ASSIGNED")
                    .title("Project Assignment")
                    .message("You have been assigned to the project \"" + projectTitle + "\". Click to view project details.")
                    .data(workerData)
                    .build());

            String providerData = MAPPER.writeValueAsString(Map.of(
                    "projectId", projectId,
                    "projectTitle", projectTitle,
                    "workerId", workerId
            ));
            notificationRepository.save(Notification.builder()
                    .recipientId(providerId)
                    .type("PROVIDER_WORKER_ASSIGNED")
                    .title("Worker Assigned to Your Project")
                    .message("A worker has been assigned to your project \"" + projectTitle + "\". Click to view worker details.")
                    .data(providerData)
                    .build());

            log.info("[Notification] Saved assignment notifications for worker={} provider={}", workerId, providerId);
        } catch (Exception e) {
            log.error("[Notification] Failed to process worker-assigned: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/worker-cv-approval")
    public ResponseEntity<Void> workerCvApproval(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        log.info("[Notification] worker-cv-approval: {}", body);
        try {
            String workerId = body.get("workerId");
            String status   = body.get("status");

            if (workerId == null || status == null) {
                log.warn("[Notification] Malformed worker-cv-approval payload: {}", body);
                return ResponseEntity.ok().build();
            }

            String type;
            String title;
            String message;

            if ("APPROVED".equalsIgnoreCase(status)) {
                type    = "WORKER_APPROVED";
                title   = "CV Application Approved";
                message = "Congratulations! Your CV has been approved by the admin. You are now eligible to be assigned to projects.";
            } else if ("REJECTED".equalsIgnoreCase(status)) {
                type    = "WORKER_REJECTED";
                title   = "CV Application Rejected";
                message = "Your CV application has been reviewed and was not approved at this time. Please update your profile and resubmit.";
            } else {
                type    = "WORKER_CV_STATUS";
                title   = "CV Application Update";
                message = "Your CV application status has been updated to: " + status + ".";
            }

            notificationRepository.save(Notification.builder()
                    .recipientId(workerId)
                    .type(type)
                    .title(title)
                    .message(message)
                    .data("{}")
                    .build());

            log.info("[Notification] Saved CV approval notification for worker={} status={}", workerId, status);
        } catch (Exception e) {
            log.error("[Notification] Failed to process worker-cv-approval: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/project-failed")
    public ResponseEntity<Void> projectFailed(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        log.info("[Notification] project-failed: {}", body);

        try {
            String projectId  = body.get("projectId");
            String providerId = body.get("providerId");
            String workerId   = body.get("workerId");

            if (projectId == null) {
                log.warn("[Notification] Missing projectId in project-failed payload");
                return ResponseEntity.ok().build();
            }

            String adminData = MAPPER.writeValueAsString(Map.of(
                    "projectId", projectId,
                    "providerId", providerId != null ? providerId : "",
                    "workerId",   workerId   != null ? workerId   : ""
            ));

            notificationRepository.save(Notification.builder()
                    .recipientId("ADMIN")
                    .type("PROJECT_MARKED_FAILED")
                    .title("Project Marked as Failed")
                    .message("A project has been marked as failed. Provider ID: " + providerId
                            + " | Worker ID: " + workerId + " | Project ID: " + projectId + ".")
                    .data(adminData)
                    .build());

            log.info("[Notification] Saved admin notification for failed project={}", projectId);
        } catch (Exception e) {
            log.error("[Notification] Failed to process project-failed: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/claim-decision")
    public ResponseEntity<Void> claimDecision(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        log.info("[Notification] claim-decision: {}", body);

        try {
            String claimId    = body.get("claimId");
            String workerId   = body.get("workerId");
            String providerId = body.get("providerId");
            String decision   = body.get("decision");

            if (workerId == null || claimId == null || decision == null) {
                log.warn("[Notification] Incomplete claim-decision payload, skipping: {}", body);
                return ResponseEntity.ok().build();
            }

            boolean approved = "APPROVED".equalsIgnoreCase(decision);
            String notifData = MAPPER.writeValueAsString(Map.of("claimId", claimId));

            // Notify the worker
            notificationRepository.save(Notification.builder()
                    .recipientId(workerId)
                    .type(approved ? "CLAIM_APPROVED_AGAINST_WORKER" : "CLAIM_REJECTED_AGAINST_WORKER")
                    .title(approved ? "Claim Approved Against You" : "Claim Against You Was Rejected")
                    .message(approved
                            ? "A claim filed against you has been approved by an evaluator. Please check your claims section for details."
                            : "A claim filed against you has been reviewed and the evaluator decided to reject it.")
                    .data(notifData)
                    .build());

            // Notify the provider who filed the claim
            if (providerId != null) {
                notificationRepository.save(Notification.builder()
                        .recipientId(providerId)
                        .type(approved ? "CLAIM_APPROVED_FOR_PROVIDER" : "CLAIM_REJECTED_FOR_PROVIDER")
                        .title(approved ? "Your Claim Was Approved" : "Your Claim Was Rejected")
                        .message(approved
                                ? "Your claim has been reviewed and approved by an evaluator. Please check your claims section for details."
                                : "Your claim has been reviewed and rejected by an evaluator. Please check your claims section for details.")
                        .data(notifData)
                        .build());
            }

            log.info("[Notification] Saved claim-decision notifications for worker={} provider={} decision={}", workerId, providerId, decision);
        } catch (Exception e) {
            log.error("[Notification] Failed to process claim-decision: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/refund-initiated")
    public ResponseEntity<Void> refundInitiated(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        log.info("[Notification] refund-initiated: {}", body);

        try {
            String claimId = body.get("claimId");

            String notifData = MAPPER.writeValueAsString(Map.of("claimId", claimId != null ? claimId : ""));

            // Broadcast to all REFUND_OFFICE users
            notificationRepository.save(Notification.builder()
                    .recipientId("REFUND_OFFICE")
                    .type("REFUND_PROCESS_REQUESTED")
                    .title("New Refund Request")
                    .message("An approved claim has been submitted for refund processing. Please review and process the refund.")
                    .data(notifData)
                    .build());

            log.info("[Notification] Saved refund-initiated broadcast for REFUND_OFFICE, claimId={}", claimId);
        } catch (Exception e) {
            log.error("[Notification] Failed to process refund-initiated: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/admin-provider-message")
    public ResponseEntity<Void> adminProviderMessage(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        log.info("[Notification] admin-provider-message: {}", body);

        try {
            String providerId = body.get("providerId");
            String subject    = body.get("subject");
            String message    = body.get("message");

            if (providerId == null || message == null) {
                log.warn("[Notification] Incomplete admin-provider-message payload, skipping: {}", body);
                return ResponseEntity.ok().build();
            }

            String notifData = MAPPER.writeValueAsString(Map.of("subject", subject != null ? subject : ""));

            notificationRepository.save(Notification.builder()
                    .recipientId(providerId)
                    .type("ADMIN_MESSAGE")
                    .title("Message from Admin: " + (subject != null ? subject : ""))
                    .message(message)
                    .data(notifData)
                    .build());

            log.info("[Notification] Saved ADMIN_MESSAGE notification for provider={}", providerId);
        } catch (Exception e) {
            log.error("[Notification] Failed to process admin-provider-message: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    @PostMapping("/refund-completed")
    public ResponseEntity<Void> refundCompleted(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();
        log.info("[Notification] refund-completed: {}", body);

        try {
            String claimId   = body.get("claimId");
            String providerId = body.get("providerId");
            String amount    = body.get("amount");

            if (providerId == null || claimId == null) {
                return ResponseEntity.ok().build();
            }

            String notifData = MAPPER.writeValueAsString(Map.of(
                    "claimId", claimId,
                    "amount", amount != null ? amount : ""
            ));

            notificationRepository.save(Notification.builder()
                    .recipientId(providerId)
                    .type("REFUND_COMPLETED")
                    .title("Refund Processed Successfully")
                    .message("Your refund of " + (amount != null ? amount : "the project budget") +
                             " has been processed and credited back to your account.")
                    .data(notifData)
                    .build());

            log.info("[Notification] Saved refund-completed notification for provider={}", providerId);
        } catch (Exception e) {
            log.error("[Notification] Failed to process refund-completed: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }
}
