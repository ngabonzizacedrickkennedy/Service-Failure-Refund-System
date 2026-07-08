package com.example.Refund_Processing_Service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class RefundEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public void publishRefundInitiated(String claimId, String providerId, String workerId, String projectId) {
        send("refund-initiated", toJson(Map.of(
                "claimId", claimId,
                "providerId", providerId,
                "workerId", workerId,
                "projectId", projectId
        )));
    }

    public void publishRefundCompleted(String claimId, String providerId, String amount) {
        send("refund-completed", toJson(Map.of(
                "claimId", claimId,
                "providerId", providerId,
                "amount", amount
        )));
    }

    private void send(String topic, String payload) {
        try {
            kafkaTemplate.send(topic, payload).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("[Kafka] FAILED to publish to '{}': {}", topic, ex.getMessage());
                } else {
                    log.info("[Kafka] Published to '{}': {}", topic, payload);
                }
            });
        } catch (Exception e) {
            log.error("[Kafka] Exception publishing to '{}': {}", topic, e.getMessage());
        }
    }

    private String toJson(Map<String, String> map) {
        try {
            return MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            log.error("[Kafka] Failed to serialize payload", e);
            return "{}";
        }
    }
}
