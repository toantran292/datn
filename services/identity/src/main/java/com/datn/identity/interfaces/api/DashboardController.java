package com.datn.identity.interfaces.api;

import com.datn.identity.application.DashboardService;
import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Dashboard operations (UC09).
 */
@RestController
@RequestMapping("/orgs/{orgId}/dashboard")
public class DashboardController {
    private final DashboardService dashboard;
    private final OrganizationApplicationService orgs;

    public DashboardController(DashboardService dashboard, OrganizationApplicationService orgs) {
        this.dashboard = dashboard;
        this.orgs = orgs;
    }

    /**
     * Get dashboard statistics for an organization.
     * GET /orgs/{orgId}/dashboard
     */
    @GetMapping
    public ResponseEntity<?> getDashboard(@PathVariable String orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        UUID orgUuid = UUID.fromString(orgId);
        if (!orgs.isMember(userId, orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            var stats = dashboard.getDashboardStats(orgUuid);
            return ResponseEntity.ok(stats);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }
}
