package com.example.Refund_Processing_Service.kafka;

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

@Slf4j
@Component
@RequiredArgsConstructor
public class RefundEventPublisher {

    private final RestTemplate restTemplate;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

    @Async
    public void publishRefundInitiated(String claimId, String providerId, String workerId, String projectId) {
        Map<String, String> notif = new HashMap<>();
        notif.put("claimId", claimId);
        post(notificationServiceUrl, "/api/internal/events/refund-initiated", notif);

        Map<String, String> audit = new HashMap<>();
        audit.put("claimId", claimId);
        audit.put("providerId", providerId);
        audit.put("workerId", workerId);
        audit.put("projectId", projectId);
        post(auditServiceUrl, "/api/internal/events/refund-initiated", audit);
    }

    @Async
    public void publishRefundCompleted(String claimId, String providerId, String amount) {
        Map<String, String> notif = new HashMap<>();
        notif.put("claimId", claimId);
        notif.put("providerId", providerId);
        notif.put("amount", amount);
        post(notificationServiceUrl, "/api/internal/events/refund-completed", notif);

        Map<String, String> audit = new HashMap<>();
        audit.put("claimId", claimId);
        audit.put("providerId", providerId);
        audit.put("amount", amount);
        post(auditServiceUrl, "/api/internal/events/refund-completed", audit);
    }

    private void post(String baseUrl, String path, Map<String, String> body) {
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("X-Internal-Key", internalApiKey);
            restTemplate.postForEntity(baseUrl + path, new HttpEntity<>(body, h), Void.class);
        } catch (Exception e) {
            log.warn("[Event] POST {} failed: {}", path, e.getMessage());
        }
    }
}
