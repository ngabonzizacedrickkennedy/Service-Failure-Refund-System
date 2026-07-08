package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.Claim;
import com.example.ProjectWorker_Execution_Service.model.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ClaimRepository extends JpaRepository<Claim, String> {

    List<Claim> findAllByProviderIdOrderByCreatedAtDesc(String providerId);

    List<Claim> findAllByWorkerIdOrderByCreatedAtDesc(String workerId);

    Optional<Claim> findByProjectId(String projectId);

    boolean existsByProjectIdAndStatusNotIn(String projectId, List<ClaimStatus> statuses);

    List<Claim> findAllByStatusOrderByCreatedAtDesc(ClaimStatus status);

    @Query("SELECT DISTINCT c.workerId FROM Claim c")
    List<String> findDistinctWorkerIds();
}
