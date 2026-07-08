package com.example.Evaluation_Decision_Service.service;

import com.example.Evaluation_Decision_Service.dto.EvaluatorClaimResponse;
import com.example.Evaluation_Decision_Service.security.UserPrincipal;

import java.util.List;

public interface EvaluatorClaimService {
    List<EvaluatorClaimResponse> getAllClaims(String statusFilter, UserPrincipal principal);
    EvaluatorClaimResponse getClaimById(String claimId, UserPrincipal principal);
    EvaluatorClaimResponse approveClaim(String claimId, UserPrincipal principal);
    EvaluatorClaimResponse rejectClaim(String claimId, UserPrincipal principal);
}
