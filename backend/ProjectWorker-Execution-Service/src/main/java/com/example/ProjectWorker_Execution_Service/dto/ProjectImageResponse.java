package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

@Getter
@Builder
@Jacksonized
public class ProjectImageResponse {
    private String id;
    private String imageUrl;
    private String description;
    private int displayOrder;
}
