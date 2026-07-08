package com.example.Evaluation_Decision_Service.dto;

import com.example.Evaluation_Decision_Service.model.JustificationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class JustificationWithClaimDto {
    // claim info
    private String claimId;
    private String projectId;
    private String workerId;
    private String providerId;
    private String claimDescription;
    private String claimStatus;
    private LocalDateTime claimCreatedAt;

    // justification info (null if not yet submitted)
    private String justificationId;
    private String justificationDescription;
    private List<String> evidenceUrls;
    private JustificationStatus justificationStatus;
    private String evaluatorNotes;
    private LocalDateTime justificationCreatedAt;
}
