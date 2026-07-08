package com.example.Evaluation_Decision_Service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EvaluationEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public void publishClaimDecision(String claimId, String workerId, String providerId, String decision) {
        send("claim-decision", toJson(Map.of(
                "claimId", claimId,
                "workerId", workerId,
                "providerId", providerId,
                "decision", decision
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
