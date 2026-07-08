package com.example.Evaluation_Decision_Service.repository;

import com.example.Evaluation_Decision_Service.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, String> {
}
