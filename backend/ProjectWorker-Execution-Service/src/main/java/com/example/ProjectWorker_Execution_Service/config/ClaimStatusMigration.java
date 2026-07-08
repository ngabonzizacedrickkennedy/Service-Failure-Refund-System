package com.example.ProjectWorker_Execution_Service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClaimStatusMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_status_check");
            jdbcTemplate.execute(
                "ALTER TABLE claims ADD CONSTRAINT claims_status_check " +
                "CHECK (status IN ('PENDING','UNDER_REVIEW','APPROVED','REJECTED','REFUND_INITIATED','REFUNDED'))"
            );
            log.info("[Migration] claims_status_check constraint updated successfully.");
        } catch (Exception e) {
            log.warn("[Migration] Could not update claims_status_check: {}", e.getMessage());
        }
    }
}
