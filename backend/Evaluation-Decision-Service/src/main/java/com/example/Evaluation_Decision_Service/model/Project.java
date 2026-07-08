package com.example.Evaluation_Decision_Service.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String providerId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String scopeOfWork;

    @Column(nullable = false)
    private String requiredSkills;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal budget;

    @Column(nullable = false)
    private String status;

    @Enumerated(EnumType.STRING)
    private ProjectCategory category;

    private String assignedWorkerId;

    private String constructionLocation;

    @Column(nullable = false)
    private boolean funded;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
