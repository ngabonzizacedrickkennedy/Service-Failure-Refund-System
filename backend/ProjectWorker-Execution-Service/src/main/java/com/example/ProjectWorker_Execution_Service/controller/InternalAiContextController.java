package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Internal endpoints consumed by the AI Chat Service for live system context.
 * All paths are under /api/internal/** which is permit-all in SecurityConfig.
 * Protected by X-Internal-Key header check inside each handler.
 */
@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
public class InternalAiContextController {

    private final ProjectRepository projectRepository;

    @Value("${internal.api-key}")
    private String internalApiKey;

    private boolean authorized(String key) {
        return internalApiKey.equals(key);
    }

    /** All open projects — used to give workers context about available work. */
    @GetMapping("/open-projects")
    public ResponseEntity<List<Map<String, Object>>> getOpenProjects(
            @RequestHeader(value = "X-Internal-Key", required = false) String key) {
        if (!authorized(key)) return ResponseEntity.status(403).build();

        List<Map<String, Object>> result = projectRepository
                .findAllByStatus(ProjectStatus.OPEN)
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Worker-specific context: their assigned project(s) + open projects they could apply for.
     * Called by AI chat to answer "am I assigned to a project?" type questions.
     */
    @GetMapping("/worker-context/{workerId}")
    public ResponseEntity<Map<String, Object>> getWorkerContext(
            @PathVariable String workerId,
            @RequestHeader(value = "X-Internal-Key", required = false) String key) {
        if (!authorized(key)) return ResponseEntity.status(403).build();

        List<Map<String, Object>> assigned = projectRepository
                .findAllByAssignedWorkerIdOrderByCreatedAtDesc(workerId)
                .stream()
                .map(this::toDetailedSummary)
                .collect(Collectors.toList());

        List<Map<String, Object>> open = projectRepository
                .findAllByStatus(ProjectStatus.OPEN)
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "assignedProjects", assigned,
                "openProjects",     open
        ));
    }

    /** Provider-specific context: their projects with current status and worker info. */
    @GetMapping("/provider-context/{providerId}")
    public ResponseEntity<Map<String, Object>> getProviderContext(
            @PathVariable String providerId,
            @RequestHeader(value = "X-Internal-Key", required = false) String key) {
        if (!authorized(key)) return ResponseEntity.status(403).build();

        List<Map<String, Object>> projects = projectRepository
                .findAllByProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .map(this::toDetailedSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("myProjects", projects));
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private Map<String, Object> toSummary(Project p) {
        return Map.of(
                "id",                   p.getId(),
                "title",                safe(p.getTitle()),
                "category",             p.getCategory() != null ? p.getCategory().name() : "General",
                "budget",               p.getBudget() != null ? p.getBudget().toPlainString() : "0",
                "requiredSkills",       safe(p.getRequiredSkills()),
                "constructionLocation", safe(p.getConstructionLocation()),
                "deadline",             p.getDeadline() != null ? p.getDeadline().toString() : ""
        );
    }

    private Map<String, Object> toDetailedSummary(Project p) {
        return Map.of(
                "id",                   p.getId(),
                "title",                safe(p.getTitle()),
                "category",             p.getCategory() != null ? p.getCategory().name() : "General",
                "status",               p.getStatus().name(),
                "budget",               p.getBudget() != null ? p.getBudget().toPlainString() : "0",
                "requiredSkills",       safe(p.getRequiredSkills()),
                "constructionLocation", safe(p.getConstructionLocation()),
                "deadline",             p.getDeadline() != null ? p.getDeadline().toString() : "",
                "assignedWorkerId",     safe(p.getAssignedWorkerId()),
                "scopeOfWork",          safe(p.getScopeOfWork())
        );
    }

    private String safe(String s) { return s != null ? s : ""; }
}
