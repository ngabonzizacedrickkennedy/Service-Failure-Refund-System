package com.example.Evaluation_Decision_Service.controller;

import com.example.Evaluation_Decision_Service.dto.JustificationWithClaimDto;
import com.example.Evaluation_Decision_Service.model.Claim;
import com.example.Evaluation_Decision_Service.model.JustificationStatus;
import com.example.Evaluation_Decision_Service.model.WorkerJustification;
import com.example.Evaluation_Decision_Service.repository.ClaimRepository;
import com.example.Evaluation_Decision_Service.repository.WorkerJustificationRepository;
import com.example.Evaluation_Decision_Service.service.S3PresignService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/evaluator/justifications")
@RequiredArgsConstructor
public class JustificationEvaluatorController {

    private final ClaimRepository claimRepository;
    private final WorkerJustificationRepository justificationRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final JavaMailSender mailSender;
    private final S3PresignService s3PresignService;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${spring.mail.username}")
    private String fromEmail;

    /** All claims merged with their justification (if any) — newest first. */
    @GetMapping
    @PreAuthorize("hasAuthority('EVALUATOR')")
    public ResponseEntity<List<JustificationWithClaimDto>> getAll() {
        List<Claim> claims = claimRepository.findAllByOrderByCreatedAtDesc();
        List<JustificationWithClaimDto> result = new ArrayList<>();
        for (Claim c : claims) {
            Optional<WorkerJustification> j = justificationRepository.findByClaimId(c.getId());
            result.add(buildDto(c, j.orElse(null)));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{claimId}")
    @PreAuthorize("hasAuthority('EVALUATOR')")
    public ResponseEntity<JustificationWithClaimDto> getOne(@PathVariable String claimId) {
        Claim c = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        Optional<WorkerJustification> j = justificationRepository.findByClaimId(claimId);
        return ResponseEntity.ok(buildDto(c, j.orElse(null)));
    }

    /**
     * Send justification request email to the worker who owns the claim.
     * Fetches worker email from User Management Service via REST.
     */
    @PostMapping("/{claimId}/request-email")
    @PreAuthorize("hasAuthority('EVALUATOR')")
    public ResponseEntity<Map<String, String>> requestJustification(
            @PathVariable String claimId,
            @RequestBody(required = false) Map<String, String> body) {

        Claim c = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        String workerEmail = body != null ? body.get("workerEmail") : null;
        String workerName  = body != null ? body.get("workerName") : "Worker";

        if (workerEmail == null || workerEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "workerEmail is required"));
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(workerEmail);
            msg.setSubject("Justification Required — Claim Against You (ID: " + claimId.substring(0, 8) + ")");
            msg.setText(
                "Dear " + workerName + ",\n\n" +
                "A claim has been filed against you regarding project work.\n\n" +
                "Claim ID: " + claimId + "\n" +
                "Description: " + c.getDescription() + "\n\n" +
                "You are required to log in to the platform and submit your justification " +
                "for the service failure. Please provide a clear explanation and upload any " +
                "supporting evidence (documents, photos, etc.).\n\n" +
                "Log in at: http://localhost:3000/login\n" +
                "Go to: Dashboard → Claims Against Me\n\n" +
                "Failure to respond may result in automatic claim approval.\n\n" +
                "Regards,\nSSFRS Evaluation Team"
            );
            mailSender.send(msg);
            log.info("[Justification] Email sent to worker {} for claim {}", workerEmail, claimId);
        } catch (Exception e) {
            log.error("[Justification] Failed to send email: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send email: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("status", "email_sent", "recipient", workerEmail));
    }

    @PatchMapping("/{claimId}/validate")
    @PreAuthorize("hasAuthority('EVALUATOR')")
    public ResponseEntity<JustificationWithClaimDto> validate(
            @PathVariable String claimId,
            @RequestBody(required = false) Map<String, String> body) {

        WorkerJustification j = justificationRepository.findByClaimId(claimId)
                .orElseThrow(() -> new RuntimeException("No justification found for this claim"));

        j.setStatus(JustificationStatus.VALIDATED);
        if (body != null && body.get("notes") != null) {
            j.setEvaluatorNotes(body.get("notes"));
        }
        justificationRepository.save(j);

        publishKafka("justification-validated", claimId, j.getWorkerId(), "VALIDATED",
                body != null ? body.get("notes") : null);

        Claim c = claimRepository.findById(claimId).orElseThrow();
        return ResponseEntity.ok(buildDto(c, j));
    }

    @PatchMapping("/{claimId}/reject")
    @PreAuthorize("hasAuthority('EVALUATOR')")
    public ResponseEntity<JustificationWithClaimDto> reject(
            @PathVariable String claimId,
            @RequestBody(required = false) Map<String, String> body) {

        WorkerJustification j = justificationRepository.findByClaimId(claimId)
                .orElseThrow(() -> new RuntimeException("No justification found for this claim"));

        j.setStatus(JustificationStatus.REJECTED);
        if (body != null && body.get("notes") != null) {
            j.setEvaluatorNotes(body.get("notes"));
        }
        justificationRepository.save(j);

        publishKafka("justification-rejected", claimId, j.getWorkerId(), "REJECTED",
                body != null ? body.get("notes") : null);

        Claim c = claimRepository.findById(claimId).orElseThrow();
        return ResponseEntity.ok(buildDto(c, j));
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private void publishKafka(String topic, String claimId, String workerId,
                               String decision, String notes) {
        try {
            String payload = MAPPER.writeValueAsString(Map.of(
                    "claimId",  claimId,
                    "workerId", workerId,
                    "decision", decision,
                    "notes",    notes != null ? notes : ""
            ));
            kafkaTemplate.send(topic, payload);
        } catch (Exception e) {
            log.error("[Justification] Kafka publish failed: {}", e.getMessage());
        }
    }

    private JustificationWithClaimDto buildDto(Claim c, WorkerJustification j) {
        return JustificationWithClaimDto.builder()
                .claimId(c.getId())
                .projectId(c.getProjectId())
                .workerId(c.getWorkerId())
                .providerId(c.getProviderId())
                .claimDescription(c.getDescription())
                .claimStatus(c.getStatus().name())
                .claimCreatedAt(c.getCreatedAt())
                .justificationId(j != null ? j.getId() : null)
                .justificationDescription(j != null ? j.getDescription() : null)
                .evidenceUrls(j != null
                        ? j.getEvidenceUrls().stream()
                                .map(s3PresignService::generatePresignedUrl)
                                .filter(java.util.Objects::nonNull)
                                .collect(java.util.stream.Collectors.toList())
                        : List.of())
                .justificationStatus(j != null ? j.getStatus() : null)
                .evaluatorNotes(j != null ? j.getEvaluatorNotes() : null)
                .justificationCreatedAt(j != null ? j.getCreatedAt() : null)
                .build();
    }
}
