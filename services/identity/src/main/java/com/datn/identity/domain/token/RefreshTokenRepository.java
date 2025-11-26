package com.datn.identity.domain.token;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository {
    RefreshToken save(RefreshToken token);
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    void revokeByTokenHash(String tokenHash);
    void revokeAllForUser(UUID userId);
    void revokeAllForUserAndOrg(UUID userId, UUID orgId);
    void deleteExpired();
}
