package com.example.Refund_Processing_Service.repository;

import com.example.Refund_Processing_Service.model.Project;
import com.example.Refund_Processing_Service.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface ProjectRepository extends JpaRepository<Project, String> {

    /** Sum of budgets for projects currently ASSIGNED to a worker — the locked amount. */
    @Query("SELECT COALESCE(SUM(p.budget), 0) FROM Project p WHERE p.status = :status")
    BigDecimal sumBudgetByStatus(ProjectStatus status);

    /** Number of projects with the given status. */
    long countByStatus(ProjectStatus status);
}
