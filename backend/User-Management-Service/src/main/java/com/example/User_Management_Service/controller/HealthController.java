package com.example.User_Management_Service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public health check — used by uptime pingers (e.g. UptimeRobot) to keep the service awake. */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "user-management");
    }
}
