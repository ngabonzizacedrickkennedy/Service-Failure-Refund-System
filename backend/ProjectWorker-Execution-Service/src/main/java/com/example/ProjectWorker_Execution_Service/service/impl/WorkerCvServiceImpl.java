package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.client.AiServiceClient;
import com.example.ProjectWorker_Execution_Service.dto.FailedProjectSummary;
import com.example.ProjectWorker_Execution_Service.dto.WorkerCvResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerMonitorEntry;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.kafka.ExecutionEventPublisher;
import com.example.ProjectWorker_Execution_Service.model.Claim;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.WorkerCv;
import com.example.ProjectWorker_Execution_Service.repository.ClaimRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.repository.WorkerCvRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.S3UploadService;
import com.example.ProjectWorker_Execution_Service.service.WorkerCvService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkerCvServiceImpl implements WorkerCvService {

    private final WorkerCvRepository workerCvRepository;
    private final ClaimRepository claimRepository;
    private final ProjectRepository projectRepository;
    private final S3UploadService s3UploadService;
    private final ExecutionEventPublisher eventPublisher;
    private final AiServiceClient aiServiceClient;

    @Override
    public WorkerCvResponse submitOrUpdateCv(String specialization, int yearsOfExperience,
                                              String additionalCredentials, MultipartFile cvFile,
                                              UserPrincipal principal) {
        if (!"WORKER".equals(principal.getRole())) {
            throw new ForbiddenException("Only workers can submit a CV.");
        }
        WorkerCvResponse response = persistCv(specialization, yearsOfExperience, additionalCredentials, cvFile, principal);
        if (isReadyForRating(response)) {
            log.info("[CV] Triggering AI rating for worker {} (spec={}, exp={})",
                    principal.getUserId(), response.getSpecialization(), response.getYearsOfExperience());
            // Call AI service directly via HTTP — reliable, no Kafka dependency
            aiServiceClient.triggerCvRating(principal.getUserId());
            // Also publish Kafka event for any other consumers
            eventPublisher.publishWorkerCvSubmitted(principal.getUserId());
        } else {
            log.warn("[CV] Skipping rating for worker {} — spec='{}', exp={}",
                    principal.getUserId(), response.getSpecialization(), response.getYearsOfExperience());
        }
        return response;
    }

    private boolean isReadyForRating(WorkerCvResponse cv) {
        return cv.getSpecialization() != null && !cv.getSpecialization().isBlank()
            && cv.getYearsOfExperience() > 0;
    }

    @Transactional
    protected WorkerCvResponse persistCv(String specialization, int yearsOfExperience,
                                          String additionalCredentials, MultipartFile cvFile,
                                          UserPrincipal principal) {
        Optional<WorkerCv> existing = workerCvRepository.findByWorkerId(principal.getUserId());
        WorkerCv cv = existing.orElseGet(() -> WorkerCv.builder()
                .workerId(principal.getUserId())
                .workerEmail(principal.getEmail())
                .workerName(extractNameFromEmail(principal.getEmail()))
                .ratingScore(0.0)
                .build());

        cv.setSpecialization(specialization);
        cv.setYearsOfExperience(yearsOfExperience);
        cv.setAdditionalCredentials(additionalCredentials != null && !additionalCredentials.isBlank() ? additionalCredentials : null);

        if (cvFile != null && !cvFile.isEmpty()) {
            try {
                String key = s3UploadService.uploadFile(cvFile, "worker-cvs");
                cv.setCvFileKey(key);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload CV file.");
            }
        }

        workerCvRepository.save(cv);
        return toResponse(cv);
    }

    @Override
    public WorkerCvResponse getMyCv(UserPrincipal principal) {
        WorkerCv cv = workerCvRepository.findByWorkerId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("No CV found. Please submit your CV first."));
        return toResponse(cv);
    }

    @Override
    public WorkerCvResponse getWorkerCv(String workerId) {
        WorkerCv cv = workerCvRepository.findByWorkerId(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("CV not found for this worker."));
        return toResponse(cv);
    }

    @Override
    public List<WorkerCvResponse> getAllCvs() {
        return workerCvRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<WorkerMonitorEntry> getWorkersForMonitor() {
        List<String> workerIdsWithClaims = claimRepository.findDistinctWorkerIds();
        if (workerIdsWithClaims.isEmpty()) return List.of();

        return workerIdsWithClaims.stream()
                .map(workerId -> workerCvRepository.findByWorkerId(workerId).map(cv -> {
                    List<Claim> claims = claimRepository.findAllByWorkerIdOrderByCreatedAtDesc(workerId);
                    List<FailedProjectSummary> failedProjects = claims.stream()
                            .map(claim -> {
                                Project project = projectRepository.findById(claim.getProjectId()).orElse(null);
                                return FailedProjectSummary.builder()
                                        .claimId(claim.getId())
                                        .projectId(claim.getProjectId())
                                        .projectTitle(project != null ? project.getTitle() : "Unknown Project")
                                        .projectBudget(project != null ? project.getBudget() : null)
                                        .claimStatus(claim.getStatus().name())
                                        .claimCreatedAt(claim.getCreatedAt())
                                        .build();
                            })
                            .collect(Collectors.toList());
                    return WorkerMonitorEntry.builder()
                            .workerId(cv.getWorkerId())
                            .workerName(cv.getWorkerName())
                            .workerEmail(cv.getWorkerEmail())
                            .specialization(cv.getSpecialization())
                            .ratingScore(cv.getRatingScore())
                            .yearsOfExperience(cv.getYearsOfExperience())
                            .completedProjects(cv.getCompletedProjects())
                            .pastFailures(failedProjects.size())
                            .approvalStatus(cv.getApprovalStatus())
                            .banned(cv.isBanned())
                            .failedProjects(failedProjects)
                            .build();
                }).orElse(null))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(WorkerMonitorEntry::getPastFailures).reversed())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void setBanStatus(String workerId, boolean banned) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setBanned(banned);
            workerCvRepository.save(cv);
        });
    }

    @Override
    @Transactional
    public void updateRatingScore(String workerId, double score, String reasoning) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setRatingScore(score);
            cv.setRatingReasoning(reasoning);
            workerCvRepository.save(cv);
        });
    }

    @Override
    @Transactional
    public void updateApprovalStatus(String workerId, String status) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setApprovalStatus(status);
            workerCvRepository.save(cv);
            eventPublisher.publishWorkerApproval(workerId, status);
        });
    }

    @Override
    @Transactional
    public void incrementCompletedProjects(String workerId) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setCompletedProjects(cv.getCompletedProjects() + 1);
            workerCvRepository.save(cv);
        });
    }

    @Override
    @Transactional
    public void incrementPastFailures(String workerId) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            int newCount = cv.getPastFailures() + 1;
            cv.setPastFailures(newCount);
            if (newCount >= 10) {
                cv.setBanned(true);
            }
            workerCvRepository.save(cv);
        });
    }

    private WorkerCvResponse toResponse(WorkerCv cv) {
        return WorkerCvResponse.builder()
                .id(cv.getId())
                .workerId(cv.getWorkerId())
                .workerName(cv.getWorkerName())
                .workerEmail(cv.getWorkerEmail())
                .cvFileUrl(s3UploadService.generatePresignedUrl(cv.getCvFileKey()))
                .yearsOfExperience(cv.getYearsOfExperience())
                .specialization(cv.getSpecialization())
                .additionalCredentials(cv.getAdditionalCredentials())
                .ratingScore(cv.getRatingScore())
                .ratingReasoning(cv.getRatingReasoning())
                .approvalStatus(cv.getApprovalStatus())
                .completedProjects(cv.getCompletedProjects())
                .pastFailures(cv.getPastFailures())
                .banned(cv.isBanned())
                .createdAt(cv.getCreatedAt())
                .updatedAt(cv.getUpdatedAt())
                .build();
    }

    private String extractNameFromEmail(String email) {
        if (email == null) return "Worker";
        return email.substring(0, email.indexOf('@')).replace(".", " ");
    }
}
