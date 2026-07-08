package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.WorkerJustification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkerJustificationRepository extends JpaRepository<WorkerJustification, String> {
    Optional<WorkerJustification> findByClaimId(String claimId);
    boolean existsByClaimId(String claimId);
}
