package com.datn.identity.application;

import com.datn.identity.common.Email;
import com.datn.identity.domain.email.EmailService;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.domain.user.*;
import com.datn.identity.infrastructure.util.Jsons;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class PasswordResetService {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int MAX_PENDING_TOKENS = 3; // Rate limit: max 3 pending tokens per user
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordHasher hasher;
    private final PasswordPolicy passwordPolicy;
    private final EmailService emailService;
    private final OutboxRepository outbox;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public PasswordResetService(UserRepository users,
                                 PasswordResetTokenRepository resetTokens,
                                 PasswordHasher hasher,
                                 PasswordPolicy passwordPolicy,
                                 EmailService emailService,
                                 OutboxRepository outbox) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.hasher = hasher;
        this.passwordPolicy = passwordPolicy;
        this.emailService = emailService;
        this.outbox = outbox;
    }

    /**
     * Request password reset. Generates token and sends email.
     * Always returns success (202) to prevent email enumeration.
     */
    @Transactional
    public void requestPasswordReset(String emailRaw) {
        var emailCI = Email.of(emailRaw).value();

        var userOpt = users.findByEmail(emailCI);
        if (userOpt.isEmpty()) {
            // Don't reveal that email doesn't exist - just log and return
            log.info("Password reset requested for non-existent email: {}", emailCI);
            return;
        }

        var user = userOpt.get();

        // Rate limiting: check pending tokens
        int pendingCount = resetTokens.countPendingByUser(user.id());
        if (pendingCount >= MAX_PENDING_TOKENS) {
            log.warn("Rate limit exceeded for password reset. User: {}", user.id());
            // Still return success to prevent enumeration
            return;
        }

        // Generate secure random token
        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);

        // Save token
        var resetToken = PasswordResetToken.create(user.id(), tokenHash);
        resetTokens.save(resetToken);

        // Build reset link
        String resetLink = frontendUrl + "/reset-password?token=" + rawToken;

        // Send email via notification service
        emailService.sendPasswordResetEmail(emailCI, resetLink);

        // Publish event
        var evt = new IdentityEvents.PasswordResetRequested(user.id(), emailCI, resetToken.id().toString());
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));

        log.info("Password reset token created for user: {}", user.id());
    }

    /**
     * Validate a reset token without using it.
     * Used by frontend to check if token is valid before showing reset form.
     */
    public boolean validateToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        var tokenOpt = resetTokens.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            return false;
        }

        return tokenOpt.get().isValid();
    }

    /**
     * Reset password using a valid token.
     */
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = hashToken(rawToken);
        var tokenOpt = resetTokens.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            throw new IllegalArgumentException("invalid_or_expired_token");
        }

        var token = tokenOpt.get();

        if (!token.isValid()) {
            if (token.isUsed()) {
                throw new IllegalArgumentException("token_already_used");
            }
            if (token.isExpired()) {
                throw new IllegalArgumentException("token_expired");
            }
            throw new IllegalArgumentException("invalid_or_expired_token");
        }

        // Validate new password
        passwordPolicy.validate(newPassword);

        // Get user and update password
        var user = users.findById(token.userId())
                .orElseThrow(() -> new IllegalArgumentException("user_not_found"));

        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        var hash = hasher.hash(newPassword + pepper);
        users.save(user.withPasswordHash(hash).clearPasswordChangeRequirement());

        // Mark token as used
        resetTokens.save(token.markAsUsed());

        // Invalidate all other pending tokens for this user
        resetTokens.invalidateAllForUser(user.id());

        // Publish event
        var evt = new IdentityEvents.PasswordReset(user.id());
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));

        log.info("Password reset successful for user: {}", user.id());
    }

    /**
     * Generate a secure random token (32 bytes = 256 bits, URL-safe base64 encoded)
     */
    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Hash token using SHA-256 for storage
     */
    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
