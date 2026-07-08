package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.AccountResponse;
import com.example.ProjectWorker_Execution_Service.dto.BankAccountRequest;
import com.example.ProjectWorker_Execution_Service.dto.BankAccountResponse;
import com.example.ProjectWorker_Execution_Service.dto.DepositStatusResponse;
import com.example.ProjectWorker_Execution_Service.dto.InitiateDepositRequest;
import com.example.ProjectWorker_Execution_Service.dto.InitiateDepositResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<AccountResponse> getAccount(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.getOrCreateAccount(principal));
    }

    @PostMapping("/deposit/initiate")
    public ResponseEntity<InitiateDepositResponse> initiateDeposit(
            @Valid @RequestBody InitiateDepositRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.initiateDeposit(request, principal));
    }

    @GetMapping("/deposit/{referenceId}/status")
    public ResponseEntity<DepositStatusResponse> getDepositStatus(
            @PathVariable String referenceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.getDepositStatus(referenceId, principal));
    }

    @GetMapping("/bank-accounts")
    public ResponseEntity<List<BankAccountResponse>> getBankAccounts(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.getBankAccounts(principal));
    }

    @PostMapping("/bank-accounts")
    public ResponseEntity<BankAccountResponse> addBankAccount(
            @Valid @RequestBody BankAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.addBankAccount(request, principal));
    }

    @PutMapping("/bank-accounts/{id}")
    public ResponseEntity<BankAccountResponse> updateBankAccount(
            @PathVariable String id,
            @Valid @RequestBody BankAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.updateBankAccount(id, request, principal));
    }

    @DeleteMapping("/bank-accounts/{id}")
    public ResponseEntity<Void> deleteBankAccount(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        accountService.deleteBankAccount(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/bank-accounts/{id}/default")
    public ResponseEntity<Void> setDefaultBankAccount(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        accountService.setDefaultBankAccount(id, principal);
        return ResponseEntity.ok().build();
    }
}
