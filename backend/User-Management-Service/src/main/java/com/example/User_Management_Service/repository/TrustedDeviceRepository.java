package com.example.User_Management_Service.repository;

import com.example.User_Management_Service.model.TrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {

    boolean existsByUserIdAndDeviceToken(String userId, String deviceToken);
}
