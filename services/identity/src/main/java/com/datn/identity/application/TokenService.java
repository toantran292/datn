package com.datn.identity.application;

import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
public class TokenService {
    private final JwtEncoder encoder;

    public TokenService(JwtEncoder encoder) {
        this.encoder = encoder;
    }

    public String issueAccessToken(UUID userId, String email, UUID orgId, Set<String> roles) {
        Instant now = Instant.now();

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer("identity")
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(3600))
                .claim("email", email);

        if (orgId != null) {
            claims.claim("org_id", orgId.toString());
        }
        if (roles != null && !roles.isEmpty()) {
            claims.claim("roles", roles);
        }

        return encoder.encode(JwtEncoderParameters.from(claims.build())).getTokenValue();
    }
}