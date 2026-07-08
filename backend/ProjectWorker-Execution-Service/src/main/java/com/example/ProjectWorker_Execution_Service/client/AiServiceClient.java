package com.example.ProjectWorker_Execution_Service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiServiceClient {

    private final RestTemplate restTemplate;

    @Value("${ai.service.base-url}")
    private String aiServiceBaseUrl;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @Async
    public void triggerCvRating(String workerId) {
        try {
            String url = aiServiceBaseUrl + "/api/ai/rating/internal/rate-cv/" + workerId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Key", internalApiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.POST, request, Void.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[AI Client] CV rating triggered for worker {}", workerId);
            } else {
                log.warn("[AI Client] CV rating trigger returned HTTP {} for worker {}", response.getStatusCode(), workerId);
            }
        } catch (Exception e) {
            log.warn("[AI Client] Could not reach AI service for worker {}: {}", workerId, e.getMessage());
        }
    }
}
