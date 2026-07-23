package com.example.ProjectWorker_Execution_Service.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Publishes execution-domain events to consuming services over internal HTTP
 * (Kafka removed). Public methods are @Async so the caller (the service layer,
 * a different bean) returns immediately — the async proxy only applies on
 * cross-bean calls, which is why @Async lives on the public methods and not on
 * post(). Every POST is fire-and-forget (errors swallowed) so a slow/down
 * consumer never breaks the business action.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionEventPublisher {

    private final RestTemplate restTemplate;

    @Value("${ai.service.base-url}")
    private String aiServiceUrl;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @Async
    public void publishProjectPosted(String projectId, String providerId) {
        Map<String, String> body = new HashMap<>();
        body.put("projectId", projectId);
        body.put("providerId", providerId);
        post(auditServiceUrl, "/api/internal/events/project-posted", body);
    }

    @Async
    public void publishWorkerCvSubmitted(String workerId) {
        Map<String, String> body = new HashMap<>();
        body.put("workerId", workerId);
        post(aiServiceUrl, "/api/internal/events/worker-cv-submitted", body);
        post(auditServiceUrl, "/api/internal/events/worker-cv-submitted", body);
    }

    @Async
    public void publishWorkerAssigned(String projectId, String workerId, String providerId, String projectTitle) {
        Map<String, String> body = new HashMap<>();
        body.put("projectId", projectId);
        body.put("workerId", workerId);
        body.put("providerId", providerId);
        body.put("projectTitle", projectTitle);
        post(notificationServiceUrl, "/api/internal/events/worker-assigned", body);
        post(auditServiceUrl, "/api/internal/events/worker-assigned", body);
    }

    @Async
    public void publishWorkerApproval(String workerId, String status) {
        Map<String, String> body = new HashMap<>();
        body.put("workerId", workerId);
        body.put("status", status);
        post(notificationServiceUrl, "/api/internal/events/worker-cv-approval", body);
        post(auditServiceUrl, "/api/internal/events/worker-cv-approval", body);
    }

    @Async
    public void publishProjectCompleted(String projectId) {
        Map<String, String> body = new HashMap<>();
        body.put("projectId", projectId);
        post(auditServiceUrl, "/api/internal/events/project-completed", body);
    }

    @Async
    public void publishProjectFailed(String projectId, String providerId, String workerId) {
        Map<String, String> body = new HashMap<>();
        body.put("projectId", projectId);
        body.put("providerId", providerId);
        body.put("workerId", workerId);
        post(notificationServiceUrl, "/api/internal/events/project-failed", body);
        post(auditServiceUrl, "/api/internal/events/project-failed", body);
    }

    @Async
    public void publishClaimFiled(String claimId, String projectId, String workerId) {
        Map<String, String> body = new HashMap<>();
        body.put("claimId", claimId);
        body.put("projectId", projectId);
        body.put("workerId", workerId);
        post(aiServiceUrl, "/api/internal/events/claim-filed", body);
        post(auditServiceUrl, "/api/internal/events/claim-filed", body);
    }

    @Async
    public void publishWorkerClaimResponse(String claimId, String workerId) {
        Map<String, String> body = new HashMap<>();
        body.put("claimId", claimId);
        body.put("workerId", workerId);
        post(aiServiceUrl, "/api/internal/events/worker-claim-response", body);
        post(auditServiceUrl, "/api/internal/events/worker-claim-response", body);
    }

    private void post(String baseUrl, String path, Map<String, String> body) {
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("X-Internal-Key", internalApiKey);
            restTemplate.postForEntity(baseUrl + path, new HttpEntity<>(body, h), Void.class);
        } catch (Exception e) {
            log.warn("[Event] POST {} failed: {}", path, e.getMessage()); // swallow — fire-and-forget
        }
    }
}
