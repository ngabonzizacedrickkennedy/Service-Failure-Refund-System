package com.example.User_Management_Service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

public class ProfileDtos {

    @Getter @Setter
    public static class ProjectProviderProfileRequest {
        @NotBlank(message = "Organization name is required")
        private String organizationName;
        private String industry;
        private String country;
        private String city;
        private String website;
        private String contactDetails;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ProjectProviderProfileResponse {
        private String id;
        private String userId;
        private String organizationName;
        private String industry;
        private String country;
        private String city;
        private String website;
        private String contactDetails;
    }

    @Getter @Setter
    public static class WorkerProfileRequest {
        @NotBlank(message = "Professional title is required")
        private String professionalTitle;
        private String country;
        private String city;
        private String specialization;
        private String linkedinUrl;
        private String githubUrl;
        private String otherProfileUrl;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class WorkerProfileResponse {
        private String id;
        private String userId;
        private String professionalTitle;
        private String country;
        private String city;
        private String specialization;
        private String linkedinUrl;
        private String githubUrl;
        private String otherProfileUrl;
    }

    @Getter @Setter
    public static class EvaluatorProfileRequest {
        private String department;
        private String specialization;
        private String country;
        private String city;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class EvaluatorProfileResponse {
        private String id;
        private String userId;
        private String department;
        private String specialization;
        private String country;
        private String city;
    }

    @Getter @Setter
    public static class RefundOfficeProfileRequest {
        private String staffName;
        private String department;
        private String contactDetails;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class RefundOfficeProfileResponse {
        private String id;
        private String userId;
        private String staffName;
        private String department;
        private String contactDetails;
    }
}