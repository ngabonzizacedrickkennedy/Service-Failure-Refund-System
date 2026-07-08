package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.WorkerCvResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerMonitorEntry;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface WorkerCvService {

    WorkerCvResponse submitOrUpdateCv(String specialization, int yearsOfExperience,
                                       String additionalCredentials, MultipartFile cvFile,
                                       UserPrincipal principal);

    WorkerCvResponse getMyCv(UserPrincipal principal);

    WorkerCvResponse getWorkerCv(String workerId);

    List<WorkerCvResponse> getAllCvs();

    List<WorkerMonitorEntry> getWorkersForMonitor();

    void updateRatingScore(String workerId, double score, String reasoning);

    void updateApprovalStatus(String workerId, String status);

    void setBanStatus(String workerId, boolean banned);

    void incrementCompletedProjects(String workerId);

    void incrementPastFailures(String workerId);
}
