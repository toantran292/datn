package com.datn.identity.interfaces.api;

import com.datn.identity.application.InvitationApplicationService;
import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.domain.org.MemberType;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.infrastructure.web.FileStorageClient;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.Locale;

@RestController
@RequestMapping("/orgs")
@Validated
public class OrganizationsController {
    private final OrganizationApplicationService orgs;
    private final InvitationApplicationService invites;
    private final FileStorageClient fileStorageClient;

    public OrganizationsController(OrganizationApplicationService orgs, InvitationApplicationService invites, FileStorageClient fileStorageClient) {
        this.orgs = orgs;
        this.invites = invites;
        this.fileStorageClient = fileStorageClient;
    }

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

    @GetMapping("/{orgId}/members")
    public ResponseEntity<?> listMembers(
            @PathVariable String orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pagedMembers = orgs.listMembers(UUID.fromString(orgId), page, size);
        return ResponseEntity.ok(pagedMembers);
    }

    @PostMapping("/{orgId}/members/invite")
    public ResponseEntity<?> inviteMember(@PathVariable String orgId,
                                          @Valid @RequestBody InviteMemberReq req) {
        UUID actorUserId = SecurityUtils.getCurrentUserId();
        if (actorUserId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        try {
            // Determine member type from role - default to STAFF
            MemberType memberType = MemberType.STAFF;

            String token = invites.createInvitation(
                    actorUserId,
                    UUID.fromString(orgId),
                    req.email(),
                    memberType
            );

            return ResponseEntity.status(201).body(Map.of(
                    "token", token,
                    "email", req.email(),
                    "status", "invited"
            ));
        } catch (IllegalStateException e) {
            if ("invite_open_exists".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(Map.of("error", "invitation_already_exists"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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

    // ==================== UC11 - Invitations Management ====================

    /**
     * List pending invitations for an organization (UC11).
     */
    @GetMapping("/{orgId}/invitations")
    public ResponseEntity<?> listInvitations(@PathVariable String orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        UUID orgUuid = UUID.fromString(orgId);
        if (!orgs.isMember(userId, orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        var pendingInvitations = invites.findPendingByOrgId(orgUuid);
        var invitationList = pendingInvitations.stream()
                .map(inv -> Map.of(
                        "id", inv.id().toString(),
                        "email", inv.email(),
                        "memberType", inv.memberType().name(),
                        "createdAt", inv.createdAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(Map.of("invitations", invitationList));
    }

    /**
     * Cancel a pending invitation (UC11).
     */
    @DeleteMapping("/{orgId}/invitations/{invitationId}")
    public ResponseEntity<?> cancelInvitation(
            @PathVariable String orgId,
            @PathVariable String invitationId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        UUID orgUuid = UUID.fromString(orgId);
        if (!orgs.isMember(userId, orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            invites.cancelInvitation(userId, orgUuid, UUID.fromString(invitationId));
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            if ("invitation_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "invitation_not_found"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            if ("invitation_already_accepted".equals(e.getMessage())) {
                return ResponseEntity.status(400).body(Map.of("error", "invitation_already_accepted"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
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

    /**
     * Get presigned URL for logo upload
     */
    @PostMapping("/{orgId}/logo/presigned-url")
    public ResponseEntity<?> getLogoPresignedUrl(
            @PathVariable String orgId,
            @Valid @RequestBody LogoPresignedUrlReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        // Verify user is member of org
        if (!orgs.isMember(userId, UUID.fromString(orgId))) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            var response = fileStorageClient.createPresignedUrl(
                    new FileStorageClient.CreatePresignedUrlRequest(
                            req.originalName(),
                            req.mimeType(),
                            req.size(),
                            "identity",
                            "Organization",
                            orgId,
                            userId.toString(),
                            List.of("logo"),
                            Map.of("orgId", orgId)
                    )
            );

            return ResponseEntity.ok(Map.of(
                    "assetId", response.assetId(),
                    "presignedUrl", response.presignedUrl(),
                    "objectKey", response.objectKey(),
                    "expiresIn", response.expiresIn()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "failed_to_create_presigned_url", "message", e.getMessage()));
        }
    }

    /**
     * Update organization logo with asset ID
     */
    @PatchMapping("/{orgId}/logo")
    public ResponseEntity<?> updateLogo(
            @PathVariable String orgId,
            @Valid @RequestBody UpdateLogoReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        // Verify user is member of org
        if (!orgs.isMember(userId, UUID.fromString(orgId))) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            orgs.updateLogo(UUID.fromString(orgId), req.assetId());
            return ResponseEntity.ok(Map.of("status", "success", "assetId", req.assetId()));
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== UC07 - Organization Settings ====================

    /**
     * Get organization details (UC07).
     */
    @GetMapping("/{orgId}")
    public ResponseEntity<?> getOrgDetail(@PathVariable String orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        if (!orgs.isMember(userId, UUID.fromString(orgId))) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            var detail = orgs.getOrgDetail(UUID.fromString(orgId));
            return ResponseEntity.ok(detail);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update organization info (UC07).
     * Partial update - only provided fields will be updated.
     */
    @PatchMapping("/{orgId}")
    public ResponseEntity<?> updateOrg(
            @PathVariable String orgId,
            @RequestBody UpdateOrgReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        UUID orgUuid = UUID.fromString(orgId);
        if (!orgs.isMember(userId, orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        // Check if org is locked
        if (orgs.isOrgLocked(orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "org_locked", "message", "Organization is locked"));
        }

        try {
            var updated = orgs.updateOrg(orgUuid, req);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get organization settings (UC07).
     */
    @GetMapping("/{orgId}/settings")
    public ResponseEntity<?> getOrgSettings(@PathVariable String orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        if (!orgs.isMember(userId, UUID.fromString(orgId))) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        try {
            var settings = orgs.getOrgSettings(UUID.fromString(orgId));
            return ResponseEntity.ok(settings);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update organization settings (UC07).
     * Partial update - only provided fields will be updated.
     */
    @PatchMapping("/{orgId}/settings")
    public ResponseEntity<?> updateOrgSettings(
            @PathVariable String orgId,
            @RequestBody UpdateOrgSettingsReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        UUID orgUuid = UUID.fromString(orgId);
        if (!orgs.isMember(userId, orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }

        // Check if org is locked
        if (orgs.isOrgLocked(orgUuid)) {
            return ResponseEntity.status(403).body(Map.of("error", "org_locked", "message", "Organization is locked"));
        }

        try {
            var settings = orgs.updateOrgSettings(orgUuid, req);
            return ResponseEntity.ok(settings);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== UC12 - Transfer Ownership ====================

    /**
     * Transfer organization ownership (UC12).
     * POST /orgs/{orgId}/transfer-ownership
     * Requires: current user is OWNER, password verification, confirmation text "TRANSFER"
     */
    @PostMapping("/{orgId}/transfer-ownership")
    public ResponseEntity<?> transferOwnership(
            @PathVariable String orgId,
            @Valid @RequestBody TransferOwnershipReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        // Validate confirmation text
        if (!"TRANSFER".equals(req.confirmation())) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_confirmation", "message", "Confirmation must be 'TRANSFER'"));
        }

        UUID orgUuid = UUID.fromString(orgId);
        UUID newOwnerId;
        try {
            newOwnerId = UUID.fromString(req.newOwnerId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_new_owner_id"));
        }

        // Cannot transfer to self
        if (userId.equals(newOwnerId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "cannot_transfer_to_self"));
        }

        try {
            var result = orgs.transferOwnership(userId, orgUuid, newOwnerId, req.password());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return switch (e.getMessage()) {
                case "org_not_found" -> ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
                case "org_locked" -> ResponseEntity.status(403).body(Map.of("error", "org_locked", "message", "Organization is locked"));
                case "not_member" -> ResponseEntity.status(403).body(Map.of("error", "not_member"));
                case "not_owner" -> ResponseEntity.status(403).body(Map.of("error", "not_owner", "message", "Only owner can transfer ownership"));
                case "invalid_password" -> ResponseEntity.status(401).body(Map.of("error", "invalid_password"));
                case "new_owner_not_member" -> ResponseEntity.status(400).body(Map.of("error", "new_owner_not_member", "message", "New owner must be a member of the organization"));
                default -> ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
            };
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
