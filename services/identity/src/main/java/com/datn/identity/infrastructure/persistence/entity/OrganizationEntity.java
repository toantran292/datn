package com.datn.identity.infrastructure.persistence.entity;

import com.datn.identity.common.Slug;
import com.datn.identity.domain.org.LlmProvider;
import com.datn.identity.domain.org.OrganizationStatus;
import com.datn.identity.infrastructure.persistence.converter.SlugConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="organizations")
public class OrganizationEntity {
    @Id @Column(columnDefinition="uuid") private UUID id;

    @Convert(converter=SlugConverter.class)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name="slug", columnDefinition="citext", nullable=false, unique=true)
    private Slug slug;

    @Column(name="display_name", nullable=false)
    private String displayName;

    @Column(name="logo_asset_id")
    private String logoAssetId;

    @Column(name="description", columnDefinition="TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name="llm_provider", length=20)
    private LlmProvider llmProvider;

    @Column(name="settings", columnDefinition="jsonb")
    private String settingsJson;

    @Enumerated(EnumType.STRING)
    @Column(name="status", length=20)
    private OrganizationStatus status = OrganizationStatus.ACTIVE;

    @Column(name="lock_reason", columnDefinition="TEXT")
    private String lockReason;

    @Column(name="locked_at")
    private Instant lockedAt;

    @Column(name="locked_by")
    private UUID lockedBy;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Slug getSlug() { return slug; }
    public void setSlug(Slug s) { this.slug = s; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String n) { this.displayName = n; }

    public String getLogoAssetId() { return logoAssetId; }
    public void setLogoAssetId(String l) { this.logoAssetId = l; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LlmProvider getLlmProvider() { return llmProvider; }
    public void setLlmProvider(LlmProvider llmProvider) { this.llmProvider = llmProvider; }

    public String getSettingsJson() { return settingsJson; }
    public void setSettingsJson(String settingsJson) { this.settingsJson = settingsJson; }

    public OrganizationStatus getStatus() { return status; }
    public void setStatus(OrganizationStatus status) { this.status = status; }

    public String getLockReason() { return lockReason; }
    public void setLockReason(String lockReason) { this.lockReason = lockReason; }

    public Instant getLockedAt() { return lockedAt; }
    public void setLockedAt(Instant lockedAt) { this.lockedAt = lockedAt; }

    public UUID getLockedBy() { return lockedBy; }
    public void setLockedBy(UUID lockedBy) { this.lockedBy = lockedBy; }
}