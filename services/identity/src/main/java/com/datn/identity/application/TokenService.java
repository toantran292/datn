package com.datn.identity.application;

import com.datn.identity.domain.token.RefreshToken;
import com.datn.identity.domain.token.RefreshTokenRepository;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

@Service
public class TokenService {
    private final JwtEncoder encoder;
    private final RefreshTokenRepository refreshTokens;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenService(JwtEncoder encoder,
                        RefreshTokenRepository refreshTokens) {
        this.encoder = encoder;
        this.refreshTokens = refreshTokens;
    }

    public String issueAccessToken(UUID userId, String email, UUID orgId, Set<String> roles) {
        return issueAccessToken(userId, email, orgId, roles, 900); // 15 minutes default
    }

    public String issueAccessToken(UUID userId, String email, UUID orgId, Set<String> roles, long ttlSeconds) {
        Instant now = Instant.now();

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer("identity")
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .claim("email", email);

        if (orgId != null) {
            claims.claim("org_id", orgId.toString());
        }
        if (roles != null && !roles.isEmpty()) {
            claims.claim("roles", roles);
        }

        return encoder.encode(JwtEncoderParameters.from(claims.build())).getTokenValue();
    }

    /**
     * Generate a secure random refresh token and store it in the database
     * @return the raw refresh token (to be sent to client)
     */
    public String issueRefreshToken(UUID userId, UUID orgId, String userAgent, String ipAddress) {
        // Generate random token (32 bytes = 256 bits)
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // Hash the token using SHA-256 for fast lookup
        String tokenHash = hashToken(rawToken);

        // Create refresh token entity
        Instant now = Instant.now();
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID(),
                userId,
                tokenHash,
                orgId,
                now.plusSeconds(30 * 24 * 3600), // 30 days
                false,
                null,
                now,
                null,
                userAgent,
                ipAddress
        );

        // Save to database
        refreshTokens.save(refreshToken);

        // Return raw token (only sent once to client)
        return rawToken;
    }

    /**
     * Validate refresh token and return the stored token entity if valid
     */
    public RefreshToken validateRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);

        var tokenOpt = refreshTokens.findByTokenHash(tokenHash);
        if (tokenOpt.isEmpty()) {
            return null;
        }

        RefreshToken token = tokenOpt.get();

        // Check if token is valid (not revoked and not expired)
        if (!token.isValid()) {
            return null;
        }

        // Update last_used_at timestamp
        RefreshToken updatedToken = new RefreshToken(
                token.id(),
                token.userId(),
                token.tokenHash(),
                token.orgId(),
                token.expiresAt(),
                token.revoked(),
                token.revokedAt(),
                token.createdAt(),
                Instant.now(), // update last_used_at
                token.userAgent(),
                token.ipAddress()
        );
        refreshTokens.save(updatedToken);

        return updatedToken;
    }

    /**
     * Revoke a refresh token
     */
    public void revokeRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        refreshTokens.revokeByTokenHash(tokenHash);
    }

    /**
     * Revoke all refresh tokens for a user
     */
    public void revokeAllUserTokens(UUID userId) {
        refreshTokens.revokeAllForUser(userId);
    }

    /**
     * Hash token using SHA-256 for fast database lookup
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}