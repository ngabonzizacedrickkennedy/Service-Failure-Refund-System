package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.ProjectResponse;
import com.example.ProjectWorker_Execution_Service.dto.RankedWorkerResponse;
import com.example.ProjectWorker_Execution_Service.model.ProjectCategory;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ProjectResponse> createProject(
            @RequestParam("title") String title,
            @RequestParam("scopeOfWork") String scopeOfWork,
            @RequestParam("requiredSkills") String requiredSkills,
            @RequestParam("category") String category,
            @RequestParam(value = "constructionLocation", required = false) String constructionLocation,
            @RequestParam("deadline") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deadline,
            @RequestParam("budget") BigDecimal budget,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "imageDescriptions", required = false) List<String> imageDescriptions,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectCategory projectCategory = ProjectCategory.valueOf(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                projectService.createProject(title, scopeOfWork, requiredSkills,
                        projectCategory, constructionLocation, deadline, budget, images, imageDescriptions, principal));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getMyProjects(principal));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProjectResponse>> getAllProjects(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getAllProjects(principal));
    }

    @GetMapping("/open")
    public ResponseEntity<List<ProjectResponse>> getOpenProjects() {
        return ResponseEntity.ok(projectService.getOpenProjects());
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<ProjectResponse>> getAssignedProjects(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getAssignedProjects(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getProjectById(id, principal));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ProjectResponse> markCompleted(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.markCompleted(id, principal));
    }

    @PatchMapping("/{id}/fail")
    public ResponseEntity<ProjectResponse> markFailed(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.markFailed(id, principal));
    }

    @GetMapping("/{id}/candidates")
    public ResponseEntity<List<RankedWorkerResponse>> getCandidates(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getRankedCandidates(id, principal));
    }

    @PostMapping("/{id}/assign/{workerId}")
    public ResponseEntity<ProjectResponse> assignWorker(
            @PathVariable String id,
            @PathVariable String workerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.assignWorker(id, workerId, principal));
    }

    @PostMapping("/{id}/repost")
    public ResponseEntity<ProjectResponse> repostProject(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.repostProject(id, principal));
    }
}
