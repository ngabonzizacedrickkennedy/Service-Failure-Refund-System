package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.ContractPartyDetailsRequest;
import com.example.ProjectWorker_Execution_Service.dto.ContractResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.model.Contract;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.WorkerCv;
import com.example.ProjectWorker_Execution_Service.repository.ContractRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.repository.WorkerCvRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final ProjectRepository projectRepository;
    private final WorkerCvRepository workerCvRepository;

    @Override
    @Transactional
    public ContractResponse getOrCreateForProject(String projectId, ContractPartyDetailsRequest details, UserPrincipal principal) {
        return contractRepository.findByProjectId(projectId)
                .map(c -> {
                    if (details != null) {
                        applyDetails(c, details);
                        contractRepository.save(c);
                    }
                    return toResponse(c);
                })
                .orElseGet(() -> {
                    Project project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
                    if (project.getAssignedWorkerId() == null) {
                        throw new ForbiddenException("No worker has been assigned to this project yet.");
                    }

                    String workerName  = "Worker";
                    String workerEmail = null;
                    WorkerCv cv = workerCvRepository.findByWorkerId(project.getAssignedWorkerId()).orElse(null);
                    if (cv != null) {
                        workerName  = cv.getWorkerName();
                        workerEmail = cv.getWorkerEmail();
                    }

                    Contract c = Contract.builder()
                            .projectId(projectId)
                            .projectTitle(project.getTitle())
                            .workerId(project.getAssignedWorkerId())
                            .workerName(workerName)
                            .workerEmail(workerEmail)
                            .providerId(project.getProviderId())
                            .providerName(principal.getEmail())
                            .providerEmail(principal.getEmail())
                            .build();

                    if (details != null) applyDetails(c, details);
                    contractRepository.save(c);
                    return toResponse(c);
                });
    }

    private void applyDetails(Contract c, ContractPartyDetailsRequest d) {
        if (notBlank(d.getWorkerName()))   c.setWorkerName(d.getWorkerName());
        if (notBlank(d.getWorkerEmail()))  c.setWorkerEmail(d.getWorkerEmail());
        if (notBlank(d.getWorkerPhone()))  c.setWorkerPhone(d.getWorkerPhone());
        if (notBlank(d.getProviderName())) c.setProviderName(d.getProviderName());
        if (notBlank(d.getProviderEmail())) c.setProviderEmail(d.getProviderEmail());
        if (notBlank(d.getProviderPhone())) c.setProviderPhone(d.getProviderPhone());
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    @Override
    public List<ContractResponse> getMyContracts(UserPrincipal principal) {
        String role = principal.getRole();
        if ("WORKER".equals(role)) {
            return contractRepository.findByWorkerIdOrderByCreatedAtDesc(principal.getUserId())
                    .stream().map(this::toResponse).collect(Collectors.toList());
        } else if ("PROVIDER".equals(role)) {
            return contractRepository.findByProviderIdOrderByCreatedAtDesc(principal.getUserId())
                    .stream().map(this::toResponse).collect(Collectors.toList());
        }
        return List.of();
    }

    @Override
    @Transactional
    public ContractResponse sign(String contractId, UserPrincipal principal) {
        Contract c = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        String role = principal.getRole();

        if ("WORKER".equals(role)) {
            if (!principal.getUserId().equals(c.getWorkerId())) {
                throw new ForbiddenException("You are not the assigned worker for this contract.");
            }
            c.setWorkerSigned(true);
            c.setWorkerSignedAt(LocalDateTime.now());
        } else if ("PROVIDER".equals(role)) {
            if (!principal.getUserId().equals(c.getProviderId())) {
                throw new ForbiddenException("You are not the provider for this contract.");
            }
            c.setProviderSigned(true);
            c.setProviderSignedAt(LocalDateTime.now());
        } else {
            throw new ForbiddenException("Only workers and providers can sign contracts.");
        }
        contractRepository.save(c);
        return toResponse(c);
    }

    @Override
    public List<ContractResponse> getAllContracts() {
        return contractRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContractResponse validate(String contractId) {
        Contract c = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        if (!c.isWorkerSigned() || !c.isProviderSigned()) {
            throw new ForbiddenException("Both parties must sign before admin can validate.");
        }
        c.setAdminValidated(true);
        c.setValidatedAt(LocalDateTime.now());
        contractRepository.save(c);
        return toResponse(c);
    }

    private ContractResponse toResponse(Contract c) {
        return ContractResponse.builder()
                .id(c.getId())
                .projectId(c.getProjectId())
                .projectTitle(c.getProjectTitle())
                .workerId(c.getWorkerId())
                .workerName(c.getWorkerName())
                .workerEmail(c.getWorkerEmail())
                .workerPhone(c.getWorkerPhone())
                .providerId(c.getProviderId())
                .providerName(c.getProviderName())
                .providerEmail(c.getProviderEmail())
                .providerPhone(c.getProviderPhone())
                .workerSigned(c.isWorkerSigned())
                .workerSignedAt(c.getWorkerSignedAt())
                .providerSigned(c.isProviderSigned())
                .providerSignedAt(c.getProviderSignedAt())
                .adminValidated(c.isAdminValidated())
                .validatedAt(c.getValidatedAt())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
