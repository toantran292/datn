package com.datn.identity.interfaces.api;

import com.datn.identity.application.InvitationApplicationService;
import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.domain.org.MemberType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

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

    public InternalController(OrganizationApplicationService orgs, InvitationApplicationService invites) {
        this.orgs = orgs;
        this.invites = invites;
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
     * Invite member (internal use).
     */
    @PostMapping("/orgs/{orgId}/members/invite")
    public ResponseEntity<?> inviteMember(
            @PathVariable String orgId,
            @RequestBody InviteRequest request) {
        try {
            MemberType memberType = MemberType.valueOf(request.role().toUpperCase());
            String token = invites.createInvitationInternal(
                    UUID.fromString(orgId),
                    request.email(),
                    memberType
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

    public record InviteRequest(String email, String role) {}
}
