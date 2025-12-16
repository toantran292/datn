package com.datn.identity.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository {

    /**
     * Save an email verification token
     */
    void save(EmailVerificationToken token);

    /**
     * Find token by its hash
     */
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    /**
     * Find the latest pending token for a user
     */
    Optional<EmailVerificationToken> findLatestPendingByUser(UUID userId);

    /**
     * Invalidate all pending tokens for a user (when email is verified)
     */
    void invalidateAllForUser(UUID userId);

    /**
     * Delete expired tokens (cleanup job)
     */
    void deleteExpired();

    /**
     * Count pending (unused, not expired) tokens for a user
     * Used for rate limiting resend
     */
    int countPendingByUser(UUID userId);
}
