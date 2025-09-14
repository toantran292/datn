// src/main/java/com/datn/identity/interfaces/api/AuthTokenController.java
package com.datn.identity.interfaces.api;

import com.datn.identity.application.TokenService;
import com.datn.identity.domain.org.MembershipRepository;
import com.datn.identity.domain.user.PasswordHasher;
import com.datn.identity.domain.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

// AuthTokenController.java
@RestController
@RequestMapping("/auth")
public class AuthTokenController {
    private final UserRepository users;
    private final PasswordHasher hasher;
    private final TokenService tokens;
    private final MembershipRepository memberships;

    public AuthTokenController(UserRepository users,
                               PasswordHasher hasher,
                               TokenService tokens,
                               MembershipRepository memberships) {
        this.users = users; this.hasher = hasher; this.tokens = tokens; this.memberships = memberships;
    }

    public static class PasswordLoginReq {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
        private UUID orgId;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public UUID getOrgId() { return orgId; }
        public void setOrgId(UUID orgId) { this.orgId = orgId; }
    }

    public record TokenRes(String access_token, String token_type, long expires_in) {}

    @PostMapping("/token")
    public ResponseEntity<?> passwordLogin(@Valid @RequestBody PasswordLoginReq req) {
        final var email = req.getEmail().trim().toLowerCase();
        var u = users.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("invalid_credentials"));

        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        if (!hasher.matches(req.getPassword() + pepper, u.passwordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid_credentials"));
        }

        Set<String> roles = Set.of();
        if (req.getOrgId() != null) {
            roles = memberships.find(u.id(), req.getOrgId()).map(m -> m.roles()).orElse(Set.of());
        }

        String jwt = tokens.issueAccessToken(u.id(), u.email().value(), req.getOrgId(), roles);
        return ResponseEntity.ok(new TokenRes(jwt, "Bearer", 3600));
    }
}