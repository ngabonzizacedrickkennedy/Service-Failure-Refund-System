package com.example.ProjectWorker_Execution_Service.service.impl;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.GpsDirectory;
import com.example.ProjectWorker_Execution_Service.dto.ClaimResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerClaimResponseRequest;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.kafka.ExecutionEventPublisher;
import com.example.ProjectWorker_Execution_Service.model.Claim;
import com.example.ProjectWorker_Execution_Service.model.ClaimStatus;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.repository.ClaimRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ClaimService;
import com.example.ProjectWorker_Execution_Service.service.S3UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;
    private final ProjectRepository projectRepository;
    private final S3UploadService s3UploadService;
    private final ExecutionEventPublisher eventPublisher;

    @Override
    @Transactional
    public ClaimResponse fileClaim(String projectId, String description,
                                    List<MultipartFile> proofDocuments,
                                    List<MultipartFile> ghostProjectImages,
                                    String messageEvidenceJson,
                                    UserPrincipal principal) {
        if (!"PROVIDER".equals(principal.getRole())) {
            throw new ForbiddenException("Only project providers can file claims.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        if (!project.getProviderId().equals(principal.getUserId())) {
            throw new ForbiddenException("You do not own this project.");
        }

        if (project.getStatus() != ProjectStatus.FAILED) {
            throw new IllegalArgumentException("Claims can only be filed for projects marked as Failed.");
        }

        if (project.getAssignedWorkerId() == null) {
            throw new IllegalArgumentException("No worker was assigned to this project.");
        }

        // Block only if there is an active (non-terminal) claim for this project.
        // REFUNDED and REJECTED are terminal — allow a new claim after a re-assignment.
        if (claimRepository.existsByProjectIdAndStatusNotIn(
                projectId, List.of(ClaimStatus.REFUNDED, ClaimStatus.REJECTED))) {
            throw new IllegalArgumentException("A claim is already in progress for this project.");
        }

        List<String> docKeys = new ArrayList<>();
        String geotagKey = null;
        Double lat = null;
        Double lon = null;
        String photoTimestamp = null;

        if (proofDocuments != null) {
            for (MultipartFile file : proofDocuments) {
                if (file.isEmpty()) continue;
                try {
                    String key = s3UploadService.uploadFile(file, "claim-documents");
                    docKeys.add(key);

                    String ct = file.getContentType();
                    if (ct != null && (ct.startsWith("image/jpeg") || ct.startsWith("image/jpg"))) {
                        byte[] bytes = file.getBytes();
                        GpsResult gps = extractGps(bytes);
                        if (gps != null && geotagKey == null) {
                            geotagKey = key;
                            lat = gps.lat;
                            lon = gps.lon;
                            photoTimestamp = gps.timestamp;
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload proof document.");
                }
            }
        }

        List<String> ghostKeys = new ArrayList<>();
        if (ghostProjectImages != null) {
            for (MultipartFile file : ghostProjectImages) {
                if (file.isEmpty()) continue;
                try {
                    String key = s3UploadService.uploadFile(file, "claim-ghost-images");
                    ghostKeys.add(key);

                    if (geotagKey == null) {
                        String ct = file.getContentType();
                        if (ct != null && (ct.startsWith("image/jpeg") || ct.startsWith("image/jpg"))) {
                            byte[] bytes = file.getBytes();
                            GpsResult gps = extractGps(bytes);
                            if (gps != null) {
                                geotagKey = key;
                                lat = gps.lat;
                                lon = gps.lon;
                                photoTimestamp = gps.timestamp;
                            }
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload ghost project image.");
                }
            }
        }

        Claim claim = Claim.builder()
                .projectId(projectId)
                .providerId(principal.getUserId())
                .workerId(project.getAssignedWorkerId())
                .description(description)
                .proofDocumentKeys(docKeys)
                .ghostProjectImageKeys(ghostKeys)
                .messageEvidenceJson(messageEvidenceJson)
                .geotagPhotoKey(geotagKey)
                .extractedLat(lat)
                .extractedLon(lon)
                .extractedPhotoTimestamp(photoTimestamp)
                .build();

        claimRepository.save(claim);
        eventPublisher.publishClaimFiled(claim.getId(), projectId, project.getAssignedWorkerId());

        return toResponse(claim);
    }

    @Override
    @Transactional
    public void deleteClaim(String claimId, UserPrincipal principal) {
        Claim claim = findClaim(claimId);
        if (!claim.getProviderId().equals(principal.getUserId())) {
            throw new ForbiddenException("You did not file this claim.");
        }
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new IllegalArgumentException("Only pending claims can be deleted.");
        }
        claimRepository.delete(claim);
    }

    @Override
    @Transactional
    public ClaimResponse updateClaim(String claimId, String description,
                                      List<MultipartFile> proofDocuments,
                                      List<MultipartFile> ghostProjectImages,
                                      String messageEvidenceJson,
                                      UserPrincipal principal) {
        Claim claim = findClaim(claimId);

        if (!claim.getProviderId().equals(principal.getUserId())) {
            throw new ForbiddenException("You did not file this claim.");
        }
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new IllegalArgumentException("Only pending claims can be edited.");
        }

        claim.setDescription(description);
        if (messageEvidenceJson != null) {
            claim.setMessageEvidenceJson(messageEvidenceJson);
        }

        boolean hasNewDocs = proofDocuments != null && proofDocuments.stream().anyMatch(f -> !f.isEmpty());
        if (hasNewDocs) {
            List<String> docKeys = new ArrayList<>();
            String geotagKey = null;
            Double lat = null;
            Double lon = null;
            String photoTimestamp = null;

            for (MultipartFile file : proofDocuments) {
                if (file.isEmpty()) continue;
                try {
                    String key = s3UploadService.uploadFile(file, "claim-documents");
                    docKeys.add(key);
                    String ct = file.getContentType();
                    if (ct != null && (ct.startsWith("image/jpeg") || ct.startsWith("image/jpg"))) {
                        GpsResult gps = extractGps(file.getBytes());
                        if (gps != null && geotagKey == null) {
                            geotagKey = key;
                            lat = gps.lat;
                            lon = gps.lon;
                            photoTimestamp = gps.timestamp;
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload proof document.");
                }
            }
            claim.getProofDocumentKeys().clear();
            claim.getProofDocumentKeys().addAll(docKeys);
            if (geotagKey != null) {
                claim.setGeotagPhotoKey(geotagKey);
                claim.setExtractedLat(lat);
                claim.setExtractedLon(lon);
                claim.setExtractedPhotoTimestamp(photoTimestamp);
            }
        }

        boolean hasNewGhosts = ghostProjectImages != null && ghostProjectImages.stream().anyMatch(f -> !f.isEmpty());
        if (hasNewGhosts) {
            List<String> ghostKeys = new ArrayList<>();
            for (MultipartFile file : ghostProjectImages) {
                if (file.isEmpty()) continue;
                try {
                    String key = s3UploadService.uploadFile(file, "claim-ghost-images");
                    ghostKeys.add(key);
                    if (claim.getGeotagPhotoKey() == null) {
                        String ct = file.getContentType();
                        if (ct != null && (ct.startsWith("image/jpeg") || ct.startsWith("image/jpg"))) {
                            GpsResult gps = extractGps(file.getBytes());
                            if (gps != null) {
                                claim.setGeotagPhotoKey(key);
                                claim.setExtractedLat(gps.lat);
                                claim.setExtractedLon(gps.lon);
                                claim.setExtractedPhotoTimestamp(gps.timestamp);
                            }
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload ghost project image.");
                }
            }
            claim.getGhostProjectImageKeys().clear();
            claim.getGhostProjectImageKeys().addAll(ghostKeys);
        }

        claimRepository.save(claim);
        return toResponse(claim);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimResponse> getMyClaims(UserPrincipal principal) {
        return claimRepository.findAllByProviderIdOrderByCreatedAtDesc(principal.getUserId())
                .stream()
                .map(c -> toResponseWithProject(c, projectRepository.findById(c.getProjectId()).orElse(null)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimsAgainstMe(UserPrincipal principal) {
        return claimRepository.findAllByWorkerIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimResponse getClaimById(String claimId, UserPrincipal principal) {
        Claim claim = findClaim(claimId);
        boolean isProvider = claim.getProviderId().equals(principal.getUserId());
        boolean isWorker = claim.getWorkerId().equals(principal.getUserId());
        boolean isEvaluator = "EVALUATOR".equals(principal.getRole());
        if (!isProvider && !isWorker && !isEvaluator && !"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Access denied.");
        }
        return toResponse(claim);
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimResponse getClaimByIdInternal(String claimId) {
        return toResponse(findClaim(claimId));
    }

    @Override
    @Transactional
    public ClaimResponse respondToClaim(String claimId, WorkerClaimResponseRequest request,
                                         UserPrincipal principal) {
        Claim claim = findClaim(claimId);
        if (!claim.getWorkerId().equals(principal.getUserId())) {
            throw new ForbiddenException("You are not the worker on this claim.");
        }
        claim.setWorkerResponse(request.getResponse());
        claimRepository.save(claim);
        eventPublisher.publishWorkerClaimResponse(claimId, principal.getUserId());
        return toResponse(claim);
    }

    @Override
    @Transactional
    public void updateAiMediationReport(String claimId, String report) {
        claimRepository.findById(claimId).ifPresent(claim -> {
            claim.setAiMediationReport(report);
            claimRepository.save(claim);
        });
    }

    private Claim findClaim(String claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found."));
    }

    private ClaimResponse toResponseWithProject(Claim c, Project project) {
        ClaimResponse base = toResponse(c);
        return ClaimResponse.builder()
                .id(base.getId())
                .projectId(base.getProjectId())
                .providerId(base.getProviderId())
                .workerId(base.getWorkerId())
                .description(base.getDescription())
                .status(base.getStatus())
                .proofDocumentUrls(base.getProofDocumentUrls())
                .ghostProjectImageUrls(base.getGhostProjectImageUrls())
                .messageEvidence(base.getMessageEvidence())
                .geotagPhotoUrl(base.getGeotagPhotoUrl())
                .extractedLat(base.getExtractedLat())
                .extractedLon(base.getExtractedLon())
                .extractedPhotoTimestamp(base.getExtractedPhotoTimestamp())
                .workerResponse(base.getWorkerResponse())
                .aiMediationReport(base.getAiMediationReport())
                .projectBudget(project != null ? project.getBudget() : null)
                .createdAt(base.getCreatedAt())
                .updatedAt(base.getUpdatedAt())
                .build();
    }

    private ClaimResponse toResponse(Claim c) {
        List<String> docUrls = c.getProofDocumentKeys().stream()
                .map(s3UploadService::generatePresignedUrl)
                .collect(Collectors.toList());

        List<String> ghostUrls = c.getGhostProjectImageKeys().stream()
                .map(s3UploadService::generatePresignedUrl)
                .collect(Collectors.toList());

        return ClaimResponse.builder()
                .id(c.getId())
                .projectId(c.getProjectId())
                .providerId(c.getProviderId())
                .workerId(c.getWorkerId())
                .description(c.getDescription())
                .status(c.getStatus().name())
                .proofDocumentUrls(docUrls)
                .ghostProjectImageUrls(ghostUrls)
                .messageEvidence(c.getMessageEvidenceJson())
                .geotagPhotoUrl(s3UploadService.generatePresignedUrl(c.getGeotagPhotoKey()))
                .extractedLat(c.getExtractedLat())
                .extractedLon(c.getExtractedLon())
                .extractedPhotoTimestamp(c.getExtractedPhotoTimestamp())
                .workerResponse(c.getWorkerResponse())
                .aiMediationReport(c.getAiMediationReport())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private GpsResult extractGps(byte[] imageBytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(imageBytes));
            Collection<GpsDirectory> gpsDirs = metadata.getDirectoriesOfType(GpsDirectory.class);
            for (GpsDirectory gpsDir : gpsDirs) {
                com.drew.lang.GeoLocation geo = gpsDir.getGeoLocation();
                if (geo != null && !geo.isZero()) {
                    String timestamp = null;
                    java.util.Date date = gpsDir.getGpsDate();
                    if (date != null) timestamp = date.toString();
                    return new GpsResult(geo.getLatitude(), geo.getLongitude(), timestamp);
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private record GpsResult(double lat, double lon, String timestamp) {}
}
