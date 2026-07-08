package com.example.Evaluation_Decision_Service.service.impl;

import com.example.Evaluation_Decision_Service.dto.EvaluatorClaimResponse;
import com.example.Evaluation_Decision_Service.exception.ForbiddenException;
import com.example.Evaluation_Decision_Service.exception.ResourceNotFoundException;
import com.example.Evaluation_Decision_Service.kafka.EvaluationEventPublisher;
import com.example.Evaluation_Decision_Service.model.Claim;
import com.example.Evaluation_Decision_Service.model.ClaimStatus;
import com.example.Evaluation_Decision_Service.model.Project;
import com.example.Evaluation_Decision_Service.repository.ClaimRepository;
import com.example.Evaluation_Decision_Service.repository.ProjectRepository;
import com.example.Evaluation_Decision_Service.security.UserPrincipal;
import com.example.Evaluation_Decision_Service.service.EvaluatorClaimService;
import com.example.Evaluation_Decision_Service.service.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EvaluatorClaimServiceImpl implements EvaluatorClaimService {

    private final ClaimRepository claimRepository;
    private final ProjectRepository projectRepository;
    private final S3PresignService s3PresignService;
    private final EvaluationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<EvaluatorClaimResponse> getAllClaims(String statusFilter, UserPrincipal principal) {
        requireEvaluatorOrAdmin(principal);

        List<Claim> claims;
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            claims = claimRepository.findAllByOrderByCreatedAtDesc();
        } else {
            ClaimStatus status = ClaimStatus.valueOf(statusFilter.toUpperCase());
            claims = claimRepository.findAllByStatusOrderByCreatedAtDesc(status);
        }

        return claims.stream().map(c -> toResponse(c, fetchProject(c.getProjectId()))).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluatorClaimResponse getClaimById(String claimId, UserPrincipal principal) {
        requireEvaluatorOrAdmin(principal);
        Claim claim = findClaim(claimId);
        return toResponse(claim, fetchProject(claim.getProjectId()));
    }

    @Override
    @Transactional
    public EvaluatorClaimResponse approveClaim(String claimId, UserPrincipal principal) {
        if (!"EVALUATOR".equals(principal.getRole())) {
            throw new ForbiddenException("Only evaluators can approve claims.");
        }
        Claim claim = findClaim(claimId);
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new IllegalArgumentException("Only pending claims can be approved.");
        }
        claim.setStatus(ClaimStatus.APPROVED);
        claimRepository.save(claim);
        eventPublisher.publishClaimDecision(claimId, claim.getWorkerId(), claim.getProviderId(), "APPROVED");
        return toResponse(claim, fetchProject(claim.getProjectId()));
    }

    @Override
    @Transactional
    public EvaluatorClaimResponse rejectClaim(String claimId, UserPrincipal principal) {
        if (!"EVALUATOR".equals(principal.getRole())) {
            throw new ForbiddenException("Only evaluators can reject claims.");
        }
        Claim claim = findClaim(claimId);
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new IllegalArgumentException("Only pending claims can be rejected.");
        }
        claim.setStatus(ClaimStatus.REJECTED);
        claimRepository.save(claim);
        eventPublisher.publishClaimDecision(claimId, claim.getWorkerId(), claim.getProviderId(), "REJECTED");
        return toResponse(claim, fetchProject(claim.getProjectId()));
    }

    private void requireEvaluatorOrAdmin(UserPrincipal principal) {
        String role = principal.getRole();
        if (!"EVALUATOR".equals(role) && !"ADMIN".equals(role)) {
            throw new ForbiddenException("Access denied.");
        }
    }

    private Claim findClaim(String claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found."));
    }

    private Project fetchProject(String projectId) {
        return projectRepository.findById(projectId).orElse(null);
    }

    private EvaluatorClaimResponse toResponse(Claim c, Project project) {
        List<String> docUrls = c.getProofDocumentKeys().stream()
                .map(s3PresignService::generatePresignedUrl)
                .collect(Collectors.toList());

        List<String> ghostUrls = c.getGhostProjectImageKeys().stream()
                .map(s3PresignService::generatePresignedUrl)
                .collect(Collectors.toList());

        return EvaluatorClaimResponse.builder()
                .id(c.getId())
                .projectId(c.getProjectId())
                .providerId(c.getProviderId())
                .workerId(c.getWorkerId())
                .description(c.getDescription())
                .status(c.getStatus().name())
                .proofDocumentUrls(docUrls)
                .ghostProjectImageUrls(ghostUrls)
                .messageEvidence(c.getMessageEvidenceJson())
                .geotagPhotoUrl(s3PresignService.generatePresignedUrl(c.getGeotagPhotoKey()))
                .extractedLat(c.getExtractedLat())
                .extractedLon(c.getExtractedLon())
                .extractedPhotoTimestamp(c.getExtractedPhotoTimestamp())
                .workerResponse(c.getWorkerResponse())
                .aiMediationReport(c.getAiMediationReport())
                .constructionLocation(project != null ? project.getConstructionLocation() : null)
                .projectTitle(project != null ? project.getTitle() : null)
                .projectStatus(project != null ? project.getStatus() : null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
