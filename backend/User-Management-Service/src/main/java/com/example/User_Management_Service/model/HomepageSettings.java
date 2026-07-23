package com.example.User_Management_Service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "homepage_settings")
public class HomepageSettings {

    @Id
    private String id = "singleton";

    @Column(columnDefinition = "TEXT")
    private String settingsJson;

    @Column
    private String videoS3Key;

    /** JSON map of "dot.path.into.settingsJson" -> S3 key, for every admin-uploaded image (partner logos, programme images, ...). */
    @Column(columnDefinition = "TEXT")
    private String imageKeysJson;

    @Column
    private LocalDateTime updatedAt;

    public HomepageSettings() {}

    public HomepageSettings(String id, String settingsJson, String videoS3Key, LocalDateTime updatedAt) {
        this.id = id;
        this.settingsJson = settingsJson;
        this.videoS3Key = videoS3Key;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSettingsJson() { return settingsJson; }
    public void setSettingsJson(String settingsJson) { this.settingsJson = settingsJson; }

    public String getVideoS3Key() { return videoS3Key; }
    public void setVideoS3Key(String videoS3Key) { this.videoS3Key = videoS3Key; }

    public String getImageKeysJson() { return imageKeysJson; }
    public void setImageKeysJson(String imageKeysJson) { this.imageKeysJson = imageKeysJson; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
