package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findAllByProviderIdOrderByCreatedAtDesc(String providerId);

    List<Project> findAllByAssignedWorkerIdOrderByCreatedAtDesc(String workerId);

    List<Project> findAllByStatus(ProjectStatus status);

    List<Project> findAllByStatusAndFunded(ProjectStatus status, Boolean funded);
}
