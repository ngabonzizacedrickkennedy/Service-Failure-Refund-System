package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.ContractPartyDetailsRequest;
import com.example.ProjectWorker_Execution_Service.dto.ContractResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;

import java.util.List;

public interface ContractService {

    ContractResponse getOrCreateForProject(String projectId, ContractPartyDetailsRequest details, UserPrincipal principal);

    List<ContractResponse> getMyContracts(UserPrincipal principal);

    ContractResponse sign(String contractId, UserPrincipal principal);

    List<ContractResponse> getAllContracts();

    ContractResponse validate(String contractId);
}
