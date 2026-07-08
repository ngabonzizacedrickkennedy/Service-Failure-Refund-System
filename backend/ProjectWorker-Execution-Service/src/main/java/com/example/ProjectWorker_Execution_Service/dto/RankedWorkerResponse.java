package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RankedWorkerResponse {
    private String workerId;
    private String workerName;
    private String workerEmail;
    private String specialization;
    private int yearsOfExperience;
    private double ratingScore;
    private double rankScore;
}
