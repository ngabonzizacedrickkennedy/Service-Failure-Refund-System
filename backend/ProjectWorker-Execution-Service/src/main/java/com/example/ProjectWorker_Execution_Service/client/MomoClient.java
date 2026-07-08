package com.example.ProjectWorker_Execution_Service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MomoClient {

    private final RestTemplate restTemplate;

    @Value("${momo.base-url}")
    private String baseUrl;

    @Value("${momo.subscription-key}")
    private String subscriptionKey;

    @Value("${momo.api-user}")
    private String apiUser;

    @Value("${momo.api-key}")
    private String apiKey;

    @Value("${momo.target-environment}")
    private String targetEnvironment;

    @Value("${momo.currency}")
    private String currency;

    private String cachedToken;
    private Instant tokenExpiry = Instant.EPOCH;

    public record PaymentStatus(String status, String reason) {}

    public void requestToPay(String referenceId, BigDecimal amount, String payerMsisdn, String externalId) {
        HttpHeaders headers = authHeaders();
        headers.set("X-Reference-Id", referenceId);
        headers.set("X-Target-Environment", targetEnvironment);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "amount", amount.toPlainString(),
                "currency", currency,
                "externalId", externalId,
                "payer", Map.of("partyIdType", "MSISDN", "partyId", payerMsisdn),
                "payerMessage", "Service Failure Refund System project funding",
                "payeeNote", "Project deposit"
        );

        try {
            restTemplate.exchange(baseUrl + "/collection/v1_0/requesttopay", HttpMethod.POST,
                    new HttpEntity<>(body, headers), Void.class);
            log.info("[MoMo] RequestToPay sent, reference {}", referenceId);
        } catch (HttpClientErrorException e) {
            log.warn("[MoMo] RequestToPay rejected for reference {}: {}", referenceId, e.getResponseBodyAsString());
            throw new IllegalStateException("MoMo rejected the payment request.");
        }
    }

    public PaymentStatus getTransactionStatus(String referenceId) {
        HttpHeaders headers = authHeaders();
        headers.set("X-Target-Environment", targetEnvironment);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/collection/v1_0/requesttopay/" + referenceId, HttpMethod.GET,
                new HttpEntity<>(headers), new ParameterizedTypeReference<Map<String, Object>>() {});

        Map<?, ?> body = response.getBody();
        String status = body != null && body.get("status") != null ? String.valueOf(body.get("status")) : "PENDING";
        String reason = body != null && body.get("reason") != null ? String.valueOf(body.get("reason")) : null;
        return new PaymentStatus(status, reason);
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Ocp-Apim-Subscription-Key", subscriptionKey);
        headers.set("Authorization", "Bearer " + getAccessToken());
        return headers;
    }

    private synchronized String getAccessToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiry)) {
            return cachedToken;
        }

        HttpHeaders headers = new HttpHeaders();
        String credentials = Base64.getEncoder().encodeToString((apiUser + ":" + apiKey).getBytes());
        headers.set("Authorization", "Basic " + credentials);
        headers.set("Ocp-Apim-Subscription-Key", subscriptionKey);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/collection/token/", HttpMethod.POST, new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map<String, Object>>() {});

        Map<?, ?> body = response.getBody();
        cachedToken = body != null ? String.valueOf(body.get("access_token")) : null;
        int expiresIn = body != null && body.get("expires_in") != null
                ? Integer.parseInt(String.valueOf(body.get("expires_in"))) : 3600;
        tokenExpiry = Instant.now().plusSeconds(Math.max(expiresIn - 60, 30));
        return cachedToken;
    }
}
