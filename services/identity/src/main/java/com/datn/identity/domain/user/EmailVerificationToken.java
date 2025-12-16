package com.datn.identity.domain.user;

import java.time.Instant;
import java.util.UUID;

/**
 * Email verification token entity.
 * Token is stored as hash for security.
 * Each token can only be used once.
 */
public record EmailVerificationToken(
    UUID id,
    UUID userId,
    String tokenHash,      // SHA-256 hash of the actual token
    Instant expiresAt,
    Instant verifiedAt,    // null if not verified yet
    Instant createdAt
) {
    private static final long DEFAULT_EXPIRY_HOURS = 24; // 24 hours

    public static EmailVerificationToken create(UUID userId, String tokenHash) {
        return new EmailVerificationToken(
            UUID.randomUUID(),
            userId,
            tokenHash,
            Instant.now().plusSeconds(DEFAULT_EXPIRY_HOURS * 3600),
            null,
            Instant.now()
        );
    }

    public boolean isValid() {
        return verifiedAt == null && expiresAt.isAfter(Instant.now());
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }

    public boolean isVerified() {
        return verifiedAt != null;
    }

    public EmailVerificationToken markAsVerified() {
        return new EmailVerificationToken(id, userId, tokenHash, expiresAt, Instant.now(), createdAt);
    }
}
