package com.example.User_Management_Service.controller;

import com.example.User_Management_Service.dto.AdminMessageRequest;
import com.example.User_Management_Service.dto.CreateAdminUserRequest;
import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/providers")
    public ResponseEntity<List<UserResponse>> getAllProviders() {
        return ResponseEntity.ok(userService.getProviders());
    }

    @PostMapping("/message-provider")
    public ResponseEntity<Void> sendMessageToProvider(@Valid @RequestBody AdminMessageRequest request) {
        userService.sendMessageToProvider(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createRestrictedUser(@Valid @RequestBody CreateAdminUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createRestrictedUser(request));
    }

    @PatchMapping("/users/{userId}/activate")
    public ResponseEntity<UserResponse> activateUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.activateUser(userId));
    }

    @PatchMapping("/users/{userId}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.deactivateUser(userId));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}