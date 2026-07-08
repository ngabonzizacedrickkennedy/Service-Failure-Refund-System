package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class WorkerMonitorEntry {
    private String workerId;
    private String workerName;
    private String workerEmail;
    private String specialization;
    private double ratingScore;
    private int yearsOfExperience;
    private int completedProjects;
    private int pastFailures;
    private String approvalStatus;
    private boolean banned;
    private List<FailedProjectSummary> failedProjects;
}
