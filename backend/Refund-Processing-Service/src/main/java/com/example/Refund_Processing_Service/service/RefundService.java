package com.example.Refund_Processing_Service.service;

import com.example.Refund_Processing_Service.dto.ClaimResponse;
import com.example.Refund_Processing_Service.security.UserPrincipal;

import java.util.List;

public interface RefundService {

    ClaimResponse initiateRefund(String claimId, UserPrincipal principal);

    List<ClaimResponse> getRefundPendingClaims(UserPrincipal principal);

    List<ClaimResponse> getRefundedClaims(UserPrincipal principal);

    ClaimResponse processRefund(String claimId, UserPrincipal principal);
}
