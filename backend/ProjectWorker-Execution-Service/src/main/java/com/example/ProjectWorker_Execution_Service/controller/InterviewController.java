package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.InterviewRequest;
import com.example.ProjectWorker_Execution_Service.dto.InterviewResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping
    public ResponseEntity<InterviewResponse> submitInterview(
            @RequestBody InterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interviewService.submitInterview(request, principal));
    }

    @GetMapping("/my")
    public ResponseEntity<InterviewResponse> getMyInterview(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(interviewService.getMyInterview(principal));
    }

    @GetMapping("/all")
    public ResponseEntity<List<InterviewResponse>> getAllInterviews(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can view all interviews.");
        }
        return ResponseEntity.ok(interviewService.getAllInterviews());
    }

    @PatchMapping("/{id}/score")
    public ResponseEntity<InterviewResponse> scoreInterview(
            @PathVariable String id,
            @RequestBody Map<String, Double> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can score interviews.");
        }
        double score = body.getOrDefault("score", 0.0);
        return ResponseEntity.ok(interviewService.scoreInterview(id, score));
    }

    @PostMapping("/{id}/ai-score")
    public ResponseEntity<InterviewResponse> aiScoreInterview(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can trigger AI scoring.");
        }
        return ResponseEntity.ok(interviewService.aiScoreInterview(id));
    }
}
