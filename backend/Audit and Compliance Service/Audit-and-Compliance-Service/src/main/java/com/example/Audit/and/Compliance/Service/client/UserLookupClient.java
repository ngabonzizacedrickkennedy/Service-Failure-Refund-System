package com.example.Audit.and.Compliance.Service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fetches user display names from the User Management Service.
 * Results are cached in memory so each user ID is only looked up once
 * per service lifecycle — avoids hammering the upstream service during
 * Kafka replay of historical events.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserLookupClient {

    private final RestTemplate restTemplate;

    @Value("${user.management.url:http://localhost:8081}")
    private String userManagementUrl;

    private static final Set<String> SKIP_IDS = Set.of("SYSTEM", "ADMIN", "REFUND_OFFICE");

    /** userId → "Full Name" cache. Null values mean "not found". */
    private final ConcurrentHashMap<String, String> nameCache = new ConcurrentHashMap<>();

    /**
     * Returns the full name for the given userId, or null if the user
     * cannot be found or the ID is a system token.
     */
    public String fetchName(String userId) {
        if (userId == null || userId.isBlank() || SKIP_IDS.contains(userId)) {
            return null;
        }
        // ConcurrentHashMap.computeIfAbsent is safe but doesn't allow null values;
        // use get-then-put pattern with a sentinel to distinguish "not found".
        if (nameCache.containsKey(userId)) {
            String cached = nameCache.get(userId);
            return "".equals(cached) ? null : cached;
        }
        String name = fetchFromService(userId);
        nameCache.put(userId, name != null ? name : "");
        return name;
    }

    @SuppressWarnings("unchecked")
    private String fetchFromService(String userId) {
        try {
            Map<String, Object> body = restTemplate.getForObject(
                    userManagementUrl + "/api/users/" + userId,
                    Map.class
            );
            if (body != null && body.get("fullName") instanceof String n) {
                return n;
            }
        } catch (Exception e) {
            log.debug("[UserLookup] Could not resolve name for userId={}: {}", userId, e.getMessage());
        }
        return null;
    }
}
