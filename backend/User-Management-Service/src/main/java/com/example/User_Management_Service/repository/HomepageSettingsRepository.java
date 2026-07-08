package com.example.User_Management_Service.repository;

import com.example.User_Management_Service.model.HomepageSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HomepageSettingsRepository extends JpaRepository<HomepageSettings, String> {}
