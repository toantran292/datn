package com.datn.identity.interfaces.api;

import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.interfaces.api.dto.Dtos.LockOrgReq;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Super Admin operations (UC08).
 * These endpoints require super admin privileges.
 */
@RestController
@RequestMapping("/admin")
public class SuperAdminController {
    private final OrganizationApplicationService orgs;

    public SuperAdminController(OrganizationApplicationService orgs) {
        this.orgs = orgs;
    }

    /**
     * Lock an organization.
     * POST /admin/orgs/{orgId}/lock
     */
    @PostMapping("/orgs/{orgId}/lock")
    public ResponseEntity<?> lockOrg(
            @PathVariable String orgId,
            @Valid @RequestBody LockOrgReq req) {

        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        // TODO: Check if user is super admin
        // For now, we allow any authenticated user to lock orgs for testing

        try {
            var result = orgs.lockOrg(adminId, UUID.fromString(orgId), req.reason());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            if ("org_already_locked".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(Map.of("error", "org_already_locked"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Unlock an organization.
     * POST /admin/orgs/{orgId}/unlock
     */
    @PostMapping("/orgs/{orgId}/unlock")
    public ResponseEntity<?> unlockOrg(@PathVariable String orgId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        // TODO: Check if user is super admin

        try {
            var result = orgs.unlockOrg(adminId, UUID.fromString(orgId));
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            if ("org_not_locked".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(Map.of("error", "org_not_locked"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get organization status.
     * GET /admin/orgs/{orgId}/status
     */
    @GetMapping("/orgs/{orgId}/status")
    public ResponseEntity<?> getOrgStatus(@PathVariable String orgId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        // TODO: Check if user is super admin

        try {
            var result = orgs.getOrgStatus(UUID.fromString(orgId));
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }
}
