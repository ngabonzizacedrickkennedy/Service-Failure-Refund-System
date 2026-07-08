package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.ContractPartyDetailsRequest;
import com.example.ProjectWorker_Execution_Service.dto.ContractResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping("/my")
    public ResponseEntity<List<ContractResponse>> getMyContracts(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(contractService.getMyContracts(principal));
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<ContractResponse> getOrCreateForProject(
            @PathVariable String projectId,
            @RequestBody(required = false) ContractPartyDetailsRequest details,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(contractService.getOrCreateForProject(projectId, details, principal));
    }

    @PatchMapping("/{contractId}/sign")
    public ResponseEntity<ContractResponse> sign(
            @PathVariable String contractId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(contractService.sign(contractId, principal));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ContractResponse>> getAllContracts(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can view all contracts.");
        }
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    @PatchMapping("/{contractId}/validate")
    public ResponseEntity<ContractResponse> validate(
            @PathVariable String contractId,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can validate contracts.");
        }
        return ResponseEntity.ok(contractService.validate(contractId));
    }
}
