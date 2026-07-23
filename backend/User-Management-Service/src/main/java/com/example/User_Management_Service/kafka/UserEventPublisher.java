package com.example.User_Management_Service.kafka;

import tools.jackson.databind.ObjectMapper;
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
 * Publishes user-domain events to consuming services over internal HTTP
 * (Kafka removed). Public methods are @Async so the caller (a different bean —
 * the service layer) returns immediately; the proxy honours @Async only on
 * cross-bean calls, which is why the annotation lives here and not on post().
 * Every call is fire-and-forget (errors swallowed) so a slow/down consumer
 * never breaks the business action.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventPublisher {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @Async
    public void publishUserRegistered(String userId, String role) {
        Map<String, String> body = new HashMap<>();
        body.put("userId", userId);
        body.put("role", role);
        post(auditServiceUrl, "/api/internal/events/user-registered", body);
    }

    @Async
    public void publishUserDeleted(String userId) {
        Map<String, String> body = new HashMap<>();
        body.put("userId", userId);
        post(auditServiceUrl, "/api/internal/events/user-deleted", body);
    }

    @Async
    public void publishUserStatusChanged(String userId, String status) {
        Map<String, String> body = new HashMap<>();
        body.put("userId", userId);
        body.put("status", status);
        post(auditServiceUrl, "/api/internal/events/user-status-changed", body);
    }

    @Async
    public void publishWorkerProfileSaved(String userId) {
        Map<String, String> body = new HashMap<>();
        body.put("userId", userId);
        post(auditServiceUrl, "/api/internal/events/worker-profile-saved", body);
    }

    @Async
    public void publishProjectProviderProfileSaved(String userId) {
        Map<String, String> body = new HashMap<>();
        body.put("userId", userId);
        post(auditServiceUrl, "/api/internal/events/provider-profile-saved", body);
    }

    @Async
    public void publishAdminProviderMessage(String providerId, String subject, String message) {
        Map<String, String> notificationBody = new HashMap<>();
        notificationBody.put("providerId", providerId);
        notificationBody.put("subject", subject);
        notificationBody.put("message", message);
        post(notificationServiceUrl, "/api/internal/events/admin-provider-message", notificationBody);

        Map<String, String> auditBody = new HashMap<>();
        auditBody.put("providerId", providerId);
        auditBody.put("subject", subject);
        post(auditServiceUrl, "/api/internal/events/admin-provider-message", auditBody);
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
