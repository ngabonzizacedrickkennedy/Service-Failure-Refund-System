package com.example.User_Management_Service.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_provider_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String organizationName;

    private String industry;

    private String country;

    private String city;

    private String website;

    private String contactDetails;
}