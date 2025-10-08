package com.datn.identity.interfaces.api;

import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.Locale;

@RestController
@RequestMapping("/orgs")
@Validated
public class OrganizationsController {
    private final OrganizationApplicationService orgs;

    public OrganizationsController(OrganizationApplicationService orgs) { this.orgs = orgs; }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateOrgReq req) {
        try {
            UUID owner = SecurityUtils.getCurrentUserId();
            if (owner == null) {
                // Fallback to request body if not authenticated (for backward compatibility)
                if (req.ownerUserId() != null && !req.ownerUserId().isBlank()) {
                    owner = UUID.fromString(req.ownerUserId());
                } else {
                    return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
                }
            }

            var slugNorm = normalizeSlug(req.slug());
            if (slugNorm.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "slug_invalid"));
            }

            var id = orgs.createOrg(owner, slugNorm, req.name());
            return ResponseEntity.status(201).body(new IdRes(id.toString()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            if ("slug_exists".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(Map.of("error", "slug_exists"));
            }
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orgId}/members/roles")
    public ResponseEntity<Void> updateMemberRoles(@PathVariable String orgId,
                                                  @Valid @RequestBody UpdateMemberRolesReq req) {
        UUID actorUserId = SecurityUtils.getCurrentUserId();
        if (actorUserId == null) {
            return ResponseEntity.status(401).build();
        }

        orgs.updateMemberRoles(actorUserId,
                UUID.fromString(orgId),
                UUID.fromString(req.userId()),
                req.roles() == null ? Set.of() : req.roles());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{orgId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable String orgId,
                                             @PathVariable String userId) {
        UUID actorUserId = SecurityUtils.getCurrentUserId();
        if (actorUserId == null) {
            return ResponseEntity.status(401).build();
        }

        orgs.removeMember(actorUserId, UUID.fromString(orgId), UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resolve")
    public ResponseEntity<?> resolve(@RequestParam("slug") String slug) {
        var n = normalizeSlug(slug);
        var opt = orgs.findBySlug(n);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
        }

        // Require authentication and membership
        UUID uid = SecurityUtils.getCurrentUserId();
        if (uid == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        var o = opt.get();
        if (!orgs.isMember(uid, o.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }
        return ResponseEntity.ok(Map.of(
                "org_id", o.id().toString(),
                "slug", o.slug().toString(),
                "display_name", o.displayName()
        ));
    }

    @GetMapping("/availability")
    public ResponseEntity<?> availability(@RequestParam("slug") String slug) {
        var n = normalizeSlug(slug);
        if (n.isBlank()) {
            return ResponseEntity.ok(Map.of("available", false));
        }
        var exists = orgs.findBySlug(n).isPresent();
        return ResponseEntity.ok(Map.of("available", !exists));
    }

    /**
     * Get all organizations for the current authenticated user
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyOrganizations() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        var userOrgs = orgs.findByUserId(userId);
        return ResponseEntity.ok(Map.of("organizations", userOrgs));
    }

    /**
     * Get all organizations for a specific user (admin endpoint)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrganizations(@PathVariable String userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        try {
            UUID targetUserId = UUID.fromString(userId);
            var userOrgs = orgs.findByUserId(targetUserId);
            return ResponseEntity.ok(Map.of("organizations", userOrgs));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_user_id"));
        }
    }

    private String normalizeSlug(String in) {
        if (in == null) return "";
        var s = in.trim().toLowerCase(Locale.ROOT);
        // replace any sequence of non [a-z0-9-] with '-'
        s = s.replaceAll("[^a-z0-9-]+", "-");
        // trim leading/trailing '-'
        s = s.replaceAll("^-+|-+$", "");
        return s;
    }
}
