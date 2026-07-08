package com.example.ProjectWorker_Execution_Service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String workerId;

    @Column(nullable = false)
    private String workerName;

    @Column(nullable = false)
    private String workerEmail;

    @Column(columnDefinition = "TEXT")
    private String answersJson;

    @Column(nullable = false)
    @Builder.Default
    private double interviewScore = 0.0;

    @Column(columnDefinition = "TEXT")
    private String scoringReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InterviewStatus status = InterviewStatus.SUBMITTED;

    @Column(updatable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
}
