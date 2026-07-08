package com.example.ProjectWorker_Execution_Service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "worker_cvs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerCv {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true)
    private String workerId;

    @Column(nullable = false)
    private String workerName;

    @Column(nullable = false)
    private String workerEmail;

    private String cvFileKey;

    @Column(nullable = false)
    @Builder.Default
    private int yearsOfExperience = 0;

    @Column(nullable = false)
    private String specialization;

    @Column(columnDefinition = "TEXT")
    private String additionalCredentials;

    @Column(nullable = false)
    @Builder.Default
    private double ratingScore = 0.0;

    @Column(columnDefinition = "TEXT")
    private String ratingReasoning;

    @Column(nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private int completedProjects = 0;

    @Column(nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private int pastFailures = 0;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String approvalStatus = "PENDING";

    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean banned = false;

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
