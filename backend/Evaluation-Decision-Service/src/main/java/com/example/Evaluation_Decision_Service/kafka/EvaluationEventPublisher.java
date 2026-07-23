package com.example.Evaluation_Decision_Service.kafka;

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
public class EvaluationEventPublisher {

    private final RestTemplate restTemplate;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    @Value("${refund.service.url}")
    private String refundServiceUrl;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

    @Async
    public void publishClaimDecision(String claimId, String workerId, String providerId, String decision) {
        Map<String, String> body = new HashMap<>();
        body.put("claimId", claimId);
        body.put("workerId", workerId);
        body.put("providerId", providerId);
        body.put("decision", decision);

        post(notificationServiceUrl, "/api/internal/events/claim-decision", body);
        post(refundServiceUrl, "/api/internal/events/claim-decision", body);
        post(auditServiceUrl, "/api/internal/events/claim-decision", body);
    }

    private void post(String baseUrl, String path, Map<String, String> body) {
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("X-Internal-Key", internalApiKey);
            restTemplate.postForEntity(baseUrl + path, new HttpEntity<>(body, h), Void.class);
        } catch (Exception e) {
            log.warn("[Event] POST {} failed: {}", path, e.getMessage());  // swallow — fire-and-forget
        }
    }
}
