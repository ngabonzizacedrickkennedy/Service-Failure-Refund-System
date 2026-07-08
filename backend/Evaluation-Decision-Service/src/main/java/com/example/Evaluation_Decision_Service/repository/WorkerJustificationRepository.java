package com.example.Evaluation_Decision_Service.repository;

import com.example.Evaluation_Decision_Service.model.WorkerJustification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkerJustificationRepository extends JpaRepository<WorkerJustification, String> {
    Optional<WorkerJustification> findByClaimId(String claimId);
    List<WorkerJustification> findAllByOrderByCreatedAtDesc();
}
