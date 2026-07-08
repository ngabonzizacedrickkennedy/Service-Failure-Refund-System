package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.ProjectImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectImageRepository extends JpaRepository<ProjectImage, String> {

    List<ProjectImage> findAllByProjectIdOrderByDisplayOrderAsc(String projectId);

    void deleteAllByProjectId(String projectId);
}
