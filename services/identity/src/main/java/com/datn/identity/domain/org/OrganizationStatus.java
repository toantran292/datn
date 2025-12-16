package com.datn.identity.domain.org;

/**
 * Enum representing the status of an organization.
 */
public enum OrganizationStatus {
    ACTIVE,
    LOCKED;

    public static OrganizationStatus fromString(String value) {
        if (value == null) return ACTIVE;
        return switch (value.toUpperCase()) {
            case "LOCKED" -> LOCKED;
            default -> ACTIVE;
        };
    }
}
