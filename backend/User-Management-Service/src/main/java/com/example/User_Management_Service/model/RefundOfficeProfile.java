package com.example.User_Management_Service.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "refund_office_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundOfficeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String staffName;

    private String department;

    private String contactDetails;
}