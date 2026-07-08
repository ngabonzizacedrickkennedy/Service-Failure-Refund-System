package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.WorkerCvResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerMonitorEntry;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.WorkerCvService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class WorkerCvController {

    private final WorkerCvService workerCvService;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @PostMapping(path = "/api/worker-cv", consumes = "multipart/form-data")
    public ResponseEntity<WorkerCvResponse> submitOrUpdateCv(
            @RequestParam("specialization") String specialization,
            @RequestParam("yearsOfExperience") int yearsOfExperience,
            @RequestParam(value = "additionalCredentials", required = false) String additionalCredentials,
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workerCvService.submitOrUpdateCv(
                specialization, yearsOfExperience, additionalCredentials, cvFile, principal));
    }

    @GetMapping("/api/worker-cv/my")
    public ResponseEntity<WorkerCvResponse> getMyCv(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workerCvService.getMyCv(principal));
    }

    @GetMapping("/api/worker-cv/{workerId}")
    public ResponseEntity<WorkerCvResponse> getWorkerCv(@PathVariable String workerId) {
        return ResponseEntity.ok(workerCvService.getWorkerCv(workerId));
    }

    @GetMapping("/api/worker-cv/all")
    public ResponseEntity<List<WorkerCvResponse>> getAllCvs(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can view all worker CVs.");
        }
        return ResponseEntity.ok(workerCvService.getAllCvs());
    }

    @GetMapping("/api/worker-cv/monitor")
    public ResponseEntity<List<WorkerMonitorEntry>> getWorkersForMonitor(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can access the worker monitor.");
        }
        return ResponseEntity.ok(workerCvService.getWorkersForMonitor());
    }

    @PatchMapping("/api/worker-cv/{workerId}/ban")
    public ResponseEntity<Void> setBanStatus(
            @PathVariable String workerId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can ban or unban workers.");
        }
        Object val = body.get("banned");
        if (val == null) {
            throw new IllegalArgumentException("Missing 'banned' field.");
        }
        workerCvService.setBanStatus(workerId, Boolean.parseBoolean(val.toString()));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/worker-cv/{workerId}/approval")
    public ResponseEntity<Void> updateApproval(
            @PathVariable String workerId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can approve or reject workers.");
        }
        String status = body.get("approvalStatus");
        if (!List.of("APPROVED", "REJECTED", "PENDING").contains(status)) {
            throw new IllegalArgumentException("Invalid approval status.");
        }
        workerCvService.updateApprovalStatus(workerId, status);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/internal/worker-cv/all")
    public ResponseEntity<List<WorkerCvResponse>> getAllCvsInternal(
            @RequestHeader("X-Internal-Key") String key) {
        validateKey(key);
        return ResponseEntity.ok(workerCvService.getAllCvs());
    }

    @GetMapping("/api/internal/worker-cv/{workerId}")
    public ResponseEntity<WorkerCvResponse> getWorkerCvInternal(
            @PathVariable String workerId,
            @RequestHeader("X-Internal-Key") String key) {
        validateKey(key);
        return ResponseEntity.ok(workerCvService.getWorkerCv(workerId));
    }

    @PatchMapping("/api/internal/worker-cv/{workerId}/rating")
    public ResponseEntity<Void> updateRating(
            @PathVariable String workerId,
            @RequestHeader("X-Internal-Key") String key,
            @RequestBody Map<String, Object> body) {
        validateKey(key);
        double score = Double.parseDouble(body.get("ratingScore").toString());
        String reasoning = body.get("ratingReasoning") != null ? body.get("ratingReasoning").toString() : null;
        workerCvService.updateRatingScore(workerId, score, reasoning);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/internal/worker-cv/{workerId}/stats")
    public ResponseEntity<Void> updateStats(
            @PathVariable String workerId,
            @RequestHeader("X-Internal-Key") String key,
            @RequestBody Map<String, Object> body) {
        validateKey(key);
        if (body.containsKey("incrementCompletedProjects")) {
            workerCvService.incrementCompletedProjects(workerId);
        }
        if (body.containsKey("incrementPastFailures")) {
            workerCvService.incrementPastFailures(workerId);
        }
        return ResponseEntity.noContent().build();
    }

    private void validateKey(String key) {
        if (!internalApiKey.equals(key)) {
            throw new ForbiddenException("Invalid internal API key.");
        }
    }
}
