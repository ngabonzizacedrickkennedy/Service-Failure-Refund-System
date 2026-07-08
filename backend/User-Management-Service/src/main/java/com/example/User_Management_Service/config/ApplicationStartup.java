package com.example.User_Management_Service.config;

import com.example.User_Management_Service.model.Role;
import com.example.User_Management_Service.model.User;
import com.example.User_Management_Service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class ApplicationStartup {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedAdmin() {
        return args -> {
            if (!userRepository.existsByEmail("cedrickngabo03@gmail.com")) {
                userRepository.save(User.builder()
                        .fullName("Cedrick Ngabonziza Kennedy")
                        .email("cedrickngabo03@gmail.com")
                        .password(passwordEncoder.encode("Admin@123"))
                        .phone("+250788000001")
                        .role(Role.ADMIN)
                        .active(true)
                        .locked(false)
                        .build());
            }
        };
    }
}