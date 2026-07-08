package com.example.Refund_Processing_Service.repository;

import com.example.Refund_Processing_Service.model.Claim;
import com.example.Refund_Processing_Service.model.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, String> {

    List<Claim> findAllByStatusOrderByCreatedAtDesc(ClaimStatus status);
}
