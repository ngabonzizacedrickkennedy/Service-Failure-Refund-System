package com.example.User_Management_Service.service;

import com.example.User_Management_Service.dto.ProfileDtos;

public interface ProfileService {

    ProfileDtos.ProjectProviderProfileResponse saveProviderProfile(String userId, ProfileDtos.ProjectProviderProfileRequest request);

    ProfileDtos.ProjectProviderProfileResponse getProviderProfile(String userId);

    ProfileDtos.WorkerProfileResponse saveWorkerProfile(String userId, ProfileDtos.WorkerProfileRequest request);

    ProfileDtos.WorkerProfileResponse getWorkerProfile(String userId);

    ProfileDtos.EvaluatorProfileResponse saveEvaluatorProfile(String userId, ProfileDtos.EvaluatorProfileRequest request);

    ProfileDtos.EvaluatorProfileResponse getEvaluatorProfile(String userId);

    ProfileDtos.RefundOfficeProfileResponse saveRefundOfficeProfile(String userId, ProfileDtos.RefundOfficeProfileRequest request);

    ProfileDtos.RefundOfficeProfileResponse getRefundOfficeProfile(String userId);
}