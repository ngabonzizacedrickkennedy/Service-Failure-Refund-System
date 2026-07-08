package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, String> {

    Optional<Contract> findByProjectId(String projectId);

    List<Contract> findByWorkerIdOrderByCreatedAtDesc(String workerId);

    List<Contract> findByProviderIdOrderByCreatedAtDesc(String providerId);

    List<Contract> findAllByOrderByCreatedAtDesc();
}
