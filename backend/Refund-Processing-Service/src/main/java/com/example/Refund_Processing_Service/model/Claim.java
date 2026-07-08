package com.example.Refund_Processing_Service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "claims")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String projectId;

    @Column(nullable = false)
    private String providerId;

    @Column(nullable = false)
    private String workerId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ClaimStatus status = ClaimStatus.PENDING;

    @ElementCollection
    @CollectionTable(name = "claim_documents", joinColumns = @JoinColumn(name = "claim_id"))
    @Column(name = "document_key")
    @Builder.Default
    private List<String> proofDocumentKeys = new ArrayList<>();

    private String geotagPhotoKey;
    private Double extractedLat;
    private Double extractedLon;
    private String extractedPhotoTimestamp;

    @ElementCollection
    @CollectionTable(name = "claim_ghost_images", joinColumns = @JoinColumn(name = "claim_id"))
    @Column(name = "image_key")
    @Builder.Default
    private List<String> ghostProjectImageKeys = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String messageEvidenceJson;

    @Column(columnDefinition = "TEXT")
    private String workerResponse;

    @Column(columnDefinition = "TEXT")
    private String aiMediationReport;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
