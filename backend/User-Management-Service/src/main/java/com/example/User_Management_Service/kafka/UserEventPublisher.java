package com.example.User_Management_Service.kafka;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishUserRegistered(String userId, String role) {
        publish(KafkaTopicConfig.USER_REGISTERED, new UserEvent(
                userId,
                EventType.USER_REGISTERED,
                role,
                LocalDateTime.now()
        ));
    }

    public void publishUserDeleted(String userId) {
        publish(KafkaTopicConfig.USER_DELETED, new UserEvent(
                userId,
                EventType.USER_DELETED,
                null,
                LocalDateTime.now()
        ));
    }

    public void publishUserStatusChanged(String userId, String status) {
        publish(KafkaTopicConfig.USER_STATUS_CHANGED, new UserEvent(
                userId,
                EventType.USER_STATUS_CHANGED,
                status,
                LocalDateTime.now()
        ));
    }

    public void publishWorkerProfileSaved(String userId) {
        publish(KafkaTopicConfig.WORKER_PROFILE_SAVED, new UserEvent(
                userId,
                EventType.WORKER_PROFILE_SAVED,
                null,
                LocalDateTime.now()
        ));
    }

    public void publishProjectProviderProfileSaved(String userId) {
        publish(KafkaTopicConfig.PROJECT_PROVIDER_PROFILE_SAVED, new UserEvent(
                userId,
                EventType.PROJECT_PROVIDER_PROFILE_SAVED,
                null,
                LocalDateTime.now()
        ));
    }

    public void publishAdminProviderMessage(String providerId, String subject, String message) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "providerId", providerId,
                    "subject", subject,
                    "message", message
            ));
            kafkaTemplate.send(KafkaTopicConfig.ADMIN_PROVIDER_MESSAGE, providerId, payload);
        } catch (Exception e) {
            log.warn("Kafka unavailable — admin-provider-message not published for providerId '{}': {}",
                    providerId, e.getMessage());
        }
    }

    private void publish(String topic, UserEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, event.userId(), message);
        } catch (Exception e) {
            log.warn("Kafka unavailable — event not published to topic '{}' for userId '{}': {}",
                    topic, event.userId(), e.getMessage());
        }
    }
}