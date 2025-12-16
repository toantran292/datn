package com.datn.identity.application;

import com.datn.identity.common.Email;
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
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class EmailVerificationService {
    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final int MAX_PENDING_TOKENS = 3; // Rate limit: max 3 pending tokens per user
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String EMAIL_TOPIC = "notification.email.send";

    private final UserRepository users;
    private final EmailVerificationTokenRepository verificationTokens;
    private final OutboxRepository outbox;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public EmailVerificationService(UserRepository users,
                                     EmailVerificationTokenRepository verificationTokens,
                                     OutboxRepository outbox) {
        this.users = users;
        this.verificationTokens = verificationTokens;
        this.outbox = outbox;
    }

    /**
     * Create verification token for a newly registered user and send email.
     * Called from register flow.
     */
    @Transactional
    public void sendVerificationEmail(UUID userId, String email) {
        // Generate secure random token
        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);

        // Save token
        var verificationToken = EmailVerificationToken.create(userId, tokenHash);
        verificationTokens.save(verificationToken);

        // Build verification link
        String verifyLink = frontendUrl + "/verify-email?token=" + rawToken;

        // Publish email event
        var payload = new EmailVerificationPayload(
            email,
            "Verify Your Email Address",
            "EMAIL_VERIFICATION",
            verifyLink,
            Instant.now()
        );
        outbox.append(OutboxMessage.create(EMAIL_TOPIC, Jsons.toJson(payload)));

        log.info("Verification email sent to: {}", email);
    }

    /**
     * Resend verification email.
     * Rate limited to prevent abuse.
     */
    @Transactional
    public void resendVerificationEmail(String emailRaw) {
        var emailCI = Email.of(emailRaw).value();

        var userOpt = users.findByEmail(emailCI);
        if (userOpt.isEmpty()) {
            // Don't reveal that email doesn't exist
            log.info("Resend verification requested for non-existent email: {}", emailCI);
            return;
        }

        var user = userOpt.get();

        // Check if already verified
        if (user.isEmailVerified()) {
            log.info("Resend verification requested for already verified email: {}", emailCI);
            return;
        }

        // Rate limiting
        int pendingCount = verificationTokens.countPendingByUser(user.id());
        if (pendingCount >= MAX_PENDING_TOKENS) {
            log.warn("Rate limit exceeded for email verification resend. User: {}", user.id());
            throw new IllegalStateException("rate_limit_exceeded");
        }

        // Send new verification email
        sendVerificationEmail(user.id(), emailCI);
    }

    /**
     * Verify email using token.
     */
    @Transactional
    public VerificationResult verifyEmail(String rawToken) {
        String tokenHash = hashToken(rawToken);
        var tokenOpt = verificationTokens.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            return new VerificationResult(false, "invalid_token", null);
        }

        var token = tokenOpt.get();

        if (token.isVerified()) {
            return new VerificationResult(false, "token_already_used", null);
        }

        if (token.isExpired()) {
            return new VerificationResult(false, "token_expired", null);
        }

        // Get user and mark email as verified
        var user = users.findById(token.userId())
                .orElseThrow(() -> new IllegalArgumentException("user_not_found"));

        if (user.isEmailVerified()) {
            return new VerificationResult(true, "already_verified", user.email().value());
        }

        // Mark user email as verified
        users.save(user.markEmailVerified());

        // Mark token as used
        verificationTokens.save(token.markAsVerified());

        // Invalidate all other pending tokens
        verificationTokens.invalidateAllForUser(user.id());

        // Publish event
        var evt = new IdentityEvents.EmailVerified(user.id(), user.email().value());
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));

        log.info("Email verified for user: {}", user.id());

        return new VerificationResult(true, "verified", user.email().value());
    }

    /**
     * Check if a token is valid (for frontend validation before showing form)
     */
    public boolean isTokenValid(String rawToken) {
        String tokenHash = hashToken(rawToken);
        var tokenOpt = verificationTokens.findByTokenHash(tokenHash);
        return tokenOpt.isPresent() && tokenOpt.get().isValid();
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record VerificationResult(boolean success, String message, String email) {}

    public record EmailVerificationPayload(
        String toEmail,
        String subject,
        String templateType,
        String verifyLink,
        Instant occurredAt
    ) {}
}
