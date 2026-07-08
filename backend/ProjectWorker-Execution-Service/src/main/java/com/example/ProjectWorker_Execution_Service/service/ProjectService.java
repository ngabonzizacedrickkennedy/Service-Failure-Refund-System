package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.ProjectResponse;
import com.example.ProjectWorker_Execution_Service.dto.RankedWorkerResponse;
import com.example.ProjectWorker_Execution_Service.model.ProjectCategory;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ProjectService {

    ProjectResponse createProject(String title, String scopeOfWork, String requiredSkills,
                                   ProjectCategory category, String constructionLocation,
                                   LocalDate deadline, BigDecimal budget,
                                   List<MultipartFile> images, List<String> imageDescriptions,
                                   UserPrincipal principal);

    List<ProjectResponse> getMyProjects(UserPrincipal principal);

    List<ProjectResponse> getAllProjects(UserPrincipal principal);

    List<ProjectResponse> getOpenProjects();

    List<ProjectResponse> getAssignedProjects(UserPrincipal principal);

    ProjectResponse getProjectById(String projectId, UserPrincipal principal);

    ProjectResponse markCompleted(String projectId, UserPrincipal principal);

    ProjectResponse markFailed(String projectId, UserPrincipal principal);

    List<RankedWorkerResponse> getRankedCandidates(String projectId, UserPrincipal principal);

    ProjectResponse assignWorker(String projectId, String workerId, UserPrincipal principal);

    ProjectResponse repostProject(String projectId, UserPrincipal principal);
}
