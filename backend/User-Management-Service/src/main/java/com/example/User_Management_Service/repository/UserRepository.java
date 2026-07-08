package com.example.User_Management_Service.repository;

import com.example.User_Management_Service.model.Role;
import com.example.User_Management_Service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findAllByRole(Role role);

    List<User> findAllByActiveTrue();
}