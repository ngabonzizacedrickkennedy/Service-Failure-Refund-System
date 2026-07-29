package com.example.ProjectWorker_Execution_Service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class S3UploadService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * Comma-separated key prefixes served as plain, unsigned URLs — e.g.
     * "project-images/". Only set a prefix here once a bucket policy grants
     * public s3:GetObject on it; until then the object 403s for everyone.
     *
     * Empty by default, which keeps every folder on presigned URLs.
     * Never add claim-documents/, claim-ghost-images/, justifications/ or
     * worker-cvs/ — those hold evidence and personal data.
     */
    @Value("${aws.s3.public-prefixes:}")
    private String publicPrefixes;

    public String uploadFile(MultipartFile file, String folder) throws IOException {
        String key = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromBytes(file.getBytes())
        );
        return key;
    }

    /**
     * A readable URL for an object key. Public prefixes get a permanent plain
     * URL; everything else gets a 60-minute presigned one.
     *
     * A presigned URL is only valid for an hour, so callers must not let one
     * outlive that — in particular it must never be baked into a @Cacheable
     * response, or the cache will keep serving a dead signature.
     */
    public String generateFileUrl(String key) {
        if (key == null) return null;
        return isPublic(key) ? publicUrl(key) : presignedUrl(key);
    }

    private boolean isPublic(String key) {
        if (publicPrefixes == null || publicPrefixes.isBlank()) return false;
        return Arrays.stream(publicPrefixes.split(","))
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .anyMatch(key::startsWith);
    }

    /** Virtual-hosted-style URL. Each segment is encoded; the slashes are not. */
    private String publicUrl(String key) {
        List<String> segments = Arrays.stream(key.split("/", -1))
                .map(s -> URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20"))
                .collect(Collectors.toList());
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/"
                + String.join("/", segments);
    }

    private String presignedUrl(String key) {
        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(
                GetObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(60))
                        .getObjectRequest(r -> r.bucket(bucketName).key(key))
                        .build()
        );
        return presigned.url().toString();
    }
}
