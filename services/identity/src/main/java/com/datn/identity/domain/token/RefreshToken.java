package com.datn.identity.domain.token;

import java.time.Instant;
import java.util.UUID;

public record RefreshToken(
    UUID id,
    UUID userId,
    String tokenHash,
    UUID orgId,          // nullable - org context
    Instant expiresAt,
    boolean revoked,
    Instant revokedAt,
    Instant createdAt,
    Instant lastUsedAt,
    String userAgent,
    String ipAddress
) {
    public boolean isValid() {
        return !revoked && expiresAt.isAfter(Instant.now());
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }
}
