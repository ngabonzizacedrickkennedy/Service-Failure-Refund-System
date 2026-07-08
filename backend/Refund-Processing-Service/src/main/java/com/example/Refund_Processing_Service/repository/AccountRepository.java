package com.example.Refund_Processing_Service.repository;

import com.example.Refund_Processing_Service.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, String> {

    Optional<Account> findByUserId(String userId);

    boolean existsByAccountNumber(String accountNumber);

    long countByBalanceGreaterThan(BigDecimal amount);

    /** Total money held across all accounts in the system. */
    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a")
    BigDecimal sumAllBalances();

    /** Number of accounts that currently hold funds. */
    @Query("SELECT COUNT(a) FROM Account a WHERE a.balance > 0")
    long countAccountsWithFunds();
}
