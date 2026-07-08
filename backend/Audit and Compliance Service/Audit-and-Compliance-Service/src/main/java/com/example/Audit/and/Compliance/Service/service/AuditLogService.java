package com.example.Audit.and.Compliance.Service.service;

import com.example.Audit.and.Compliance.Service.dto.AuditLogResponse;
import com.example.Audit.and.Compliance.Service.dto.IngestAuditRequest;
import com.example.Audit.and.Compliance.Service.model.AuditLog;
import com.example.Audit.and.Compliance.Service.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository repository;

    @Transactional
    public AuditLog save(AuditLog entry) {
        return repository.save(entry);
    }

    @Transactional
    public void ingest(IngestAuditRequest req) {
        AuditLog entry = AuditLog.builder()
                .actorId(req.getActorId() != null ? req.getActorId() : "SYSTEM")
                .actorName(req.getActorName())
                .actorRole(req.getActorRole())
                .action(req.getAction())
                .service(req.getService())
                .resourceType(req.getResourceType())
                .resourceId(req.getResourceId())
                .outcome(req.getOutcome() != null ? req.getOutcome() : "SUCCESS")
                .details(req.getDetails())
                .build();
        repository.save(entry);
        log.info("[Audit] Ingested manual entry: action={} actor={}", req.getAction(), req.getActorId());
    }

    public Page<AuditLogResponse> findAll(
            String actorId,
            String action,
            String service,
            String fromDate,
            String toDate,
            int page,
            int size) {

        Specification<AuditLog> spec = buildSpec(actorId, action, service, fromDate, toDate);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return repository.findAll(spec, pageable).map(this::toResponse);
    }

    public Optional<AuditLogResponse> findById(String id) {
        return repository.findById(id).map(this::toResponse);
    }

    public List<String> getDistinctActions() {
        return repository.findDistinctActions();
    }

    public List<String> getDistinctServices() {
        return repository.findDistinctServices();
    }

    public void exportCsv(
            String actorId,
            String action,
            String service,
            String fromDate,
            String toDate,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"audit-log.csv\"");

        Specification<AuditLog> spec = buildSpec(actorId, action, service, fromDate, toDate);
        List<AuditLog> logs = repository.findAll(spec,
                Sort.by(Sort.Direction.DESC, "timestamp"));

        PrintWriter writer = response.getWriter();
        writer.println("ID,Actor ID,Actor Name,Actor Role,Action,Service,Resource Type,Resource ID,Outcome,Timestamp,Details");
        for (AuditLog l : logs) {
            writer.printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,\"%s\"%n",
                    safe(l.getId()),
                    safe(l.getActorId()),
                    safe(l.getActorName()),
                    safe(l.getActorRole()),
                    safe(l.getAction()),
                    safe(l.getService()),
                    safe(l.getResourceType()),
                    safe(l.getResourceId()),
                    safe(l.getOutcome()),
                    l.getTimestamp() != null ? l.getTimestamp().toString() : "",
                    safe(l.getDetails()).replace("\"", "\"\"")
            );
        }
        writer.flush();
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private Specification<AuditLog> buildSpec(
            String actorId, String action, String service,
            String fromDate, String toDate) {

        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (actorId != null && !actorId.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("actorId")),
                        "%" + actorId.toLowerCase() + "%"));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (service != null && !service.isBlank()) {
                predicates.add(cb.equal(root.get("service"), service));
            }
            if (fromDate != null && !fromDate.isBlank()) {
                try {
                    LocalDateTime from = LocalDate.parse(fromDate).atStartOfDay();
                    predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), from));
                } catch (DateTimeParseException ignored) {}
            }
            if (toDate != null && !toDate.isBlank()) {
                try {
                    LocalDateTime to = LocalDate.parse(toDate).atTime(23, 59, 59);
                    predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), to));
                } catch (DateTimeParseException ignored) {}
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private AuditLogResponse toResponse(AuditLog l) {
        return AuditLogResponse.builder()
                .id(l.getId())
                .actorId(l.getActorId())
                .actorName(l.getActorName())
                .actorRole(l.getActorRole())
                .action(l.getAction())
                .service(l.getService())
                .resourceType(l.getResourceType())
                .resourceId(l.getResourceId())
                .outcome(l.getOutcome())
                .details(l.getDetails())
                .timestamp(l.getTimestamp())
                .build();
    }

    private String safe(String s) {
        return s != null ? s : "";
    }
}
