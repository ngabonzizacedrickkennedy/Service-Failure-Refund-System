package com.example.User_Management_Service.controller;

import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.model.HomepageSettings;
import com.example.User_Management_Service.repository.HomepageSettingsRepository;
import com.example.User_Management_Service.service.S3UploadService;
import com.example.User_Management_Service.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomepageSettingsRepository settingsRepo;
    private final S3UploadService s3UploadService;
    private final UserService userService;

    /**
     * Public – returns all active users of a given role (PROVIDER or WORKER)
     * with only public fields: id, fullName, role, profileImageUrl.
     * Used by the homepage to display providers and workers from the real database.
     */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getPublicUsers(@RequestParam("role") String role) {
        List<UserResponse> users;
        try {
            users = userService.getUsersByRole(role.toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Map<String, Object>> result = users.stream()
                .filter(u -> u.isActive() && !u.isLocked())
                .map(u -> {
                    Map<String, Object> pub = new LinkedHashMap<>();
                    pub.put("id",             u.getId() != null ? u.getId() : "");
                    pub.put("fullName",        u.getFullName() != null ? u.getFullName() : "");
                    pub.put("role",            u.getRole() != null ? u.getRole() : role.toUpperCase());
                    pub.put("profileImageUrl", u.getProfileImageUrl() != null ? u.getProfileImageUrl() : null);
                    pub.put("title",           "");
                    return pub;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Public – homepage settings with a fresh presigned video URL injected.
     */
    @GetMapping("/settings")
    public ResponseEntity<String> getSettings() {
        HomepageSettings entity = settingsRepo.findById("singleton").orElse(null);
        if (entity == null || entity.getSettingsJson() == null) {
            return ResponseEntity.notFound().build();
        }

        String json = entity.getSettingsJson();

        if (entity.getVideoS3Key() != null && !entity.getVideoS3Key().isBlank()) {
            try {
                String freshUrl = s3UploadService.generatePresignedUrl(entity.getVideoS3Key());
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(json);
                JsonNode heroNode = root.get("hero");
                if (heroNode != null && heroNode.isObject()) {
                    ((ObjectNode) heroNode).put("videoUrl", freshUrl);
                }
                json = mapper.writeValueAsString(root);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
    }

    /**
     * Admin only – save homepage settings JSON to the database.
     */
    @PostMapping(value = "/settings", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> saveSettings(@RequestBody String settingsJson) {
        HomepageSettings entity = settingsRepo.findById("singleton")
                .orElse(new HomepageSettings("singleton", null, null, null));
        entity.setSettingsJson(settingsJson);
        settingsRepo.save(entity);
        return ResponseEntity.ok().build();
    }

    /**
     * Admin only – upload a background video to S3 (home-videos/ prefix).
     */
    @PostMapping("/upload-video")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadVideo(@RequestParam("file") MultipartFile file) {
        String key = s3UploadService.uploadHomeVideo(file);
        String url = s3UploadService.generatePresignedUrl(key);

        HomepageSettings entity = settingsRepo.findById("singleton")
                .orElse(new HomepageSettings("singleton", null, null, null));
        entity.setVideoS3Key(key);
        settingsRepo.save(entity);

        return ResponseEntity.ok(Map.of("key", key, "url", url));
    }

    /**
     * Admin only – remove the stored video from S3.
     */
    @DeleteMapping("/video")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeVideo() {
        HomepageSettings entity = settingsRepo.findById("singleton").orElse(null);
        if (entity != null && entity.getVideoS3Key() != null) {
            s3UploadService.deleteProfileImage(entity.getVideoS3Key());
            entity.setVideoS3Key(null);
            settingsRepo.save(entity);
        }
        return ResponseEntity.ok().build();
    }
}
