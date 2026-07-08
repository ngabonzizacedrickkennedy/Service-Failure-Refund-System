package com.example.Evaluation_Decision_Service.controller;

import com.example.Evaluation_Decision_Service.dto.EvaluatorClaimResponse;
import com.example.Evaluation_Decision_Service.security.UserPrincipal;
import com.example.Evaluation_Decision_Service.service.EvaluatorClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluator/claims")
@RequiredArgsConstructor
public class EvaluatorClaimController {

    private final EvaluatorClaimService evaluatorClaimService;

    @GetMapping
    public ResponseEntity<List<EvaluatorClaimResponse>> getAllClaims(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(evaluatorClaimService.getAllClaims(status, principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluatorClaimResponse> getClaimById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(evaluatorClaimService.getClaimById(id, principal));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<EvaluatorClaimResponse> approveClaim(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(evaluatorClaimService.approveClaim(id, principal));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<EvaluatorClaimResponse> rejectClaim(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(evaluatorClaimService.rejectClaim(id, principal));
    }

}
