package com.example.User_Management_Service.controller;

import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.model.HomepageSettings;
import com.example.User_Management_Service.repository.HomepageSettingsRepository;
import com.example.User_Management_Service.service.S3UploadService;
import com.example.User_Management_Service.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
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

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> IMAGE_KEYS_TYPE = new TypeReference<>() {};

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

        try {
            JsonNode root = MAPPER.readTree(json);
            boolean mutated = false;

            if (entity.getVideoS3Key() != null && !entity.getVideoS3Key().isBlank()) {
                String freshUrl = s3UploadService.generatePresignedUrl(entity.getVideoS3Key());
                JsonNode heroNode = root.get("hero");
                if (heroNode != null && heroNode.isObject()) {
                    ((ObjectNode) heroNode).put("videoUrl", freshUrl);
                    mutated = true;
                }
            }

            for (Map.Entry<String, String> e : readImageKeys(entity).entrySet()) {
                String freshUrl = s3UploadService.generatePresignedUrl(e.getValue());
                if (setAtPath(root, e.getKey(), freshUrl)) mutated = true;
            }

            if (mutated) json = MAPPER.writeValueAsString(root);
        } catch (Exception ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
    }

    /**
     * Admin only – upload an image (programme tile, partner logo, ...) to S3 (home-images/ prefix)
     * and remember which dot-path inside settingsJson it belongs to, so a fresh presigned URL can be
     * injected there on every future GET /settings.
     */
    @PostMapping("/upload-image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("path") String path) {
        String key = s3UploadService.uploadHomeImage(file);
        String url = s3UploadService.generatePresignedUrl(key);

        HomepageSettings entity = settingsRepo.findById("singleton")
                .orElse(new HomepageSettings("singleton", null, null, null));

        Map<String, String> imageKeys = readImageKeys(entity);
        String oldKey = imageKeys.get(path);
        if (oldKey != null && !oldKey.isBlank() && !oldKey.equals(key)) {
            s3UploadService.deleteProfileImage(oldKey);
        }
        imageKeys.put(path, key);
        writeImageKeys(entity, imageKeys);
        settingsRepo.save(entity);

        return ResponseEntity.ok(Map.of("key", key, "url", url, "path", path));
    }

    /**
     * Admin only – remove a previously uploaded image at the given settings path.
     */
    @DeleteMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeImage(@RequestParam("path") String path) {
        HomepageSettings entity = settingsRepo.findById("singleton").orElse(null);
        if (entity != null) {
            Map<String, String> imageKeys = readImageKeys(entity);
            String key = imageKeys.remove(path);
            if (key != null && !key.isBlank()) {
                s3UploadService.deleteProfileImage(key);
            }
            writeImageKeys(entity, imageKeys);
            settingsRepo.save(entity);
        }
        return ResponseEntity.ok().build();
    }

    private Map<String, String> readImageKeys(HomepageSettings entity) {
        if (entity.getImageKeysJson() == null || entity.getImageKeysJson().isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return MAPPER.readValue(entity.getImageKeysJson(), IMAGE_KEYS_TYPE);
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private void writeImageKeys(HomepageSettings entity, Map<String, String> imageKeys) {
        try {
            entity.setImageKeysJson(MAPPER.writeValueAsString(imageKeys));
        } catch (Exception ignored) {}
    }

    /** Navigates a dot-path (array indices as plain numbers) and overwrites the leaf with a text value. */
    private boolean setAtPath(JsonNode root, String path, String value) {
        String[] parts = path.split("\\.");
        JsonNode current = root;
        for (int i = 0; i < parts.length - 1; i++) {
            String part = parts[i];
            if (part.matches("\\d+")) {
                int idx = Integer.parseInt(part);
                if (!current.isArray() || idx >= current.size()) return false;
                current = current.get(idx);
            } else {
                if (current == null || !current.has(part)) return false;
                current = current.get(part);
            }
        }
        String last = parts[parts.length - 1];
        if (last.matches("\\d+")) {
            int idx = Integer.parseInt(last);
            if (current != null && current.isArray() && idx < current.size()) {
                ((ArrayNode) current).set(idx, TextNode.valueOf(value));
                return true;
            }
            return false;
        }
        if (current != null && current.isObject()) {
            ((ObjectNode) current).put(last, value);
            return true;
        }
        return false;
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
