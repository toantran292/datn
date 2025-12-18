package com.datn.identity.interfaces.api;

import com.datn.identity.application.DashboardService;
import com.datn.identity.application.InvitationApplicationService;
import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.interfaces.api.dto.Dtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Internal endpoints for service-to-service communication (BFF calls).
 * These endpoints bypass authentication checks and should only be called
 * from trusted internal services.
 */
@RestController
@RequestMapping("/internal")
public class InternalController {
    private final OrganizationApplicationService orgs;
    private final InvitationApplicationService invites;
    private final DashboardService dashboard;
    private final JdbcTemplate jdbc;

    public InternalController(OrganizationApplicationService orgs, InvitationApplicationService invites, DashboardService dashboard, JdbcTemplate jdbc) {
        this.orgs = orgs;
        this.invites = invites;
        this.dashboard = dashboard;
        this.jdbc = jdbc;
    }

    /**
     * Get dashboard statistics for an organization (internal use).
     * GET /internal/orgs/{orgId}/dashboard
     */
    @GetMapping("/orgs/{orgId}/dashboard")
    public ResponseEntity<?> getDashboard(@PathVariable String orgId) {
        try {
            var stats = dashboard.getDashboardStats(UUID.fromString(orgId));
            return ResponseEntity.ok(stats);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * List members for an organization (internal use).
     */
    @GetMapping("/orgs/{orgId}/members")
    public ResponseEntity<?> listMembers(
            @PathVariable String orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pagedMembers = orgs.listMembers(UUID.fromString(orgId), page, size);
        return ResponseEntity.ok(pagedMembers);
    }

    /**
     * List pending invitations for an organization (internal use).
     */
    @GetMapping("/orgs/{orgId}/invitations")
    public ResponseEntity<?> listInvitations(@PathVariable String orgId) {
        UUID orgUuid = UUID.fromString(orgId);
        var pendingInvitations = invites.findPendingByOrgId(orgUuid);
        var invitationList = pendingInvitations.stream()
                .map(inv -> Map.of(
                        "id", inv.id().toString(),
                        "email", inv.email(),
                        "memberType", inv.memberType().name(),
                        "role", inv.role(),
                        "createdAt", inv.createdAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(Map.of("invitations", invitationList));
    }

    /**
     * Cancel invitation (internal use).
     */
    @DeleteMapping("/orgs/{orgId}/invitations/{invitationId}")
    public ResponseEntity<?> cancelInvitation(
            @PathVariable String orgId,
            @PathVariable String invitationId) {
        try {
            // For internal calls, we skip the user membership check
            invites.cancelInvitationInternal(UUID.fromString(orgId), UUID.fromString(invitationId));
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            if ("invitation_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "invitation_not_found"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Remove member (internal use).
     */
    @DeleteMapping("/orgs/{orgId}/members/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable String orgId,
            @PathVariable String userId) {
        try {
            orgs.removeMemberInternal(UUID.fromString(orgId), UUID.fromString(userId));
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update member role (internal use).
     * Role should be ADMIN or MEMBER.
     */
    @PatchMapping("/orgs/{orgId}/members/{userId}/role")
    public ResponseEntity<?> updateMemberRole(
            @PathVariable String orgId,
            @PathVariable String userId,
            @RequestBody UpdateRoleRequest request) {
        try {
            String role = request.role().toUpperCase();
            orgs.updateMemberRolesInternal(UUID.fromString(orgId), UUID.fromString(userId), role);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalStateException e) {
            if ("not_member".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "member_not_found"));
            }
            if ("cannot_change_owner_role".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(Map.of("error", "cannot_change_owner_role"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            if ("invalid_role".equals(e.getMessage())) {
                return ResponseEntity.badRequest().body(Map.of("error", "invalid_role", "message", "Role must be ADMIN or MEMBER"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Invite member (internal use).
     * Role should be ADMIN or MEMBER.
     */
    @PostMapping("/orgs/{orgId}/members/invite")
    public ResponseEntity<?> inviteMember(
            @PathVariable String orgId,
            @RequestBody InviteRequest request) {
        try {
            // Validate role
            String role = request.role().toUpperCase();
            if (!role.equals("ADMIN") && !role.equals("MEMBER")) {
                return ResponseEntity.badRequest().body(Map.of("error", "invalid_role", "message", "Role must be ADMIN or MEMBER"));
            }

            String token = invites.createInvitationInternal(
                    UUID.fromString(orgId),
                    request.email(),
                    role
            );
            return ResponseEntity.ok(Map.of("token", token));
        } catch (IllegalStateException e) {
            if ("invite_open_exists".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(Map.of("error", "invite_open_exists"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Resend invitation email (internal use).
     */
    @PostMapping("/orgs/{orgId}/invitations/{invitationId}/resend")
    public ResponseEntity<?> resendInvitation(
            @PathVariable String orgId,
            @PathVariable String invitationId) {
        try {
            invites.resendInvitationInternal(UUID.fromString(orgId), UUID.fromString(invitationId));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            if ("invitation_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "invitation_not_found"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            if ("invitation_already_accepted".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(Map.of("error", "invitation_already_accepted"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== Organization Settings Internal Endpoints ====================

    /**
     * Get organization details (internal use).
     */
    @GetMapping("/orgs/{orgId}")
    public ResponseEntity<?> getOrgDetail(@PathVariable String orgId) {
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
     * Update organization info (internal use).
     */
    @PatchMapping("/orgs/{orgId}")
    public ResponseEntity<?> updateOrg(
            @PathVariable String orgId,
            @RequestBody Dtos.UpdateOrgReq req) {
        try {
            var updated = orgs.updateOrg(UUID.fromString(orgId), req);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update organization logo (internal use).
     */
    @PatchMapping("/orgs/{orgId}/logo")
    public ResponseEntity<?> updateLogo(
            @PathVariable String orgId,
            @RequestBody UpdateLogoRequest req) {
        try {
            orgs.updateLogo(UUID.fromString(orgId), req.logoUrl());
            return ResponseEntity.ok(Map.of("status", "success", "logoUrl", req.logoUrl() != null ? req.logoUrl() : ""));
        } catch (IllegalStateException e) {
            if ("org_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(Map.of("error", "org_not_found"));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete organization (internal use).
     * Note: This is a soft delete - marks org as deleted.
     */
    @DeleteMapping("/orgs/{orgId}")
    public ResponseEntity<?> deleteOrg(@PathVariable String orgId) {
        try {
            // For now, we don't actually delete orgs - just return success
            // In the future, implement soft delete or archive functionality
            return ResponseEntity.ok(Map.of("status", "success", "message", "Organization deletion is not yet implemented"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    public record InviteRequest(String email, String role) {}
    public record UpdateRoleRequest(String role) {}
    public record UpdateLogoRequest(String logoUrl) {}

    // ==================== System Admin Check ====================

    /**
     * Check if a user is a system admin (ROOT or SYS_ADMIN role).
     * Used by meet-api for admin meeting management.
     * GET /internal/users/{userId}/is-system-admin
     */
    @GetMapping("/users/{userId}/is-system-admin")
    public ResponseEntity<?> isSystemAdmin(@PathVariable String userId) {
        try {
            UUID uid = UUID.fromString(userId);

            // Query role_bindings for system-level roles (ROOT or SYS_ADMIN)
            String sql = """
                SELECT r.name FROM role_bindings rb
                JOIN roles r ON r.id = rb.role_id
                WHERE rb.user_id = ?
                  AND rb.scope = 'SYSTEM'
                  AND rb.org_id IS NULL
                  AND r.name IN ('ROOT', 'SYS_ADMIN')
                """;

            List<String> systemRoles = jdbc.queryForList(sql, String.class, uid);
            boolean isAdmin = !systemRoles.isEmpty();

            return ResponseEntity.ok(Map.of(
                    "user_id", userId,
                    "is_system_admin", isAdmin,
                    "system_roles", systemRoles
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_uuid_format"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "internal_error", "message", e.getMessage()));
        }
    }
}
