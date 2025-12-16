package com.datn.identity.domain.audit;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for AuditLog domain entity.
 */
public interface AuditLogRepository {

    /**
     * Saves an audit log entry.
     */
    void save(AuditLog log);

    /**
     * Finds audit logs by organization with pagination.
     */
    List<AuditLog> findByOrgId(UUID orgId, int page, int size);

    /**
     * Counts audit logs by organization.
     */
    long countByOrgId(UUID orgId);

    /**
     * Finds audit logs with filters.
     */
    List<AuditLog> query(
        UUID orgId,
        UUID userId,
        AuditAction action,
        String category,
        Instant from,
        Instant to,
        int page,
        int size
    );

    /**
     * Counts audit logs with filters.
     */
    long countQuery(
        UUID orgId,
        UUID userId,
        AuditAction action,
        String category,
        Instant from,
        Instant to
    );

    /**
     * Counts audit logs since a given time.
     */
    long countByOrgIdSince(UUID orgId, Instant since);

    /**
     * Gets recent audit logs (for dashboard).
     */
    List<AuditLog> findRecentByOrgId(UUID orgId, int limit);
}
