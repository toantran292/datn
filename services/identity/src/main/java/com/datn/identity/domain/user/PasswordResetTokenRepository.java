package com.datn.identity.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository {

    /**
     * Save a password reset token
     */
    void save(PasswordResetToken token);

    /**
     * Find token by its hash
     */
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /**
     * Invalidate all pending tokens for a user (when password is reset)
     */
    void invalidateAllForUser(UUID userId);

    /**
     * Delete expired tokens (cleanup job)
     */
    void deleteExpired();

    /**
     * Count pending (unused, not expired) tokens for a user
     * Used for rate limiting
     */
    int countPendingByUser(UUID userId);
}
