package com.example.ProjectWorker_Execution_Service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public void publishProjectPosted(String projectId, String providerId) {
        send("project-posted", projectId + ":" + providerId);
    }

    public void publishWorkerCvSubmitted(String workerId) {
        send("worker-cv-submitted", workerId);
    }

    public void publishWorkerAssigned(String projectId, String workerId, String providerId, String projectTitle) {
        send("worker-assigned-to-project", toJson(Map.of(
                "projectId", projectId,
                "workerId", workerId,
                "providerId", providerId,
                "projectTitle", projectTitle
        )));
    }

    public void publishWorkerApproval(String workerId, String status) {
        send("worker-cv-approval", workerId + ":" + status);
    }

    public void publishProjectCompleted(String projectId) {
        send("project-marked-completed", projectId);
    }

    public void publishProjectFailed(String projectId, String providerId, String workerId) {
        send("project-marked-failed", toJson(Map.of(
                "projectId", projectId,
                "providerId", providerId,
                "workerId", workerId
        )));
    }

    public void publishClaimFiled(String claimId, String projectId, String workerId) {
        send("claim-filed", claimId + ":" + projectId + ":" + workerId);
    }

    public void publishWorkerClaimResponse(String claimId, String workerId) {
        send("worker-claim-response-submitted", claimId + ":" + workerId);
    }

    private void send(String topic, String payload) {
        try {
            kafkaTemplate.send(topic, payload).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("[Kafka] FAILED to publish to '{}' payload='{}': {}", topic, payload, ex.getMessage());
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
