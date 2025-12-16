package com.datn.identity.domain.user;

import java.time.Instant;
import java.util.UUID;

/**
 * Password reset token entity.
 * Token is stored as hash for security.
 * Each token can only be used once.
 */
public record PasswordResetToken(
    UUID id,
    UUID userId,
    String tokenHash,      // SHA-256 hash of the actual token
    Instant expiresAt,
    Instant usedAt,        // null if not used yet
    Instant createdAt
) {
    private static final long DEFAULT_EXPIRY_HOURS = 1; // 1 hour

    public static PasswordResetToken create(UUID userId, String tokenHash) {
        return new PasswordResetToken(
            UUID.randomUUID(),
            userId,
            tokenHash,
            Instant.now().plusSeconds(DEFAULT_EXPIRY_HOURS * 3600),
            null,
            Instant.now()
        );
    }

    public boolean isValid() {
        return usedAt == null && expiresAt.isAfter(Instant.now());
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }

    public boolean isUsed() {
        return usedAt != null;
    }

    public PasswordResetToken markAsUsed() {
        return new PasswordResetToken(id, userId, tokenHash, expiresAt, Instant.now(), createdAt);
    }
}
