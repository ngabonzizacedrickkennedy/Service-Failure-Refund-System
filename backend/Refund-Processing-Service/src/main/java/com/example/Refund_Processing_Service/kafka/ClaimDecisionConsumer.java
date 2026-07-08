package com.example.Refund_Processing_Service.kafka;

import com.example.Refund_Processing_Service.model.Claim;
import com.example.Refund_Processing_Service.model.ClaimStatus;
import com.example.Refund_Processing_Service.repository.ClaimRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClaimDecisionConsumer {

    private final ClaimRepository claimRepository;
    private final RefundEventPublisher eventPublisher;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Transactional
    @KafkaListener(topics = "claim-decision", groupId = "refund-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onClaimDecision(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String payload = record.value();
        log.info("[Refund] claim-decision received: {}", payload);

        if (payload == null || !payload.trim().startsWith("{")) {
            ack.acknowledge();
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> data = MAPPER.readValue(payload, Map.class);

            String claimId  = data.get("claimId");
            String decision = data.get("decision");

            if (claimId == null || !"APPROVED".equalsIgnoreCase(decision)) {
                ack.acknowledge();
                return;
            }

            Claim claim = claimRepository.findById(claimId).orElse(null);
            if (claim == null) {
                log.warn("[Refund] Claim {} not found — skipping refund initiation", claimId);
                ack.acknowledge();
                return;
            }

            if (claim.getStatus() != ClaimStatus.APPROVED) {
                log.info("[Refund] Claim {} is not APPROVED (status={}) — skipping", claimId, claim.getStatus());
                ack.acknowledge();
                return;
            }

            claim.setStatus(ClaimStatus.REFUND_INITIATED);
            claimRepository.save(claim);

            eventPublisher.publishRefundInitiated(claimId, claim.getProviderId(), claim.getWorkerId(), claim.getProjectId());

            log.info("[Refund] Claim {} auto-transitioned to REFUND_INITIATED", claimId);
        } catch (Exception e) {
            log.error("[Refund] Failed to process claim-decision: {}", e.getMessage(), e);
        } finally {
            ack.acknowledge();
        }
    }
}
