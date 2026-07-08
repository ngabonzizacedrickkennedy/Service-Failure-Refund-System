package com.example.ProjectWorker_Execution_Service.dto;

import com.example.ProjectWorker_Execution_Service.model.ProjectCategory;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@Jacksonized
public class ProjectResponse {
    private String id;
    private String providerId;
    private String title;
    private String scopeOfWork;
    private String requiredSkills;
    private String category;
    private String categoryDisplayName;
    private LocalDate deadline;
    private BigDecimal budget;
    private String status;
    private String assignedWorkerId;
    private String constructionLocation;
    private boolean funded;
    private List<ProjectImageResponse> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
