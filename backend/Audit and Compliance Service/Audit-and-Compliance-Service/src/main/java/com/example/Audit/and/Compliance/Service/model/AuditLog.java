package com.example.Audit.and.Compliance.Service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_actor_id",  columnList = "actorId"),
        @Index(name = "idx_audit_action",     columnList = "action"),
        @Index(name = "idx_audit_service",    columnList = "service"),
        @Index(name = "idx_audit_timestamp",  columnList = "timestamp"),
        @Index(name = "idx_audit_resource",   columnList = "resourceId"),
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private String id;

    /** UUID of the user who triggered the action, or "SYSTEM" for automated events. */
    @Column(nullable = false)
    private String actorId;

    /** Display name of the actor (may be null for early system events). */
    private String actorName;

    /** Role of the actor: PROVIDER, WORKER, EVALUATOR, REFUND_OFFICE, ADMIN, SYSTEM. */
    private String actorRole;

    /** Action label, e.g. CLAIM_FILED, EVALUATOR_DECISION_APPROVED, GEOLOCATION_VERIFIED. */
    @Column(nullable = false)
    private String action;

    /** Origin service, e.g. "User Management", "Execution", "AI Engine", "Evaluation", "Refund". */
    @Column(nullable = false)
    private String service;

    /** Type of the affected resource: CLAIM, PROJECT, USER, GEOLOCATION, WORKER_CV, AI_CONFIG. */
    private String resourceType;

    /** UUID of the affected resource. */
    private String resourceId;

    /** SUCCESS or FAILURE. */
    @Column(nullable = false)
    private String outcome;

    /**
     * JSON blob with event-specific data: coordinates, flags, written reason,
     * old/new values for config changes, etc.
     */
    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
