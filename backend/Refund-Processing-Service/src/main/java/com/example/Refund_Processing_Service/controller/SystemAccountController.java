package com.example.Refund_Processing_Service.controller;

import com.example.Refund_Processing_Service.model.ProjectStatus;
import com.example.Refund_Processing_Service.repository.AccountRepository;
import com.example.Refund_Processing_Service.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemAccountController {

    private final AccountRepository accountRepository;
    private final ProjectRepository projectRepository;

    @GetMapping("/account")
    @PreAuthorize("hasAuthority('REFUND_OFFICE') or hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemAccount() {
        // Locked amount = sum of budgets of all ASSIGNED projects
        // (money that is locked because a worker is currently working on them)
        BigDecimal lockedAmount    = projectRepository.sumBudgetByStatus(ProjectStatus.ASSIGNED);
        long assignedProjects      = projectRepository.countByStatus(ProjectStatus.ASSIGNED);
        long totalAccounts         = accountRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalBlockedAmount",       lockedAmount != null ? lockedAmount : BigDecimal.ZERO,
                "accountsWithPendingFunds", assignedProjects,
                "totalAccounts",            totalAccounts
        ));
    }
}
