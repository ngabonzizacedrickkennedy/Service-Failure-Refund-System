package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InterviewResponse {
    private String id;
    private String workerId;
    private String workerName;
    private String workerEmail;
    private String answersJson;
    private double interviewScore;
    private String scoringReason;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
}
