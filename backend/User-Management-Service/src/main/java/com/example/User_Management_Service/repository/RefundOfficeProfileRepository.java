package com.example.User_Management_Service.repository;

import com.example.User_Management_Service.model.RefundOfficeProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefundOfficeProfileRepository extends JpaRepository<RefundOfficeProfile, String> {

    Optional<RefundOfficeProfile> findByUserId(String userId);

    boolean existsByUserId(String userId);
}