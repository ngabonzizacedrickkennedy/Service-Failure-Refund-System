package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.ProjectImageResponse;
import com.example.ProjectWorker_Execution_Service.dto.ProjectResponse;
import com.example.ProjectWorker_Execution_Service.dto.RankedWorkerResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.kafka.ExecutionEventPublisher;
import com.example.ProjectWorker_Execution_Service.model.Account;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectCategory;
import com.example.ProjectWorker_Execution_Service.model.ProjectImage;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.model.WorkerCv;
import com.example.ProjectWorker_Execution_Service.model.ClaimStatus;
import com.example.ProjectWorker_Execution_Service.repository.AccountRepository;
import com.example.ProjectWorker_Execution_Service.repository.ClaimRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectImageRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.repository.WorkerCvRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ProjectService;
import com.example.ProjectWorker_Execution_Service.service.S3UploadService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectImageRepository projectImageRepository;
    private final WorkerCvRepository workerCvRepository;
    private final AccountRepository accountRepository;
    private final ClaimRepository claimRepository;
    private final S3UploadService s3UploadService;
    private final ExecutionEventPublisher eventPublisher;

    @Value("${ai.service.base-url:http://localhost:8083}")
    private String aiServiceBaseUrl;

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    // Maps each project category to keywords found in worker specialization strings
    private static final Map<ProjectCategory, List<String>> CATEGORY_WORKER_KEYWORDS =
            Map.ofEntries(
                Map.entry(ProjectCategory.SOFTWARE_DEVELOPMENT, List.of(
                        "full-stack", "frontend", "backend", "mobile", "ios", "android",
                        "devops", "cloud", "cybersecurity", "database", "quality assurance",
                        "testing", "network", "embedded", "blockchain", "game development",
                        "software", "developer", "web", "programming", "java", "python",
                        "javascript", "react", "angular", "node", "spring")),
                Map.entry(ProjectCategory.DESIGN_CREATIVE, List.of(
                        "ui", "ux", "design", "graphic", "visual", "creative",
                        "figma", "art", "interior", "brand", "illustrat")),
                Map.entry(ProjectCategory.DATA_AI, List.of(
                        "data science", "analytics", "machine learning", "artificial intelligence",
                        "ai", "statistics", "tableau", "power bi", "data")),
                Map.entry(ProjectCategory.MANAGEMENT, List.of(
                        "project management", "product management", "business analysis",
                        "scrum", "agile", "manager", "management", "analyst")),
                Map.entry(ProjectCategory.ENGINEERING, List.of(
                        "civil", "mechanical", "electrical", "structural",
                        "engineering", "engineer")),
                Map.entry(ProjectCategory.CONSTRUCTION, List.of(
                        "construction", "building", "plumbing", "hvac",
                        "mason", "carpenter", "contractor")),
                Map.entry(ProjectCategory.MARKETING, List.of(
                        "marketing", "digital marketing", "content", "copywriting",
                        "seo", "social media", "advertising", "branding")),
                Map.entry(ProjectCategory.FINANCE_ACCOUNTING, List.of(
                        "finance", "accounting", "audit", "tax", "human resources",
                        "hr", "payroll", "bookkeeping", "cpa", "budget")),
                Map.entry(ProjectCategory.LEGAL_COMPLIANCE, List.of(
                        "legal", "compliance", "law", "attorney", "paralegal",
                        "counsel", "contract")),
                Map.entry(ProjectCategory.HEALTHCARE, List.of(
                        "healthcare", "medical", "nursing", "clinical", "pharmacy",
                        "health", "doctor", "dental", "therapy")),
                Map.entry(ProjectCategory.EDUCATION_TRAINING, List.of(
                        "education", "training", "teaching", "curriculum",
                        "coaching", "tutor", "instructor")),
                Map.entry(ProjectCategory.LOGISTICS, List.of(
                        "logistics", "supply chain", "warehouse", "transport",
                        "procurement", "inventory", "shipping"))
            );

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects-my", key = "#principal.userId"),
            @CacheEvict(value = "projects-all", allEntries = true),
            @CacheEvict(value = "projects-open", allEntries = true)
    })
    public ProjectResponse createProject(String title, String scopeOfWork, String requiredSkills,
                                          ProjectCategory category, String constructionLocation,
                                          LocalDate deadline, BigDecimal budget,
                                          List<MultipartFile> images, List<String> imageDescriptions,
                                          UserPrincipal principal) {
        if (!"PROVIDER".equals(principal.getRole())) {
            throw new ForbiddenException("Only project providers can post projects.");
        }
        Project project = Project.builder()
                .providerId(principal.getUserId())
                .title(title)
                .scopeOfWork(scopeOfWork)
                .requiredSkills(requiredSkills)
                .category(category)
                .constructionLocation(constructionLocation)
                .deadline(deadline)
                .budget(budget)
                .build();
        projectRepository.save(project);
        saveImages(project.getId(), images, imageDescriptions);
        eventPublisher.publishProjectPosted(project.getId(), principal.getUserId());
        return toResponse(project);
    }

    @Override
    @Cacheable(value = "projects-my", key = "#principal.userId")
    public List<ProjectResponse> getMyProjects(UserPrincipal principal) {
        return projectRepository.findAllByProviderIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "projects-all", key = "'all'")
    public List<ProjectResponse> getAllProjects(UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can view all projects.");
        }
        return projectRepository.findAll().stream()
                .sorted(Comparator.comparing(Project::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "projects-open", key = "'open'")
    public List<ProjectResponse> getOpenProjects() {
        return projectRepository.findAllByStatus(ProjectStatus.OPEN)
                .stream()
                .sorted(Comparator.comparing(Project::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "projects-assigned", key = "#principal.userId")
    public List<ProjectResponse> getAssignedProjects(UserPrincipal principal) {
        return projectRepository.findAllByAssignedWorkerIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "projects-by-id", key = "#projectId")
    public ProjectResponse getProjectById(String projectId, UserPrincipal principal) {
        Project project = findProject(projectId);
        boolean isProvider = project.getProviderId().equals(principal.getUserId());
        boolean isWorker   = principal.getUserId().equals(project.getAssignedWorkerId());
        boolean isAdmin    = "ADMIN".equals(principal.getRole());
        boolean isEvaluator = "EVALUATOR".equals(principal.getRole());
        if (!isProvider && !isWorker && !isAdmin && !isEvaluator) {
            throw new ForbiddenException("Access denied.");
        }
        return toResponse(project);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects-by-id", key = "#projectId"),
            @CacheEvict(value = "projects-my", allEntries = true),
            @CacheEvict(value = "projects-all", allEntries = true),
            @CacheEvict(value = "projects-assigned", allEntries = true)
    })
    public ProjectResponse markCompleted(String projectId, UserPrincipal principal) {
        Project project = findAndVerifyOwner(projectId, principal);
        if (project.getStatus() != ProjectStatus.ASSIGNED) {
            throw new IllegalArgumentException("Only assigned projects can be marked as completed.");
        }
        String assignedWorker = project.getAssignedWorkerId();
        project.setStatus(ProjectStatus.COMPLETED);
        projectRepository.save(project);
        if (assignedWorker != null) {
            java.math.BigDecimal budget = project.getBudget();
            workerCvRepository.findByWorkerId(assignedWorker).ifPresent(cv -> {
                cv.setCompletedProjects(cv.getCompletedProjects() + 1);
                workerCvRepository.save(cv);
            });
            accountRepository.findByUserId(assignedWorker).ifPresent(workerAccount -> {
                workerAccount.setPendingBalance(workerAccount.getPendingBalance().subtract(budget));
                workerAccount.setBalance(workerAccount.getBalance().add(budget));
                accountRepository.save(workerAccount);
            });
            accountRepository.findByUserId(project.getProviderId()).ifPresent(providerAccount -> {
                providerAccount.setPendingBalance(providerAccount.getPendingBalance().subtract(budget));
                accountRepository.save(providerAccount);
            });
        }
        eventPublisher.publishProjectCompleted(projectId);
        return toResponse(project);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects-by-id", key = "#projectId"),
            @CacheEvict(value = "projects-my", allEntries = true),
            @CacheEvict(value = "projects-all", allEntries = true),
            @CacheEvict(value = "projects-assigned", allEntries = true)
    })
    public ProjectResponse markFailed(String projectId, UserPrincipal principal) {
        Project project = findAndVerifyOwner(projectId, principal);
        if (project.getStatus() != ProjectStatus.ASSIGNED) {
            throw new IllegalArgumentException("Only assigned projects can be marked as failed.");
        }
        java.math.BigDecimal budget = project.getBudget();
        project.setStatus(ProjectStatus.FAILED);
        projectRepository.save(project);

        if (project.getAssignedWorkerId() != null) {
            accountRepository.findByUserId(project.getAssignedWorkerId()).ifPresent(workerAccount -> {
                workerAccount.setPendingBalance(workerAccount.getPendingBalance().subtract(budget));
                accountRepository.save(workerAccount);
            });
        }
        accountRepository.findByUserId(project.getProviderId()).ifPresent(providerAccount -> {
            providerAccount.setPendingBalance(providerAccount.getPendingBalance().subtract(budget));
            accountRepository.save(providerAccount);
        });

        eventPublisher.publishProjectFailed(projectId, project.getProviderId(),
                project.getAssignedWorkerId() != null ? project.getAssignedWorkerId() : "");
        return toResponse(project);
    }

    @Override
    public List<RankedWorkerResponse> getRankedCandidates(String projectId, UserPrincipal principal) {
        Project project = findProject(projectId);
        boolean isAdmin = "ADMIN".equals(principal.getRole());
        boolean isOwner = "PROVIDER".equals(principal.getRole())
                && project.getProviderId().equals(principal.getUserId());
        if (!isAdmin && !isOwner) {
            throw new ForbiddenException("Access denied.");
        }

        List<WorkerCv> allCvs = workerCvRepository.findAll().stream()
                .filter(cv -> "APPROVED".equals(cv.getApprovalStatus())
                           && !cv.isBanned()
                           && cv.getSpecialization() != null
                           && cv.getWorkerName() != null
                           && cv.getWorkerEmail() != null)
                .collect(Collectors.toList());
        if (allCvs.isEmpty()) return List.of();

        // Category hard-filter: only workers whose specialization matches the project's field
        ProjectCategory category = project.getCategory();
        if (category != null && category != ProjectCategory.OTHER) {
            List<WorkerCv> categoryFiltered = allCvs.stream()
                    .filter(cv -> workerMatchesCategory(cv.getSpecialization(), category))
                    .collect(Collectors.toList());
            // If no workers in this category exist, return empty — don't cross categories
            if (categoryFiltered.isEmpty()) return List.of();
            allCvs = categoryFiltered;
        } else {
            // No category (legacy project) or OTHER → use keyword relevance as before
            List<WorkerCv> relevant = allCvs.stream()
                    .filter(cv -> isKeywordRelevant(cv.getSpecialization(),
                            project.getRequiredSkills(), project.getTitle()))
                    .collect(Collectors.toList());
            if (!relevant.isEmpty()) allCvs = relevant;
        }

        List<Map<String, Object>> workers = allCvs.stream().map(cv -> {
            Map<String, Object> w = new HashMap<>();
            w.put("worker_id", cv.getWorkerId());
            w.put("worker_name", cv.getWorkerName());
            w.put("worker_email", cv.getWorkerEmail());
            w.put("specialization", cv.getSpecialization());
            w.put("years_of_experience", cv.getYearsOfExperience());
            w.put("additional_credentials", cv.getAdditionalCredentials());
            w.put("rating_score", cv.getRatingScore());
            return w;
        }).collect(Collectors.toList());

        Map<String, Object> body = new HashMap<>();
        body.put("project_id", projectId);
        body.put("title", project.getTitle());
        body.put("scope_of_work", project.getScopeOfWork());
        body.put("required_skills", project.getRequiredSkills());
        body.put("workers", workers);

        try {
            String jsonBody = MAPPER.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceBaseUrl + "/api/ai/matching/rank-candidates"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            @SuppressWarnings("unchecked")
            Map<String, Object> aiResponse = MAPPER.readValue(response.body(), Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> ranked = (List<Map<String, Object>>) aiResponse.get("ranked_workers");
            return ranked.stream()
                    .filter(r -> ((Number) r.get("match_score")).doubleValue() > 15)
                    .map(r -> RankedWorkerResponse.builder()
                            .workerId((String) r.get("worker_id"))
                            .workerName((String) r.get("worker_name"))
                            .workerEmail((String) r.get("worker_email"))
                            .specialization((String) r.get("specialization"))
                            .yearsOfExperience(((Number) r.get("years_of_experience")).intValue())
                            .ratingScore(((Number) r.get("rating_score")).doubleValue())
                            .rankScore(((Number) r.get("match_score")).doubleValue())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return allCvs.stream()
                    .sorted(Comparator.comparingDouble(WorkerCv::getRatingScore).reversed())
                    .map(cv -> RankedWorkerResponse.builder()
                            .workerId(cv.getWorkerId()).workerName(cv.getWorkerName())
                            .workerEmail(cv.getWorkerEmail()).specialization(cv.getSpecialization())
                            .yearsOfExperience(cv.getYearsOfExperience())
                            .ratingScore(cv.getRatingScore()).rankScore(cv.getRatingScore() * 10)
                            .build())
                    .collect(Collectors.toList());
        }
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects-by-id", key = "#projectId"),
            @CacheEvict(value = "projects-all", allEntries = true),
            @CacheEvict(value = "projects-open", allEntries = true),
            @CacheEvict(value = "projects-assigned", allEntries = true)
    })
    public ProjectResponse assignWorker(String projectId, String workerId, UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can assign workers to projects.");
        }
        Project project = findProject(projectId);
        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new IllegalArgumentException("Only open projects can have a worker assigned.");
        }

        Account providerAccount = accountRepository.findByUserId(project.getProviderId())
                .orElseThrow(() -> new IllegalArgumentException("Provider has no account. Ask them to fund the project first."));
        if (providerAccount.getBalance().compareTo(project.getBudget()) < 0) {
            throw new IllegalArgumentException("Provider has insufficient balance. Ask them to fund the project first.");
        }

        providerAccount.setBalance(providerAccount.getBalance().subtract(project.getBudget()));
        providerAccount.setPendingBalance(providerAccount.getPendingBalance().add(project.getBudget()));
        accountRepository.save(providerAccount);

        Account workerAccount = accountRepository.findByUserId(workerId).orElseGet(() ->
                accountRepository.save(Account.builder()
                        .userId(workerId)
                        .role("WORKER")
                        .accountNumber(generateAccountNumber())
                        .build()));
        workerAccount.setPendingBalance(workerAccount.getPendingBalance().add(project.getBudget()));
        accountRepository.save(workerAccount);

        project.setAssignedWorkerId(workerId);
        project.setStatus(ProjectStatus.ASSIGNED);
        projectRepository.save(project);
        eventPublisher.publishWorkerAssigned(projectId, workerId, project.getProviderId(), project.getTitle());
        return toResponse(project);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects-by-id", key = "#projectId"),
            @CacheEvict(value = "projects-my", allEntries = true),
            @CacheEvict(value = "projects-all", allEntries = true),
            @CacheEvict(value = "projects-open", allEntries = true)
    })
    public ProjectResponse repostProject(String projectId, UserPrincipal principal) {
        if (!"PROVIDER".equals(principal.getRole())) {
            throw new ForbiddenException("Only project providers can repost projects.");
        }
        Project project = findAndVerifyOwner(projectId, principal);
        if (project.getStatus() != ProjectStatus.FAILED) {
            throw new IllegalArgumentException("Only failed projects can be reposted.");
        }
        if (claimRepository.existsByProjectIdAndStatusNotIn(
                projectId, List.of(ClaimStatus.REFUNDED, ClaimStatus.REJECTED))) {
            throw new IllegalArgumentException(
                    "An active claim exists for this project. It must be refunded before the project can be reposted.");
        }
        accountRepository.findByUserId(project.getProviderId()).ifPresent(account -> {
            if (account.getBalance().compareTo(project.getBudget()) < 0) {
                throw new IllegalArgumentException(
                        "Insufficient balance to repost. File a claim for the project failure and wait for the refund to be processed.");
            }
        });
        project.setStatus(ProjectStatus.OPEN);
        project.setFunded(true);
        project.setAssignedWorkerId(null);
        projectRepository.save(project);
        return toResponse(project);
    }

    private String generateAccountNumber() {
        String num;
        do {
            num = String.format("%010d", java.util.concurrent.ThreadLocalRandom.current().nextLong(0, 10_000_000_000L));
        } while (accountRepository.existsByAccountNumber(num));
        return num;
    }

    /** Returns true if the worker's specialization contains any category keyword. */
    private boolean workerMatchesCategory(String workerSpec, ProjectCategory category) {
        if (workerSpec == null || category == null) return false;
        List<String> keywords = CATEGORY_WORKER_KEYWORDS.getOrDefault(category, List.of());
        String spec = workerSpec.toLowerCase();
        return keywords.stream().anyMatch(spec::contains);
    }

    private static final Set<String> FIELD_STOP_WORDS = Set.of(
            "and", "the", "of", "in", "for", "with", "a", "an", "to", "or", "on", "at", "by", "as"
    );

    /** Original keyword relevance check — used when no category or category is OTHER. */
    private boolean isKeywordRelevant(String workerSpec, String requiredSkills, String title) {
        if (workerSpec == null || workerSpec.isBlank()) return false;
        String context = ((requiredSkills != null ? requiredSkills : "")
                + " " + (title != null ? title : "")).toLowerCase();
        for (String word : workerSpec.toLowerCase().split("[\\s&,/\\-]+")) {
            if (word.length() > 3 && !FIELD_STOP_WORDS.contains(word) && context.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private void saveImages(String projectId, List<MultipartFile> images, List<String> descriptions) {
        if (images == null || images.isEmpty()) return;
        List<ProjectImage> toSave = new ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            MultipartFile file = images.get(i);
            if (file == null || file.isEmpty()) continue;
            String description = (descriptions != null && i < descriptions.size()
                    && descriptions.get(i) != null && !descriptions.get(i).isBlank())
                    ? descriptions.get(i) : "Supporting image " + (i + 1);
            try {
                String key = s3UploadService.uploadFile(file, "project-images");
                toSave.add(ProjectImage.builder()
                        .projectId(projectId).imageKey(key)
                        .description(description).displayOrder(i).build());
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload image: " + file.getOriginalFilename());
            }
        }
        projectImageRepository.saveAll(toSave);
    }

    private Project findProject(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));
    }

    private Project findAndVerifyOwner(String projectId, UserPrincipal principal) {
        Project project = findProject(projectId);
        if (!project.getProviderId().equals(principal.getUserId())) {
            throw new ForbiddenException("You do not own this project.");
        }
        return project;
    }

    private ProjectResponse toResponse(Project p) {
        List<ProjectImageResponse> images = projectImageRepository
                .findAllByProjectIdOrderByDisplayOrderAsc(p.getId())
                .stream()
                .map(img -> ProjectImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(s3UploadService.generatePresignedUrl(img.getImageKey()))
                        .description(img.getDescription())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        String categoryName     = p.getCategory() != null ? p.getCategory().name() : null;
        String categoryDisplay  = p.getCategory() != null ? p.getCategory().getDisplayName() : null;

        return ProjectResponse.builder()
                .id(p.getId())
                .providerId(p.getProviderId())
                .title(p.getTitle())
                .scopeOfWork(p.getScopeOfWork())
                .requiredSkills(p.getRequiredSkills())
                .category(categoryName)
                .categoryDisplayName(categoryDisplay)
                .constructionLocation(p.getConstructionLocation())
                .deadline(p.getDeadline())
                .budget(p.getBudget())
                .status(p.getStatus().name())
                .funded(Boolean.TRUE.equals(p.getFunded()))
                .assignedWorkerId(p.getAssignedWorkerId())
                .images(images)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
