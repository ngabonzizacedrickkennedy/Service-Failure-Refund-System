package com.example.User_Management_Service.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String USER_REGISTERED = "user-registered";
    public static final String USER_DELETED = "user-deleted";
    public static final String USER_STATUS_CHANGED = "user-status-changed";
    public static final String WORKER_PROFILE_SAVED = "worker-profile-saved";
    public static final String PROJECT_PROVIDER_PROFILE_SAVED = "project-provider-profile-saved";
    public static final String ADMIN_PROVIDER_MESSAGE = "admin-provider-message";

    @Bean
    public NewTopic userRegisteredTopic() {
        return TopicBuilder.name(USER_REGISTERED).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic userDeletedTopic() {
        return TopicBuilder.name(USER_DELETED).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic userStatusChangedTopic() {
        return TopicBuilder.name(USER_STATUS_CHANGED).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic workerProfileSavedTopic() {
        return TopicBuilder.name(WORKER_PROFILE_SAVED).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic projectProviderProfileSavedTopic() {
        return TopicBuilder.name(PROJECT_PROVIDER_PROFILE_SAVED).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic adminProviderMessageTopic() {
        return TopicBuilder.name(ADMIN_PROVIDER_MESSAGE).partitions(1).replicas(1).build();
    }
}