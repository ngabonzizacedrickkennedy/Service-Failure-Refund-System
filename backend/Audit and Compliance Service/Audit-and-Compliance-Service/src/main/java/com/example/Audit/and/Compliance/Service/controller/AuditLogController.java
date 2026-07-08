package com.example.Audit.and.Compliance.Service.controller;

import com.example.Audit.and.Compliance.Service.dto.AuditLogResponse;
import com.example.Audit.and.Compliance.Service.dto.IngestAuditRequest;
import com.example.Audit.and.Compliance.Service.service.AuditLogService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService service;

    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<AuditLogResponse>> getLogs(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String serviceName,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(
                service.findAll(actorId, action, serviceName, fromDate, toDate, page, size));
    }

    @GetMapping("/logs/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AuditLogResponse> getLog(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/logs/export")
    @PreAuthorize("hasAuthority('ADMIN')")
    public void exportCsv(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String serviceName,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            HttpServletResponse response) throws IOException {

        service.exportCsv(actorId, action, serviceName, fromDate, toDate, response);
    }

    @PostMapping("/ingest")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, String>> ingest(@RequestBody IngestAuditRequest request) {
        service.ingest(request);
        return ResponseEntity.ok(Map.of("status", "recorded"));
    }

    @GetMapping("/actions")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<String>> getActions() {
        return ResponseEntity.ok(service.getDistinctActions());
    }

    @GetMapping("/services")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<String>> getServices() {
        return ResponseEntity.ok(service.getDistinctServices());
    }
}
