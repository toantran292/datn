package com.datn.identity.interfaces.api.dto;

import com.datn.identity.domain.org.MemberType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public class Dtos {
    // Users
    public record CreateUserReq(@Email String email, @NotBlank String password) {}
    public record IdRes(String id) {}

    // Orgs
    public record CreateOrgReq(String ownerUserId, @NotBlank String slug, @NotBlank String name) {}
    public record InviteMemberReq(@Email String email, String role, List<String> project_ids) {}
    public record UpdateMemberRolesReq(@NotBlank String userId, Set<String> roles) {}
    public record UserOrgRes(String orgId, String slug, String displayName, Set<String> roles, String memberType) {}
    public record MemberInfo(
        String id,
        String email,
        String display_name,
        String role,
        String status,
        String avatar_url,
        String joined_at,
        Set<String> roles,
        String member_type,
        List<ProjectRoleInfo> project_roles
    ) {}
    public record ProjectRoleInfo(String project_id, String project_name, String role) {}

    // Pagination
    public record PagedResponse<T>(List<T> items, int page, int size, long total, int totalPages) {}

    // Invitations
    public record CreateInviteReq(@Email String email, MemberType memberType) {}
    public record CreateInviteRes(String token) {}
    public record AcceptInviteReq(@NotBlank String token, String password) {}
    public record AcceptInviteRes(String status, String userId, String orgId) {}

    // Me
    public record MeRes(UUID userId, String email) {}

    // Profile (UC05)
    public record UpdateProfileReq(
        String displayName,
        String phone,
        String bio,
        UUID avatarAssetId
    ) {}

    public record ProfileRes(
        String userId,
        String email,
        String displayName,
        String phone,
        String bio,
        String avatarAssetId,
        boolean emailVerified
    ) {}

    public record AvatarPresignedUrlReq(
        @NotBlank String originalName,
        @NotBlank String mimeType,
        Long size
    ) {}

    // Logo
    public record LogoPresignedUrlReq(
            @NotBlank String originalName,
            @NotBlank String mimeType,
            Long size
    ) {}
    public record UpdateLogoReq(@NotBlank String assetId) {}

    // Organization Settings (UC07)
    public record UpdateOrgReq(
        String displayName,
        String description,
        String llmProvider  // OPENAI, ANTHROPIC, GOOGLE
    ) {}

    public record UpdateOrgSettingsReq(
        Integer maxFileSizeMb,
        Integer storageLimitGb,
        List<String> allowedFileTypes,
        OrgFeatureFlagsReq features
    ) {}

    public record OrgFeatureFlagsReq(
        Boolean aiReportsEnabled,
        Boolean fileUploadEnabled,
        Boolean memberInviteEnabled
    ) {}

    public record OrgDetailRes(
        String orgId,
        String slug,
        String displayName,
        String logoAssetId,
        String description,
        String llmProvider,
        OrgSettingsRes settings,
        String status,
        String lockReason
    ) {}

    public record OrgSettingsRes(
        Integer maxFileSizeMb,
        Integer storageLimitGb,
        List<String> allowedFileTypes,
        OrgFeatureFlagsRes features
    ) {}

    public record OrgFeatureFlagsRes(
        Boolean aiReportsEnabled,
        Boolean fileUploadEnabled,
        Boolean memberInviteEnabled
    ) {}

    // Audit Log (UC10)
    public record AuditLogRes(
        String id,
        String orgId,
        String userId,
        String action,
        String category,
        String description,
        java.util.Map<String, Object> metadata,
        String ipAddress,
        String userAgent,
        String createdAt
    ) {}

    public record AuditActionInfo(
        String action,
        String category
    ) {}

    // Organization Status (UC08)
    public record LockOrgReq(
        @NotBlank String reason
    ) {}

    public record OrgStatusRes(
        String orgId,
        String slug,
        String displayName,
        String status,
        String lockReason,
        String lockedAt,
        String lockedBy
    ) {}

    public record AdminOrgListRes(
        String orgId,
        String slug,
        String displayName,
        String status,
        long memberCount,
        String createdAt
    ) {}

    // Dashboard (UC09)
    public record DashboardStatsRes(
        String orgId,
        String orgName,
        String status,
        MemberStats members,
        ActivityStats activities
    ) {}

    public record MemberStats(
        long total,
        long owners,
        long admins,
        long staff,
        long guests
    ) {}

    public record ActivityStats(
        long totalActions,
        long todayActions,
        long thisWeekActions,
        List<RecentActivityRes> recentActivities
    ) {}

    public record RecentActivityRes(
        String id,
        String userId,
        String userEmail,
        String action,
        String description,
        String createdAt
    ) {}

    // Transfer Ownership (UC12)
    public record TransferOwnershipReq(
        @NotBlank String newOwnerId,
        @NotBlank String password,
        @NotBlank String confirmation  // must be "TRANSFER"
    ) {}

    public record TransferOwnershipRes(
        String orgId,
        String previousOwnerId,
        String newOwnerId,
        String transferredAt
    ) {}

}
