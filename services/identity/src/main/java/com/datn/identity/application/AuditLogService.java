package com.datn.identity.application;

import com.datn.identity.domain.audit.AuditAction;
import com.datn.identity.domain.audit.AuditLog;
import com.datn.identity.domain.audit.AuditLogRepository;
import com.datn.identity.interfaces.api.dto.Dtos;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogs;

    public AuditLogService(AuditLogRepository auditLogs) {
        this.auditLogs = auditLogs;
    }

    /**
     * Log an audit event.
     */
    @Transactional
    public void log(UUID orgId, UUID userId, AuditAction action, String description,
                    Map<String, Object> metadata, String ipAddress, String userAgent) {
        var log = AuditLog.create(orgId, userId, action, description, metadata, ipAddress, userAgent);
        auditLogs.save(log);
    }

    /**
     * Log a simple audit event without request context.
     */
    @Transactional
    public void log(UUID orgId, UUID userId, AuditAction action, String description) {
        log(orgId, userId, action, description, null, null, null);
    }

    /**
     * Log a simple audit event with metadata.
     */
    @Transactional
    public void log(UUID orgId, UUID userId, AuditAction action, String description, Map<String, Object> metadata) {
        log(orgId, userId, action, description, metadata, null, null);
    }

    /**
     * Query audit logs with filters.
     */
    public Dtos.PagedResponse<Dtos.AuditLogRes> query(
            UUID orgId,
            UUID userId,
            String action,
            String category,
            Instant from,
            Instant to,
            int page,
            int size) {

        AuditAction auditAction = null;
        if (action != null && !action.isBlank()) {
            try {
                auditAction = AuditAction.valueOf(action);
            } catch (IllegalArgumentException e) {
                // Invalid action, ignore filter
            }
        }

        List<AuditLog> logs = auditLogs.query(orgId, userId, auditAction, category, from, to, page, size);
        long total = auditLogs.countQuery(orgId, userId, auditAction, category, from, to);
        int totalPages = (int) Math.ceil((double) total / size);

        List<Dtos.AuditLogRes> items = logs.stream()
            .map(this::toAuditLogRes)
            .collect(Collectors.toList());

        return new Dtos.PagedResponse<>(items, page, size, total, totalPages);
    }

    /**
     * Get audit logs for an organization.
     */
    public Dtos.PagedResponse<Dtos.AuditLogRes> getByOrg(UUID orgId, int page, int size) {
        List<AuditLog> logs = auditLogs.findByOrgId(orgId, page, size);
        long total = auditLogs.countByOrgId(orgId);
        int totalPages = (int) Math.ceil((double) total / size);

        List<Dtos.AuditLogRes> items = logs.stream()
            .map(this::toAuditLogRes)
            .collect(Collectors.toList());

        return new Dtos.PagedResponse<>(items, page, size, total, totalPages);
    }

    /**
     * Get available audit action categories.
     */
    public List<String> getCategories() {
        return List.of("USER", "ORGANIZATION", "MEMBERSHIP", "FILE", "REPORT");
    }

    /**
     * Get all available audit actions.
     */
    public List<Dtos.AuditActionInfo> getActions() {
        return java.util.Arrays.stream(AuditAction.values())
            .map(a -> new Dtos.AuditActionInfo(a.name(), a.getCategory()))
            .collect(Collectors.toList());
    }

    private Dtos.AuditLogRes toAuditLogRes(AuditLog log) {
        return new Dtos.AuditLogRes(
            log.id().toString(),
            log.orgId().toString(),
            log.userId() != null ? log.userId().toString() : null,
            log.action().name(),
            log.action().getCategory(),
            log.description(),
            log.metadata(),
            log.ipAddress(),
            log.userAgent(),
            log.createdAt().toString()
        );
    }
}
