package com.example.User_Management_Service.repository;

import com.example.User_Management_Service.model.ProjectProviderProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectProviderProfileRepository extends JpaRepository<ProjectProviderProfile, String> {

    Optional<ProjectProviderProfile> findByUserId(String userId);

    boolean existsByUserId(String userId);
}