package com.datn.identity.domain.audit;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Domain entity representing an audit log entry.
 * Immutable record that captures who did what, when, and where.
 */
public record AuditLog(
    UUID id,
    UUID orgId,
    UUID userId,
    AuditAction action,
    String description,
    Map<String, Object> metadata,
    String ipAddress,
    String userAgent,
    Instant createdAt
) {
    /**
     * Creates a new audit log entry.
     */
    public static AuditLog create(
            UUID orgId,
            UUID userId,
            AuditAction action,
            String description,
            Map<String, Object> metadata,
            String ipAddress,
            String userAgent) {
        return new AuditLog(
            UUID.randomUUID(),
            orgId,
            userId,
            action,
            description,
            metadata != null ? metadata : Map.of(),
            ipAddress,
            userAgent,
            Instant.now()
        );
    }

    /**
     * Creates a simple audit log without request context.
     */
    public static AuditLog create(
            UUID orgId,
            UUID userId,
            AuditAction action,
            String description) {
        return create(orgId, userId, action, description, null, null, null);
    }

    /**
     * Creates an audit log with metadata but without request context.
     */
    @SuppressWarnings("unchecked")
    public static AuditLog create(
            UUID orgId,
            UUID userId,
            AuditAction action,
            String description,
            Map<String, ?> metadata) {
        Map<String, Object> meta = metadata != null ? (Map<String, Object>) (Map<?, ?>) metadata : null;
        return create(orgId, userId, action, description, meta, null, null);
    }

    /**
     * Returns the category of this audit action.
     */
    public String category() {
        return action.getCategory();
    }
}
