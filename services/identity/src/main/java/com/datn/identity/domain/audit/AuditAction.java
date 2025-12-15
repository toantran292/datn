package com.datn.identity.domain.audit;

/**
 * Enum defining all auditable actions in the system.
 */
public enum AuditAction {
    // User actions
    USER_REGISTERED,
    USER_LOGIN,
    USER_LOGIN_FAILED,
    USER_LOGOUT,
    USER_PROFILE_UPDATED,
    USER_PASSWORD_CHANGED,
    USER_PASSWORD_RESET_REQUESTED,
    USER_PASSWORD_RESET,
    USER_EMAIL_VERIFIED,

    // Organization actions
    ORG_CREATED,
    ORG_UPDATED,
    ORG_SETTINGS_UPDATED,
    ORG_LOGO_UPDATED,
    ORG_LOCKED,
    ORG_UNLOCKED,
    ORG_OWNERSHIP_TRANSFERRED,

    // Membership actions
    MEMBER_INVITED,
    MEMBER_JOINED,
    MEMBER_REMOVED,
    MEMBER_ROLE_CHANGED,
    INVITATION_ACCEPTED,
    INVITATION_REJECTED,
    INVITATION_CANCELLED,
    INVITATION_EXPIRED,

    // File actions
    FILE_UPLOADED,
    FILE_DELETED,
    FILE_DOWNLOADED,
    FILE_METADATA_UPDATED,

    // Report actions
    REPORT_CREATED,
    REPORT_EXPORTED,
    REPORT_DELETED;

    public String getCategory() {
        String name = this.name();
        if (name.startsWith("USER_")) return "USER";
        if (name.startsWith("ORG_")) return "ORGANIZATION";
        if (name.startsWith("MEMBER_") || name.startsWith("INVITATION_")) return "MEMBERSHIP";
        if (name.startsWith("FILE_")) return "FILE";
        if (name.startsWith("REPORT_")) return "REPORT";
        return "OTHER";
    }
}
