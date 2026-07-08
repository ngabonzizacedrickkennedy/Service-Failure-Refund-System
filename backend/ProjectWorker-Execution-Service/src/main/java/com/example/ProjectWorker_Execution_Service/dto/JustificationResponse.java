package com.example.ProjectWorker_Execution_Service.dto;

import com.example.ProjectWorker_Execution_Service.model.JustificationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class JustificationResponse {
    private String id;
    private String claimId;
    private String workerId;
    private String description;
    private List<String> evidenceUrls;
    private JustificationStatus status;
    private String evaluatorNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
