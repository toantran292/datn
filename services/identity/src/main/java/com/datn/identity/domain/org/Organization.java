package com.datn.identity.domain.org;

import com.datn.identity.common.Slug;

import java.time.Instant;
import java.util.UUID;

public record Organization(
    UUID id,
    Slug slug,
    String displayName,
    String logoAssetId,
    String description,
    LlmProvider llmProvider,
    OrganizationSettings settings,
    OrganizationStatus status,
    String lockReason,
    Instant lockedAt,
    UUID lockedBy
) {
    // Backward compatible constructor
    public Organization(UUID id, Slug slug, String displayName, String logoAssetId) {
        this(id, slug, displayName, logoAssetId, null, null, OrganizationSettings.empty(),
             OrganizationStatus.ACTIVE, null, null, null);
    }

    // Constructor without status fields (backward compatibility)
    public Organization(UUID id, Slug slug, String displayName, String logoAssetId,
                       String description, LlmProvider llmProvider, OrganizationSettings settings) {
        this(id, slug, displayName, logoAssetId, description, llmProvider, settings,
             OrganizationStatus.ACTIVE, null, null, null);
    }

    public static Organization create(Slug slug, String displayName) {
        if (displayName == null || displayName.isBlank()) throw new IllegalArgumentException("org_display_name_required");
        return new Organization(UUID.randomUUID(), slug, displayName.trim(), null, null, null,
                               OrganizationSettings.empty(), OrganizationStatus.ACTIVE, null, null, null);
    }

    public boolean isLocked() {
        return status == OrganizationStatus.LOCKED;
    }

    public boolean isActive() {
        return status == OrganizationStatus.ACTIVE;
    }

    public Organization withLogoAssetId(String logoAssetId) {
        return new Organization(id, slug, displayName, logoAssetId, description, llmProvider, settings,
                               status, lockReason, lockedAt, lockedBy);
    }

    public Organization withDisplayName(String displayName) {
        return new Organization(id, slug, displayName, logoAssetId, description, llmProvider, settings,
                               status, lockReason, lockedAt, lockedBy);
    }

    public Organization withDescription(String description) {
        return new Organization(id, slug, displayName, logoAssetId, description, llmProvider, settings,
                               status, lockReason, lockedAt, lockedBy);
    }

    public Organization withLlmProvider(LlmProvider llmProvider) {
        return new Organization(id, slug, displayName, logoAssetId, description, llmProvider, settings,
                               status, lockReason, lockedAt, lockedBy);
    }

    public Organization withSettings(OrganizationSettings settings) {
        return new Organization(id, slug, displayName, logoAssetId, description, llmProvider, settings,
                               status, lockReason, lockedAt, lockedBy);
    }

    public Organization updateInfo(String newDisplayName, String newDescription, LlmProvider newLlmProvider) {
        return new Organization(
            id,
            slug,
            newDisplayName != null ? newDisplayName : displayName,
            logoAssetId,
            newDescription != null ? newDescription : description,
            newLlmProvider != null ? newLlmProvider : llmProvider,
            settings,
            status,
            lockReason,
            lockedAt,
            lockedBy
        );
    }

    public Organization lock(UUID adminId, String reason) {
        return new Organization(id, slug, displayName, logoAssetId, description, llmProvider, settings,
                               OrganizationStatus.LOCKED, reason, Instant.now(), adminId);
    }

    public Organization unlock() {
        return new Organization(id, slug, displayName, logoAssetId, description, llmProvider, settings,
                               OrganizationStatus.ACTIVE, null, null, null);
    }
}
