package com.datn.identity.interfaces.api;

import com.datn.identity.application.AuditLogService;
import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Audit Log operations (UC10).
 */
@RestController
@RequestMapping("/orgs/{orgId}/audit-logs")
public class AuditLogController {
    private final AuditLogService auditLogs;
    private final OrganizationApplicationService orgs;

    public AuditLogController(AuditLogService auditLogs, OrganizationApplicationService orgs) {
        this.auditLogs = auditLogs;
        this.orgs = orgs;
    }

    /**
     * Get audit logs for an organization with optional filters.
     *
     * Query params:
     * - userId: Filter by user ID
     * - action: Filter by specific action (e.g., USER_LOGIN)
     * - category: Filter by category (USER, ORGANIZATION, MEMBERSHIP, FILE, REPORT)
     * - from: Start date (ISO-8601)
     * - to: End date (ISO-8601)
     * - page: Page number (0-indexed)
     * - size: Page size
     */
    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @PathVariable String orgId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        UUID orgUuid = UUID.fromString(orgId);
        if (!orgs.isMember(currentUserId, orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            UUID filterUserId = userId != null && !userId.isBlank() ? UUID.fromString(userId) : null;
            Instant fromInstant = from != null && !from.isBlank() ? Instant.parse(from) : null;
            Instant toInstant = to != null && !to.isBlank() ? Instant.parse(to) : null;

            var result = auditLogs.query(
                orgUuid,
                filterUserId,
                action,
                category,
                fromInstant,
                toInstant,
                page,
                size
            );

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_parameter", "message", e.getMessage()));
        }
    }

    /**
     * Get available audit action categories.
     */
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories(@PathVariable String orgId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        if (!orgs.isMember(currentUserId, UUID.fromString(orgId))) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        return ResponseEntity.ok(Map.of("categories", auditLogs.getCategories()));
    }

    /**
     * Get all available audit actions.
     */
    @GetMapping("/actions")
    public ResponseEntity<?> getActions(@PathVariable String orgId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        if (!orgs.isMember(currentUserId, UUID.fromString(orgId))) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        return ResponseEntity.ok(Map.of("actions", auditLogs.getActions()));
    }
}
