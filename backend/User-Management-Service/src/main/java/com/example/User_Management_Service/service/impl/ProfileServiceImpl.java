package com.example.User_Management_Service.service.impl;

import com.example.User_Management_Service.dto.ProfileDtos;
import com.example.User_Management_Service.exception.UserNotFoundException;
import com.example.User_Management_Service.kafka.UserEventPublisher;
import com.example.User_Management_Service.model.*;
import com.example.User_Management_Service.repository.*;
import com.example.User_Management_Service.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final ProjectProviderProfileRepository providerProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EvaluatorProfileRepository evaluatorProfileRepository;
    private final RefundOfficeProfileRepository refundOfficeProfileRepository;
    private final UserEventPublisher userEventPublisher;

    @Override
    @CacheEvict(value = "profiles-provider", key = "#userId")
    public ProfileDtos.ProjectProviderProfileResponse saveProviderProfile(String userId, ProfileDtos.ProjectProviderProfileRequest request) {
        ProfileDtos.ProjectProviderProfileResponse response = saveProviderProfileTransactional(userId, request);
        userEventPublisher.publishProjectProviderProfileSaved(userId);
        return response;
    }

    @Transactional
    protected ProfileDtos.ProjectProviderProfileResponse saveProviderProfileTransactional(String userId, ProfileDtos.ProjectProviderProfileRequest request) {
        User user = findUserById(userId);
        ProjectProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElse(ProjectProviderProfile.builder().user(user).build());
        profile.setOrganizationName(request.getOrganizationName());
        profile.setIndustry(request.getIndustry());
        profile.setCountry(request.getCountry());
        profile.setCity(request.getCity());
        profile.setWebsite(request.getWebsite());
        profile.setContactDetails(request.getContactDetails());
        providerProfileRepository.save(profile);
        return mapToProviderResponse(profile);
    }

    @Override
    @Cacheable(value = "profiles-provider", key = "#userId")
    public ProfileDtos.ProjectProviderProfileResponse getProviderProfile(String userId) {
        ProjectProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Provider profile not found for user: " + userId));
        return mapToProviderResponse(profile);
    }

    @Override
    @CacheEvict(value = "profiles-worker", key = "#userId")
    public ProfileDtos.WorkerProfileResponse saveWorkerProfile(String userId, ProfileDtos.WorkerProfileRequest request) {
        ProfileDtos.WorkerProfileResponse response = saveWorkerProfileTransactional(userId, request);
        userEventPublisher.publishWorkerProfileSaved(userId);
        return response;
    }

    @Transactional
    protected ProfileDtos.WorkerProfileResponse saveWorkerProfileTransactional(String userId, ProfileDtos.WorkerProfileRequest request) {
        User user = findUserById(userId);
        WorkerProfile profile = workerProfileRepository.findByUserId(userId)
                .orElse(WorkerProfile.builder().user(user).build());
        profile.setProfessionalTitle(request.getProfessionalTitle());
        profile.setCountry(request.getCountry());
        profile.setCity(request.getCity());
        profile.setSpecialization(request.getSpecialization());
        profile.setLinkedinUrl(request.getLinkedinUrl());
        profile.setGithubUrl(request.getGithubUrl());
        profile.setOtherProfileUrl(request.getOtherProfileUrl());
        workerProfileRepository.save(profile);
        return mapToWorkerResponse(profile);
    }

    @Override
    @Cacheable(value = "profiles-worker", key = "#userId")
    public ProfileDtos.WorkerProfileResponse getWorkerProfile(String userId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Worker profile not found for user: " + userId));
        return mapToWorkerResponse(profile);
    }

    @Override
    @Transactional
    @CacheEvict(value = "profiles-evaluator", key = "#userId")
    public ProfileDtos.EvaluatorProfileResponse saveEvaluatorProfile(String userId, ProfileDtos.EvaluatorProfileRequest request) {
        User user = findUserById(userId);
        EvaluatorProfile profile = evaluatorProfileRepository.findByUserId(userId)
                .orElse(EvaluatorProfile.builder().user(user).build());
        profile.setDepartment(request.getDepartment());
        profile.setSpecialization(request.getSpecialization());
        profile.setCountry(request.getCountry());
        profile.setCity(request.getCity());
        evaluatorProfileRepository.save(profile);
        return mapToEvaluatorResponse(profile);
    }

    @Override
    @Cacheable(value = "profiles-evaluator", key = "#userId")
    public ProfileDtos.EvaluatorProfileResponse getEvaluatorProfile(String userId) {
        EvaluatorProfile profile = evaluatorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Evaluator profile not found for user: " + userId));
        return mapToEvaluatorResponse(profile);
    }

    @Override
    @Transactional
    @CacheEvict(value = "profiles-refund-office", key = "#userId")
    public ProfileDtos.RefundOfficeProfileResponse saveRefundOfficeProfile(String userId, ProfileDtos.RefundOfficeProfileRequest request) {
        User user = findUserById(userId);
        RefundOfficeProfile profile = refundOfficeProfileRepository.findByUserId(userId)
                .orElse(RefundOfficeProfile.builder().user(user).build());
        profile.setStaffName(request.getStaffName());
        profile.setDepartment(request.getDepartment());
        profile.setContactDetails(request.getContactDetails());
        refundOfficeProfileRepository.save(profile);
        return mapToRefundOfficeResponse(profile);
    }

    @Override
    @Cacheable(value = "profiles-refund-office", key = "#userId")
    public ProfileDtos.RefundOfficeProfileResponse getRefundOfficeProfile(String userId) {
        RefundOfficeProfile profile = refundOfficeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException("Refund office profile not found for user: " + userId));
        return mapToRefundOfficeResponse(profile);
    }

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
    }

    private ProfileDtos.ProjectProviderProfileResponse mapToProviderResponse(ProjectProviderProfile profile) {
        return ProfileDtos.ProjectProviderProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .organizationName(profile.getOrganizationName())
                .industry(profile.getIndustry())
                .country(profile.getCountry())
                .city(profile.getCity())
                .website(profile.getWebsite())
                .contactDetails(profile.getContactDetails())
                .build();
    }

    private ProfileDtos.WorkerProfileResponse mapToWorkerResponse(WorkerProfile profile) {
        return ProfileDtos.WorkerProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .professionalTitle(profile.getProfessionalTitle())
                .country(profile.getCountry())
                .city(profile.getCity())
                .specialization(profile.getSpecialization())
                .linkedinUrl(profile.getLinkedinUrl())
                .githubUrl(profile.getGithubUrl())
                .otherProfileUrl(profile.getOtherProfileUrl())
                .build();
    }

    private ProfileDtos.EvaluatorProfileResponse mapToEvaluatorResponse(EvaluatorProfile profile) {
        return ProfileDtos.EvaluatorProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .department(profile.getDepartment())
                .specialization(profile.getSpecialization())
                .country(profile.getCountry())
                .city(profile.getCity())
                .build();
    }

    private ProfileDtos.RefundOfficeProfileResponse mapToRefundOfficeResponse(RefundOfficeProfile profile) {
        return ProfileDtos.RefundOfficeProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .staffName(profile.getStaffName())
                .department(profile.getDepartment())
                .contactDetails(profile.getContactDetails())
                .build();
    }
}
