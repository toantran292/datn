package com.datn.identity.domain.org;

import java.util.List;

/**
 * Value object for organization settings.
 * Stored as JSONB in database for flexibility.
 */
public record OrganizationSettings(
    Integer maxFileSizeMb,
    Integer storageLimitGb,
    List<String> allowedFileTypes,
    FeatureFlags features
) {
    public static OrganizationSettings defaults() {
        return new OrganizationSettings(
            100,  // 100MB max file size
            10,   // 10GB storage limit
            List.of("pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "png", "jpg", "jpeg"),
            FeatureFlags.defaults()
        );
    }

    public static OrganizationSettings empty() {
        return new OrganizationSettings(null, null, null, null);
    }

    public OrganizationSettings withMaxFileSizeMb(Integer maxFileSizeMb) {
        return new OrganizationSettings(maxFileSizeMb, this.storageLimitGb, this.allowedFileTypes, this.features);
    }

    public OrganizationSettings withStorageLimitGb(Integer storageLimitGb) {
        return new OrganizationSettings(this.maxFileSizeMb, storageLimitGb, this.allowedFileTypes, this.features);
    }

    public OrganizationSettings withAllowedFileTypes(List<String> allowedFileTypes) {
        return new OrganizationSettings(this.maxFileSizeMb, this.storageLimitGb, allowedFileTypes, this.features);
    }

    public OrganizationSettings withFeatures(FeatureFlags features) {
        return new OrganizationSettings(this.maxFileSizeMb, this.storageLimitGb, this.allowedFileTypes, features);
    }

    public record FeatureFlags(
        Boolean aiReportsEnabled,
        Boolean fileUploadEnabled,
        Boolean memberInviteEnabled
    ) {
        public static FeatureFlags defaults() {
            return new FeatureFlags(true, true, true);
        }
    }
}
