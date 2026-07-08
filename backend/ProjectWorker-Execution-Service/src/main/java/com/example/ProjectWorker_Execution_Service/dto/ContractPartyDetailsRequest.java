package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ContractPartyDetailsRequest {
    private String workerName;
    private String workerEmail;
    private String workerPhone;
    private String providerName;
    private String providerEmail;
    private String providerPhone;
}
