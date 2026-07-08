package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, String> {

    List<BankAccount> findAllByUserIdOrderByCreatedAtDesc(String userId);

    Optional<BankAccount> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);
}
