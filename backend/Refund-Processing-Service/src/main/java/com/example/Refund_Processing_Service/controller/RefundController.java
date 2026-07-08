package com.example.Refund_Processing_Service.controller;

import com.example.Refund_Processing_Service.dto.ClaimResponse;
import com.example.Refund_Processing_Service.security.UserPrincipal;
import com.example.Refund_Processing_Service.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PatchMapping("/api/evaluator/claims/{id}/initiate-refund")
    public ResponseEntity<ClaimResponse> initiateRefund(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.initiateRefund(id, principal));
    }

    @GetMapping("/api/refund-office/claims")
    public ResponseEntity<List<ClaimResponse>> getRefundPendingClaims(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.getRefundPendingClaims(principal));
    }

    @GetMapping("/api/refund-office/claims/refunded")
    public ResponseEntity<List<ClaimResponse>> getRefundedClaims(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.getRefundedClaims(principal));
    }

    @PatchMapping("/api/refund-office/claims/{id}/process-refund")
    public ResponseEntity<ClaimResponse> processRefund(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.processRefund(id, principal));
    }
}
