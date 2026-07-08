package com.example.Evaluation_Decision_Service.repository;

import com.example.Evaluation_Decision_Service.model.Claim;
import com.example.Evaluation_Decision_Service.model.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, String> {
    List<Claim> findAllByStatusOrderByCreatedAtDesc(ClaimStatus status);
    List<Claim> findAllByOrderByCreatedAtDesc();
}
