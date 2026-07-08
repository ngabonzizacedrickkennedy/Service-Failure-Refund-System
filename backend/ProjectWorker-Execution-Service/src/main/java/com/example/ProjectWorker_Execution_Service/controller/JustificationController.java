package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.JustificationResponse;
import com.example.ProjectWorker_Execution_Service.model.JustificationStatus;
import com.example.ProjectWorker_Execution_Service.model.WorkerJustification;
import com.example.ProjectWorker_Execution_Service.repository.ClaimRepository;
import com.example.ProjectWorker_Execution_Service.repository.WorkerJustificationRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.S3UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/justifications")
@RequiredArgsConstructor
public class JustificationController {

    private final WorkerJustificationRepository justificationRepository;
    private final ClaimRepository claimRepository;
    private final S3UploadService s3UploadService;

    @PostMapping(path = "/claim/{claimId}", consumes = "multipart/form-data")
    public ResponseEntity<JustificationResponse> submit(
            @PathVariable String claimId,
            @RequestParam("description") String description,
            @RequestParam(value = "evidenceFiles", required = false) List<MultipartFile> evidenceFiles,
            @AuthenticationPrincipal UserPrincipal principal) {

        var claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        if (!claim.getWorkerId().equals(principal.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (justificationRepository.existsByClaimId(claimId)) {
            // update existing
            var existing = justificationRepository.findByClaimId(claimId).get();
            existing.setDescription(description);
            List<String> urls = uploadFiles(evidenceFiles);
            if (!urls.isEmpty()) existing.setEvidenceUrls(urls);
            existing.setStatus(JustificationStatus.SUBMITTED);
            return ResponseEntity.ok(toResponse(justificationRepository.save(existing)));
        }

        List<String> urls = uploadFiles(evidenceFiles);

        WorkerJustification justification = WorkerJustification.builder()
                .claimId(claimId)
                .workerId(principal.getUserId())
                .description(description)
                .evidenceUrls(urls)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(justificationRepository.save(justification)));
    }

    @GetMapping("/claim/{claimId}")
    public ResponseEntity<JustificationResponse> getByClaimId(@PathVariable String claimId) {
        return justificationRepository.findByClaimId(claimId)
                .map(j -> ResponseEntity.ok(toResponse(j)))
                .orElse(ResponseEntity.notFound().build());
    }

    private List<String> uploadFiles(List<MultipartFile> files) {
        List<String> keys = new ArrayList<>();
        if (files == null) return keys;
        for (MultipartFile f : files) {
            if (f != null && !f.isEmpty()) {
                try {
                    // uploadFile(file, folder) appends its own UUID prefix — pass the folder only
                    String key = s3UploadService.uploadFile(f, "justifications");
                    keys.add(key);
                } catch (Exception ignored) {}
            }
        }
        return keys;
    }

    private JustificationResponse toResponse(WorkerJustification j) {
        // Convert stored S3 keys to time-limited presigned URLs (same pattern as claim service)
        List<String> presignedUrls = j.getEvidenceUrls().stream()
                .map(s3UploadService::generatePresignedUrl)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());

        return JustificationResponse.builder()
                .id(j.getId())
                .claimId(j.getClaimId())
                .workerId(j.getWorkerId())
                .description(j.getDescription())
                .evidenceUrls(presignedUrls)
                .status(j.getStatus())
                .evaluatorNotes(j.getEvaluatorNotes())
                .createdAt(j.getCreatedAt())
                .updatedAt(j.getUpdatedAt())
                .build();
    }
}
