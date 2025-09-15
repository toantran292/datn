package com.datn.identity.interfaces.api;

import com.datn.identity.application.OrganizationApplicationService;
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
    public ResponseEntity<?> create(@RequestHeader(value = "X-User-ID", required = false) String hdrUserId,
                                    @Valid @RequestBody CreateOrgReq req) {
        try {
            UUID owner;
            if (hdrUserId != null && !hdrUserId.isBlank()) {
                owner = UUID.fromString(hdrUserId);
            } else if (req.ownerUserId() != null && !req.ownerUserId().isBlank()) {
                owner = UUID.fromString(req.ownerUserId());
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "owner_required"));
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
    public ResponseEntity<Void> updateMemberRoles(@RequestHeader("X-User-ID") String actorUserId,
                                                  @PathVariable String orgId,
                                                  @Valid @RequestBody UpdateMemberRolesReq req) {
        orgs.updateMemberRoles(UUID.fromString(actorUserId),
                UUID.fromString(orgId),
                UUID.fromString(req.userId()),
                req.roles() == null ? Set.of() : req.roles());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{orgId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@RequestHeader("X-User-ID") String actorUserId,
                                             @PathVariable String orgId,
                                             @PathVariable String userId) {
        orgs.removeMember(UUID.fromString(actorUserId), UUID.fromString(orgId), UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resolve")
    public ResponseEntity<?> resolve(@RequestHeader(value = "X-User-ID", required = false) String userId,
                                     @RequestParam("slug") String slug) {
        var n = normalizeSlug(slug);
        var opt = orgs.findBySlug(n);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
        }
        // Require X-User-ID and membership
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }
        UUID uid;
        try { uid = UUID.fromString(userId); }
        catch (IllegalArgumentException e) { return ResponseEntity.status(403).body(Map.of("error", "forbidden")); }

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
