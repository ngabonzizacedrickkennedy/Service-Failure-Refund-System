package com.example.Refund_Processing_Service.service.impl;

import com.example.Refund_Processing_Service.dto.ClaimResponse;
import com.example.Refund_Processing_Service.exception.ForbiddenException;
import com.example.Refund_Processing_Service.exception.ResourceNotFoundException;
import com.example.Refund_Processing_Service.kafka.RefundEventPublisher;
import com.example.Refund_Processing_Service.model.Account;
import com.example.Refund_Processing_Service.model.Claim;
import com.example.Refund_Processing_Service.model.ClaimStatus;
import com.example.Refund_Processing_Service.model.Project;
import com.example.Refund_Processing_Service.repository.AccountRepository;
import com.example.Refund_Processing_Service.repository.ClaimRepository;
import com.example.Refund_Processing_Service.repository.ProjectRepository;
import com.example.Refund_Processing_Service.security.UserPrincipal;
import com.example.Refund_Processing_Service.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final ClaimRepository claimRepository;
    private final ProjectRepository projectRepository;
    private final AccountRepository accountRepository;
    private final RefundEventPublisher eventPublisher;

    @Override
    @Transactional
    public ClaimResponse initiateRefund(String claimId, UserPrincipal principal) {
        if (!"EVALUATOR".equals(principal.getRole())) {
            throw new ForbiddenException("Only evaluators can initiate refund processes.");
        }
        Claim claim = findClaim(claimId);
        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved claims can have a refund initiated.");
        }
        claim.setStatus(ClaimStatus.REFUND_INITIATED);
        claimRepository.save(claim);
        eventPublisher.publishRefundInitiated(claimId, claim.getProviderId(), claim.getWorkerId(), claim.getProjectId());
        return toResponseWithProject(claim, projectRepository.findById(claim.getProjectId()).orElse(null));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimResponse> getRefundPendingClaims(UserPrincipal principal) {
        if (!"REFUND_OFFICE".equals(principal.getRole())) {
            throw new ForbiddenException("Only refund office staff can access this.");
        }
        return claimRepository.findAllByStatusOrderByCreatedAtDesc(ClaimStatus.REFUND_INITIATED)
                .stream()
                .map(c -> toResponseWithProject(c, projectRepository.findById(c.getProjectId()).orElse(null)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimResponse> getRefundedClaims(UserPrincipal principal) {
        if (!"REFUND_OFFICE".equals(principal.getRole())) {
            throw new ForbiddenException("Only refund office staff can access this.");
        }
        return claimRepository.findAllByStatusOrderByCreatedAtDesc(ClaimStatus.REFUNDED)
                .stream()
                .map(c -> toResponseWithProject(c, projectRepository.findById(c.getProjectId()).orElse(null)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClaimResponse processRefund(String claimId, UserPrincipal principal) {
        if (!"REFUND_OFFICE".equals(principal.getRole())) {
            throw new ForbiddenException("Only refund office staff can process refunds.");
        }
        Claim claim = findClaim(claimId);
        if (claim.getStatus() != ClaimStatus.REFUND_INITIATED) {
            throw new IllegalArgumentException("Only claims with status REFUND_INITIATED can be processed.");
        }

        Project project = projectRepository.findById(claim.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        BigDecimal refundAmount = project.getBudget();

        Account providerAccount = accountRepository.findByUserId(claim.getProviderId())
                .orElseGet(() -> accountRepository.save(Account.builder()
                        .userId(claim.getProviderId())
                        .role("PROVIDER")
                        .accountNumber(generateUniqueAccountNumber())
                        .build()));

        providerAccount.setBalance(providerAccount.getBalance().add(refundAmount));
        accountRepository.save(providerAccount);

        claim.setStatus(ClaimStatus.REFUNDED);
        claimRepository.save(claim);

        eventPublisher.publishRefundCompleted(claimId, claim.getProviderId(), refundAmount.toPlainString());
        return toResponseWithProject(claim, project);
    }

    private String generateUniqueAccountNumber() {
        String num;
        do {
            num = String.format("%010d", ThreadLocalRandom.current().nextLong(0, 10_000_000_000L));
        } while (accountRepository.existsByAccountNumber(num));
        return num;
    }

    private Claim findClaim(String claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found."));
    }

    private ClaimResponse toResponseWithProject(Claim c, Project project) {
        return ClaimResponse.builder()
                .id(c.getId())
                .projectId(c.getProjectId())
                .providerId(c.getProviderId())
                .workerId(c.getWorkerId())
                .description(c.getDescription())
                .status(c.getStatus().name())
                .proofDocumentUrls(c.getProofDocumentKeys())
                .ghostProjectImageUrls(c.getGhostProjectImageKeys())
                .messageEvidence(c.getMessageEvidenceJson())
                .geotagPhotoUrl(c.getGeotagPhotoKey())
                .extractedLat(c.getExtractedLat())
                .extractedLon(c.getExtractedLon())
                .extractedPhotoTimestamp(c.getExtractedPhotoTimestamp())
                .workerResponse(c.getWorkerResponse())
                .aiMediationReport(c.getAiMediationReport())
                .projectBudget(project != null ? project.getBudget() : null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
