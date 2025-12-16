package com.datn.identity.application;

import com.datn.identity.common.Slug;
import com.datn.identity.domain.audit.AuditAction;
import com.datn.identity.domain.audit.AuditLog;
import com.datn.identity.domain.audit.AuditLogRepository;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.org.*;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.domain.user.PasswordHasher;
import com.datn.identity.domain.user.UserRepository;
import com.datn.identity.infrastructure.web.FileStorageClient;
import com.datn.identity.interfaces.api.dto.Dtos;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationApplicationService {
    private final OrganizationRepository orgs;
    private final MembershipRepository memberships;
    private final UserRepository users;
    private final OutboxRepository outbox;
    private final AuditLogRepository auditLogs;
    private final PasswordHasher hasher;
    private final ObjectMapper mapper;
    private final FileStorageClient fileStorageClient;

    public OrganizationApplicationService(OrganizationRepository orgs,
                                          MembershipRepository memberships,
                                          UserRepository users,
                                          OutboxRepository outbox,
                                          AuditLogRepository auditLogs,
                                          PasswordHasher hasher,
                                          ObjectMapper mapper,
                                          FileStorageClient fileStorageClient) {
        this.orgs = orgs; this.memberships = memberships; this.users = users;
        this.outbox = outbox; this.auditLogs = auditLogs; this.hasher = hasher; this.mapper = mapper;
        this.fileStorageClient = fileStorageClient;
    }

    @Transactional
    public UUID createOrg(UUID ownerUserId, String slugRaw, String displayName) {
        var slug = Slug.of(slugRaw != null ? slugRaw : displayName);
        if (orgs.existsBySlug(slug.value())) throw new IllegalStateException("slug_exists");

        var org = Organization.create(slug, displayName);
        orgs.save(org);

        memberships.save(Membership.of(ownerUserId, org.id(), Set.of("OWNER"), MemberType.STAFF));

        var evt1 = new IdentityEvents.OrganizationCreated(org.id(), org.slug().value(), org.displayName());
        var evt2 = new IdentityEvents.MembershipAdded(org.id(), ownerUserId, Set.of("OWNER"), MemberType.STAFF.name());
        outbox.append(OutboxMessage.create(evt1.topic(), toJson(evt1)));
        outbox.append(OutboxMessage.create(evt2.topic(), toJson(evt2)));

        // Audit log
        auditLogs.save(AuditLog.create(org.id(), ownerUserId, AuditAction.ORG_CREATED,
            "Organization created: " + displayName,
            Map.of("slug", slug.value(), "displayName", displayName)));

        return org.id();
    }

    @Transactional
    public Dtos.PagedResponse<Dtos.MemberInfo> listMembers(UUID orgId, int page, int size) {
        long total = memberships.countByOrg(orgId);
        int totalPages = (int) Math.ceil((double) total / size);

        DateTimeFormatter formatter = DateTimeFormatter.ISO_INSTANT;

        List<Dtos.MemberInfo> items = memberships.listByOrg(orgId, page, size).stream()
                .map(m -> {
                    var userOpt = users.findById(m.userId());
                    String email = userOpt.map(u -> u.email().value()).orElse("unknown@email.com");
                    String displayName = userOpt.map(u -> u.displayName()).orElse(null);
                    String avatarAssetId = userOpt.map(u -> u.avatarAssetId()).orElse(null);

                    // Get avatar URL from file storage if asset ID exists
                    String avatarUrl = null;
                    if (avatarAssetId != null && !avatarAssetId.isBlank()) {
                        try {
                            var presignedResponse = fileStorageClient.getPresignedGetUrl(avatarAssetId, 3600);
                            avatarUrl = presignedResponse.presignedUrl();
                        } catch (Exception e) {
                            System.err.println("Failed to get avatar URL for user " + m.userId() + ": " + e.getMessage());
                        }
                    }

                    // Determine primary role for display
                    String primaryRole = m.roles().contains("OWNER") ? "owner" :
                                       m.roles().contains("ADMIN") ? "admin" :
                                       m.roles().contains("MEMBER") ? "member" : "viewer";

                    // Status based on member type (STAFF = active, GUEST = pending for now)
                    String status = m.memberType() == MemberType.STAFF ? "active" : "pending";

                    // Format joined date
                    String joinedAt = m.createdAt() != null ?
                        formatter.format(m.createdAt()) :
                        formatter.format(Instant.now());

                    return new Dtos.MemberInfo(
                        m.userId().toString(),
                        email,
                        displayName != null ? displayName : email.split("@")[0],
                        primaryRole,
                        status,
                        avatarUrl,
                        joinedAt,
                        m.roles(),
                        m.memberType().name(),
                        Collections.emptyList() // project_roles - not implemented yet
                    );
                })
                .collect(Collectors.toList());

        return new Dtos.PagedResponse<>(items, page, size, total, totalPages);
    }

    @Transactional
    public void updateMemberRoles(UUID actorUserId, UUID orgId, UUID targetUserId, Set<String> roles) {
        // TODO: inject OrgPolicy & enforce actor permission + last-owner guard
        var m = memberships.find(targetUserId, orgId).orElseThrow(() -> new IllegalStateException("not_member"));
        var oldRoles = m.roles();
        memberships.save(m.withRoles(roles));

        var evt = new IdentityEvents.MembershipRolesUpdated(orgId, targetUserId, roles);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        // Audit log
        auditLogs.save(AuditLog.create(orgId, actorUserId, AuditAction.MEMBER_ROLE_CHANGED,
            "Member roles updated for user " + targetUserId,
            Map.of("targetUserId", targetUserId.toString(), "oldRoles", oldRoles, "newRoles", roles)));
    }

    @Transactional
    public void removeMember(UUID actorUserId, UUID orgId, UUID targetUserId) {
        // TODO: OrgPolicy checks (can manage members & not removing last owner)
        memberships.delete(targetUserId, orgId);

        var evt = new IdentityEvents.MembershipRemoved(orgId, targetUserId);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        // Audit log
        auditLogs.save(AuditLog.create(orgId, actorUserId, AuditAction.MEMBER_REMOVED,
            "Member removed: " + targetUserId,
            Map.of("targetUserId", targetUserId.toString())));
    }

    /**
     * Remove member (internal use - no actor user required)
     */
    @Transactional
    public void removeMemberInternal(UUID orgId, UUID targetUserId) {
        memberships.delete(targetUserId, orgId);

        var evt = new IdentityEvents.MembershipRemoved(orgId, targetUserId);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));
    }

    /**
     * Update member roles (internal use - no actor user required)
     */
    @Transactional
    public void updateMemberRolesInternal(UUID orgId, UUID targetUserId, String newRole) {
        var m = memberships.find(targetUserId, orgId)
            .orElseThrow(() -> new IllegalStateException("not_member"));

        // Cannot change owner's role
        if (m.roles().contains("OWNER")) {
            throw new IllegalStateException("cannot_change_owner_role");
        }

        // Validate role
        if (!newRole.equals("ADMIN") && !newRole.equals("MEMBER")) {
            throw new IllegalArgumentException("invalid_role");
        }

        Set<String> newRoles = Set.of(newRole);
        memberships.save(m.withRoles(newRoles));

        var evt = new IdentityEvents.MembershipRolesUpdated(orgId, targetUserId, newRoles);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));
    }

    @Transactional
    public Optional<Organization> findBySlug(String slug) {
        return orgs.findBySlug(slug);
    }

    public boolean isMember(UUID userId, UUID orgId) {
        return memberships.find(userId, orgId).isPresent();
    }

    /**
     * Find all organizations for a user with their membership details
     */
    public List<Dtos.UserOrgRes> findByUserId(UUID userId) {
        List<Membership> userMemberships = memberships.listByUser(userId);

        return userMemberships.stream()
                .map(membership -> {
                    Optional<Organization> orgOpt = orgs.findById(membership.orgId());
                    if (orgOpt.isPresent()) {
                        Organization org = orgOpt.get();
                        return new Dtos.UserOrgRes(
                                org.id().toString(),
                                org.slug().value(),
                                org.displayName(),
                                membership.roles(),
                                membership.memberType().name()
                        );
                    }
                    return null;
                })
                .filter(org -> org != null)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateLogo(UUID orgId, String logoAssetId) {
        var org = orgs.findById(orgId).orElseThrow(() -> new IllegalStateException("org_not_found"));
        var updatedOrg = org.withLogoAssetId(logoAssetId);
        orgs.save(updatedOrg);
    }

    /**
     * Get organization details (UC07).
     */
    public Dtos.OrgDetailRes getOrgDetail(UUID orgId) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));
        return toOrgDetailRes(org);
    }

    /**
     * Update organization info (UC07).
     */
    @Transactional
    public Dtos.OrgDetailRes updateOrg(UUID orgId, Dtos.UpdateOrgReq req) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));

        LlmProvider llmProvider = req.llmProvider() != null
            ? LlmProvider.fromString(req.llmProvider())
            : null;

        var updated = org.updateInfo(req.displayName(), req.description(), llmProvider);
        orgs.save(updated);

        var evt = new IdentityEvents.OrganizationUpdated(orgId);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        // Audit log
        auditLogs.save(AuditLog.create(orgId, null, AuditAction.ORG_UPDATED,
            "Organization updated",
            Map.of("displayName", updated.displayName())));

        return toOrgDetailRes(updated);
    }

    /**
     * Get organization settings (UC07).
     */
    public Dtos.OrgSettingsRes getOrgSettings(UUID orgId) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));
        return toOrgSettingsRes(org.settings());
    }

    /**
     * Update organization settings (UC07).
     */
    @Transactional
    public Dtos.OrgSettingsRes updateOrgSettings(UUID orgId, Dtos.UpdateOrgSettingsReq req) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));

        var currentSettings = org.settings() != null ? org.settings() : OrganizationSettings.empty();

        // Build feature flags
        OrganizationSettings.FeatureFlags features = null;
        if (req.features() != null) {
            var currentFeatures = currentSettings.features() != null
                ? currentSettings.features()
                : OrganizationSettings.FeatureFlags.defaults();

            features = new OrganizationSettings.FeatureFlags(
                req.features().aiReportsEnabled() != null ? req.features().aiReportsEnabled() : currentFeatures.aiReportsEnabled(),
                req.features().fileUploadEnabled() != null ? req.features().fileUploadEnabled() : currentFeatures.fileUploadEnabled(),
                req.features().memberInviteEnabled() != null ? req.features().memberInviteEnabled() : currentFeatures.memberInviteEnabled()
            );
        }

        var newSettings = new OrganizationSettings(
            req.maxFileSizeMb() != null ? req.maxFileSizeMb() : currentSettings.maxFileSizeMb(),
            req.storageLimitGb() != null ? req.storageLimitGb() : currentSettings.storageLimitGb(),
            req.allowedFileTypes() != null ? req.allowedFileTypes() : currentSettings.allowedFileTypes(),
            features != null ? features : currentSettings.features()
        );

        var updated = org.withSettings(newSettings);
        orgs.save(updated);

        var evt = new IdentityEvents.OrganizationSettingsUpdated(orgId);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        // Audit log
        auditLogs.save(AuditLog.create(orgId, null, AuditAction.ORG_SETTINGS_UPDATED,
            "Organization settings updated", Map.of()));

        return toOrgSettingsRes(newSettings);
    }

    // ==================== UC08 - Organization Status ====================

    /**
     * Lock an organization (Super Admin only).
     */
    @Transactional
    public Dtos.OrgStatusRes lockOrg(UUID adminId, UUID orgId, String reason) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));

        if (org.isLocked()) {
            throw new IllegalStateException("org_already_locked");
        }

        var locked = org.lock(adminId, reason);
        orgs.save(locked);

        // Audit log
        auditLogs.save(AuditLog.create(orgId, adminId, AuditAction.ORG_LOCKED,
            "Organization locked: " + reason,
            Map.of("reason", reason)));

        return toOrgStatusRes(locked);
    }

    /**
     * Unlock an organization (Super Admin only).
     */
    @Transactional
    public Dtos.OrgStatusRes unlockOrg(UUID adminId, UUID orgId) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));

        if (!org.isLocked()) {
            throw new IllegalStateException("org_not_locked");
        }

        var unlocked = org.unlock();
        orgs.save(unlocked);

        // Audit log
        auditLogs.save(AuditLog.create(orgId, adminId, AuditAction.ORG_UNLOCKED,
            "Organization unlocked", Map.of()));

        return toOrgStatusRes(unlocked);
    }

    /**
     * Get organization status.
     */
    public Dtos.OrgStatusRes getOrgStatus(UUID orgId) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));
        return toOrgStatusRes(org);
    }

    /**
     * Check if organization is locked.
     */
    public boolean isOrgLocked(UUID orgId) {
        return orgs.findById(orgId)
            .map(Organization::isLocked)
            .orElse(false);
    }

    // ==================== UC12 - Transfer Ownership ====================

    /**
     * Transfer organization ownership to another member.
     * Current owner must verify with password and confirmation text.
     */
    @Transactional
    public Dtos.TransferOwnershipRes transferOwnership(UUID currentOwnerId, UUID orgId, UUID newOwnerId, String password) {
        // 1. Verify org exists
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));

        // 2. Check if org is locked
        if (org.isLocked()) {
            throw new IllegalStateException("org_locked");
        }

        // 3. Verify current user is OWNER
        var currentMembership = memberships.find(currentOwnerId, orgId)
            .orElseThrow(() -> new IllegalStateException("not_member"));
        if (!currentMembership.roles().contains("OWNER")) {
            throw new IllegalStateException("not_owner");
        }

        // 4. Verify password
        var currentUser = users.findById(currentOwnerId)
            .orElseThrow(() -> new IllegalStateException("user_not_found"));
        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        if (!hasher.matches(password + pepper, currentUser.passwordHash())) {
            throw new IllegalStateException("invalid_password");
        }

        // 5. Verify new owner is a member
        var newOwnerMembership = memberships.find(newOwnerId, orgId)
            .orElseThrow(() -> new IllegalStateException("new_owner_not_member"));

        // 6. Transfer ownership - update roles
        // Remove OWNER from current owner, add ADMIN
        Set<String> currentOwnerNewRoles = new java.util.HashSet<>(currentMembership.roles());
        currentOwnerNewRoles.remove("OWNER");
        currentOwnerNewRoles.add("ADMIN");
        memberships.save(currentMembership.withRoles(currentOwnerNewRoles));

        // Add OWNER to new owner
        Set<String> newOwnerNewRoles = new java.util.HashSet<>(newOwnerMembership.roles());
        newOwnerNewRoles.add("OWNER");
        memberships.save(newOwnerMembership.withRoles(newOwnerNewRoles));

        // 7. Publish events
        var evt1 = new IdentityEvents.MembershipRolesUpdated(orgId, currentOwnerId, currentOwnerNewRoles);
        var evt2 = new IdentityEvents.MembershipRolesUpdated(orgId, newOwnerId, newOwnerNewRoles);
        outbox.append(OutboxMessage.create(evt1.topic(), toJson(evt1)));
        outbox.append(OutboxMessage.create(evt2.topic(), toJson(evt2)));

        // 8. Audit log
        auditLogs.save(AuditLog.create(orgId, currentOwnerId, AuditAction.ORG_OWNERSHIP_TRANSFERRED,
            "Ownership transferred from " + currentOwnerId + " to " + newOwnerId,
            Map.of("previousOwnerId", currentOwnerId.toString(), "newOwnerId", newOwnerId.toString())));

        return new Dtos.TransferOwnershipRes(
            orgId.toString(),
            currentOwnerId.toString(),
            newOwnerId.toString(),
            Instant.now().toString()
        );
    }

    /**
     * Check if user is owner of organization.
     */
    public boolean isOwner(UUID userId, UUID orgId) {
        return memberships.find(userId, orgId)
            .map(m -> m.roles().contains("OWNER"))
            .orElse(false);
    }

    private Dtos.OrgStatusRes toOrgStatusRes(Organization org) {
        return new Dtos.OrgStatusRes(
            org.id().toString(),
            org.slug().value(),
            org.displayName(),
            org.status() != null ? org.status().name() : "ACTIVE",
            org.lockReason(),
            org.lockedAt() != null ? org.lockedAt().toString() : null,
            org.lockedBy() != null ? org.lockedBy().toString() : null
        );
    }

    private Dtos.OrgDetailRes toOrgDetailRes(Organization org) {
        return new Dtos.OrgDetailRes(
            org.id().toString(),
            org.slug().value(),
            org.displayName(),
            org.logoAssetId(),
            org.description(),
            org.llmProvider() != null ? org.llmProvider().name() : null,
            toOrgSettingsRes(org.settings()),
            org.status() != null ? org.status().name() : "ACTIVE",
            org.lockReason()
        );
    }

    private Dtos.OrgSettingsRes toOrgSettingsRes(OrganizationSettings settings) {
        if (settings == null) {
            return new Dtos.OrgSettingsRes(null, null, null, null);
        }

        Dtos.OrgFeatureFlagsRes features = null;
        if (settings.features() != null) {
            features = new Dtos.OrgFeatureFlagsRes(
                settings.features().aiReportsEnabled(),
                settings.features().fileUploadEnabled(),
                settings.features().memberInviteEnabled()
            );
        }

        return new Dtos.OrgSettingsRes(
            settings.maxFileSizeMb(),
            settings.storageLimitGb(),
            settings.allowedFileTypes(),
            features
        );
    }

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new RuntimeException(e); }
    }
}
