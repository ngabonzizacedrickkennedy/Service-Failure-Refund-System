package com.example.User_Management_Service.repository;

import com.example.User_Management_Service.model.EvaluatorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EvaluatorProfileRepository extends JpaRepository<EvaluatorProfile, String> {

    Optional<EvaluatorProfile> findByUserId(String userId);

    boolean existsByUserId(String userId);
}