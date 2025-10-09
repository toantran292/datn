package com.datn.identity.interfaces.api;

import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.application.InvitationApplicationService;
import com.datn.identity.domain.invite.Invitation;
import com.datn.identity.domain.org.OrganizationRepository;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/me")
public class MeController {
    private final OrganizationApplicationService orgs;
    private final InvitationApplicationService invites;
    private final OrganizationRepository orgRepo;

    public MeController(OrganizationApplicationService orgs,
                       InvitationApplicationService invites,
                       OrganizationRepository orgRepo) {
        this.orgs = orgs;
        this.invites = invites;
        this.orgRepo = orgRepo;
    }

    /**
     * Get user's organizations and invitations in the format expected by frontend
     */
    @GetMapping("/tenants")
    public ResponseEntity<?> getTenants() {
        UUID userId = SecurityUtils.getCurrentUserId();
        String userEmail = SecurityUtils.getCurrentUserEmail();

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        if (userEmail == null) {
            return ResponseEntity.status(400).body(Map.of("error", "user_email_not_found"));
        }

        // Get user's organizations
        List<UserOrgRes> userOrgs = orgs.findByUserId(userId);
        List<Map<String, Object>> joinedOrgs = userOrgs.stream()
                .map(org -> {
                    Map<String, Object> orgMap = Map.of(
                            "id", (Object) org.orgId(),
                            "display_name", (Object) org.displayName(),
                            "slug", (Object) org.slug(),
                            "role", (Object) (org.roles().isEmpty() ? "MEMBER" : org.roles().iterator().next())
                    );
                    return orgMap;
                })
                .collect(Collectors.toList());

        // Get user's pending invitations
        List<Invitation> pendingInvites = invites.findPendingByEmail(userEmail);
        List<Map<String, Object>> invitesList = pendingInvites.stream()
                .map(invite -> {
                    // Get organization name for the invitation
                    String orgName = orgRepo.findById(invite.orgId())
                            .map(org -> org.displayName())
                            .orElse("Unknown Organization");

                    Map<String, Object> inviteMap = Map.of(
                            "token", (Object) invite.token(),
                            "org_name", (Object) orgName,
                            "inviter_email", (Object) "", // TODO: Get inviter email if needed
                            "member_type", (Object) invite.memberType().name()
                    );
                    return inviteMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "joined", joinedOrgs,
                "invites", invitesList
        ));
    }
}
