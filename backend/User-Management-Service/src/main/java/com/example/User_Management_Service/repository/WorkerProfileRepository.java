package com.example.User_Management_Service.repository;

import com.example.User_Management_Service.model.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, String> {

    Optional<WorkerProfile> findByUserId(String userId);

    boolean existsByUserId(String userId);
}