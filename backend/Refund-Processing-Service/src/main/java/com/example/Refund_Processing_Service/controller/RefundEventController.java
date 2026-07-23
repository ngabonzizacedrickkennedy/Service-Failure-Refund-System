package com.example.Refund_Processing_Service.controller;

import com.example.Refund_Processing_Service.kafka.RefundEventPublisher;
import com.example.Refund_Processing_Service.model.Claim;
import com.example.Refund_Processing_Service.model.ClaimStatus;
import com.example.Refund_Processing_Service.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/internal/events")
@RequiredArgsConstructor
public class RefundEventController {

    private final ClaimRepository claimRepository;
    private final RefundEventPublisher eventPublisher;

    @Value("${internal.api-key}")
    private String internalApiKey;

    private boolean bad(String key) {
        return internalApiKey == null || !internalApiKey.equals(key);
    }

    @PostMapping("/claim-decision")
    @Transactional
    public ResponseEntity<Void> claimDecision(
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestBody Map<String, String> body) {
        if (bad(key)) return ResponseEntity.status(403).build();

        String claimId  = body.get("claimId");
        String decision = body.get("decision");
        log.info("[Refund] claim-decision received: {}", body);

        if (claimId == null || !"APPROVED".equalsIgnoreCase(decision)) {
            return ResponseEntity.ok().build();
        }

        Claim claim = claimRepository.findById(claimId).orElse(null);
        if (claim == null) {
            log.warn("[Refund] Claim {} not found — skipping refund initiation", claimId);
            return ResponseEntity.ok().build();
        }

        if (claim.getStatus() != ClaimStatus.APPROVED) {
            log.info("[Refund] Claim {} is not APPROVED (status={}) — skipping", claimId, claim.getStatus());
            return ResponseEntity.ok().build();
        }

        claim.setStatus(ClaimStatus.REFUND_INITIATED);
        claimRepository.save(claim);

        eventPublisher.publishRefundInitiated(claimId, claim.getProviderId(), claim.getWorkerId(), claim.getProjectId());

        log.info("[Refund] Claim {} auto-transitioned to REFUND_INITIATED", claimId);
        return ResponseEntity.ok().build();
    }
}
