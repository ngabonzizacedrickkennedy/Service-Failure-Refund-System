package com.example.User_Management_Service.controller;

import com.example.User_Management_Service.dto.ProfileDtos;
import com.example.User_Management_Service.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PutMapping("/provider/{userId}")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<ProfileDtos.ProjectProviderProfileResponse> saveProviderProfile(
            @PathVariable String userId,
            @Valid @RequestBody ProfileDtos.ProjectProviderProfileRequest request) {
        return ResponseEntity.ok(profileService.saveProviderProfile(userId, request));
    }

    @GetMapping("/provider/{userId}")
    public ResponseEntity<ProfileDtos.ProjectProviderProfileResponse> getProviderProfile(
            @PathVariable String userId) {
        return ResponseEntity.ok(profileService.getProviderProfile(userId));
    }

    @PutMapping("/worker/{userId}")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<ProfileDtos.WorkerProfileResponse> saveWorkerProfile(
            @PathVariable String userId,
            @Valid @RequestBody ProfileDtos.WorkerProfileRequest request) {
        return ResponseEntity.ok(profileService.saveWorkerProfile(userId, request));
    }

    @GetMapping("/worker/{userId}")
    public ResponseEntity<ProfileDtos.WorkerProfileResponse> getWorkerProfile(
            @PathVariable String userId) {
        return ResponseEntity.ok(profileService.getWorkerProfile(userId));
    }

    @PutMapping("/evaluator/{userId}")
    @PreAuthorize("hasRole('EVALUATOR')")
    public ResponseEntity<ProfileDtos.EvaluatorProfileResponse> saveEvaluatorProfile(
            @PathVariable String userId,
            @Valid @RequestBody ProfileDtos.EvaluatorProfileRequest request) {
        return ResponseEntity.ok(profileService.saveEvaluatorProfile(userId, request));
    }

    @GetMapping("/evaluator/{userId}")
    public ResponseEntity<ProfileDtos.EvaluatorProfileResponse> getEvaluatorProfile(
            @PathVariable String userId) {
        return ResponseEntity.ok(profileService.getEvaluatorProfile(userId));
    }

    @PutMapping("/refund-office/{userId}")
    @PreAuthorize("hasRole('REFUND_OFFICE')")
    public ResponseEntity<ProfileDtos.RefundOfficeProfileResponse> saveRefundOfficeProfile(
            @PathVariable String userId,
            @Valid @RequestBody ProfileDtos.RefundOfficeProfileRequest request) {
        return ResponseEntity.ok(profileService.saveRefundOfficeProfile(userId, request));
    }

    @GetMapping("/refund-office/{userId}")
    public ResponseEntity<ProfileDtos.RefundOfficeProfileResponse> getRefundOfficeProfile(
            @PathVariable String userId) {
        return ResponseEntity.ok(profileService.getRefundOfficeProfile(userId));
    }
}