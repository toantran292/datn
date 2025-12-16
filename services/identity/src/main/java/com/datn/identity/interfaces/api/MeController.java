package com.datn.identity.interfaces.api;

import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.application.InvitationApplicationService;
import com.datn.identity.application.UserApplicationService;
import com.datn.identity.domain.invite.Invitation;
import com.datn.identity.domain.org.Organization;
import com.datn.identity.domain.org.OrganizationRepository;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.infrastructure.web.FileStorageClient;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
    private final FileStorageClient fileStorageClient;
    private final UserApplicationService users;

    public MeController(OrganizationApplicationService orgs,
                       InvitationApplicationService invites,
                       OrganizationRepository orgRepo,
                       FileStorageClient fileStorageClient,
                       UserApplicationService users) {
        this.orgs = orgs;
        this.invites = invites;
        this.orgRepo = orgRepo;
        this.fileStorageClient = fileStorageClient;
        this.users = users;
    }

    /**
     * Get current user's profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }
        var profile = users.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    /**
     * Update current user's profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }
        var profile = users.updateProfile(userId, req);
        return ResponseEntity.ok(profile);
    }

    /**
     * Get presigned URL for avatar upload
     */
    @PostMapping("/avatar/presigned-url")
    public ResponseEntity<?> getAvatarPresignedUrl(@RequestBody AvatarPresignedUrlReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        var presignedReq = new FileStorageClient.CreatePresignedUrlRequest(
            req.originalName(),
            req.mimeType(),
            req.size(),
            "identity",
            "user_avatar",
            userId.toString(),
            userId.toString(),
            List.of("avatar", "user"),
            Map.of("userId", userId.toString())
        );

        var response = fileStorageClient.createPresignedUrl(presignedReq);
        return ResponseEntity.ok(Map.of(
            "assetId", response.assetId(),
            "presignedUrl", response.presignedUrl(),
            "objectKey", response.objectKey(),
            "expiresIn", response.expiresIn()
        ));
    }

    /**
     * Update user avatar after upload
     */
    @PatchMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody UpdateAvatarReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        if (req == null || req.assetId() == null || req.assetId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "assetId_required"));
        }

        // Update avatar in profile
        var updateReq = new UpdateProfileReq(null, null, null, null, null, req.assetId());
        var profile = users.updateProfile(userId, updateReq);
        return ResponseEntity.ok(profile);
    }

    public record UpdateAvatarReq(String assetId) {}

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
                    // Get full organization to access logo_asset_id
                    String logoUrl = null;
                    try {
                        Organization fullOrg = orgRepo.findById(UUID.fromString(org.orgId())).orElse(null);
                        if (fullOrg != null && fullOrg.logoAssetId() != null && !fullOrg.logoAssetId().isBlank()) {
                            // Get presigned URL for logo
                            try {
                                var presignedResponse = fileStorageClient.getPresignedGetUrl(fullOrg.logoAssetId(), 3600);
                                logoUrl = presignedResponse.presignedUrl();
                            } catch (Exception e) {
                                // Log but don't fail the request if logo URL generation fails
                                System.err.println("Failed to generate logo URL for org " + org.orgId() + ": " + e.getMessage());
                            }
                        }
                    } catch (Exception e) {
                        // Log but don't fail the request
                        System.err.println("Error getting logo for org " + org.orgId() + ": " + e.getMessage());
                    }

                    Map<String, Object> orgMap = new HashMap<>();
                    orgMap.put("id", org.orgId());
                    orgMap.put("display_name", org.displayName());
                    orgMap.put("name", org.displayName()); // Add 'name' field as alias
                    orgMap.put("slug", org.slug());
                    orgMap.put("role", org.roles().isEmpty() ? "MEMBER" : org.roles().iterator().next());
                    orgMap.put("logo_url", logoUrl != null ? logoUrl : "");
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
