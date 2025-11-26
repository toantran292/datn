package com.datn.identity.interfaces.api;

import com.datn.identity.application.TokenService;
import com.datn.identity.domain.org.MembershipRepository;
import com.datn.identity.domain.user.PasswordHasher;
import com.datn.identity.domain.user.UserRepository;
import com.datn.identity.infrastructure.security.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.*;

@RestController
@RequestMapping("/auth")
public class AuthTokenController {

    private final UserRepository users;
    private final PasswordHasher hasher;
    private final TokenService tokens;
    @SuppressWarnings("unused")
    private final MembershipRepository memberships; // giữ lại nếu bạn còn dùng ở nơi khác

    public AuthTokenController(UserRepository users,
                               PasswordHasher hasher,
                               TokenService tokens,
                               MembershipRepository memberships) {
        this.users = users; this.hasher = hasher; this.tokens = tokens; this.memberships = memberships;
    }

    // ======= ENV / CONFIG =======
    @Value("${uts.cookie.domain:localhost}")
    private String cookieDomain;              // prod: .unifiedteamspace.com; dev: localhost

    @Value("${uts.cookie.secure:false}")
    private boolean cookieSecure;             // prod: true (HTTPS)

    @Value("${uts.cookie.access-ttl-seconds:900}")
    private int accessTtlSeconds;             // 15m mặc định

    @Value("${uts.cookie.refresh-enabled:false}")
    private boolean refreshEnabled;

    @Value("${uts.cookie.refresh-ttl-seconds:2592000}")
    private int refreshTtlSeconds;            // 30d mặc định

    // ======= DTO =======
    public static class PasswordLoginReq {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
        // orgId bị loại khỏi login – context sẽ gửi per-request

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public record LoginRes(UUID user_id, String email, boolean need_password) {}

    // ======= API =======
    @PostMapping("/token")
    public ResponseEntity<?> passwordLogin(@Valid @RequestBody PasswordLoginReq req,
                                           HttpServletRequest httpReq,
                                           HttpServletResponse resp) {

        final var email = req.getEmail().trim().toLowerCase();
        var userOpt = users.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid_credentials"));
        }

        var u = userOpt.get();
        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        if (!hasher.matches(req.getPassword() + pepper, u.passwordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid_credentials"));
        }

        // 1) Issue access token (KHÔNG gắn org/project/roles)
        var accessToken = tokens.issueAccessToken(u.id(), u.email().value(), /*org*/ null, /*roles*/ Set.of());

        // 2) Issue refresh token
        String refreshToken = null;
        if (refreshEnabled) {
            // Extract user-agent and IP from request (if available)
            String userAgent = httpReq != null ? httpReq.getHeader("User-Agent") : null;
            String ipAddress = httpReq != null ? getClientIP(httpReq) : null;
            refreshToken = tokens.issueRefreshToken(u.id(), /*org*/ null, userAgent, ipAddress);
        }

        // 3) Set HttpOnly cookies
        addCookie(resp, "uts_at", accessToken, accessTtlSeconds, cookieSecure, cookieDomain, true);
        if (refreshEnabled && refreshToken != null) {
            addCookie(resp, "uts_rt", refreshToken, refreshTtlSeconds, cookieSecure, cookieDomain, true);
        }

        // 4) Trả về thông tin nhẹ cho FE (không chứa token)
        return ResponseEntity.ok(new LoginRes(u.id(), u.email().value(), u.mustChangePassword()));
    }

    // ======= helpers =======
    private static void addCookie(HttpServletResponse response, String name, String value,
                                  int maxAgeSeconds, boolean secure, String domain, boolean httpOnly) {
        // Cookie API không set SameSite → set header thủ công
        Cookie c = new Cookie(name, value);
        c.setPath("/");
        c.setMaxAge(maxAgeSeconds);
        c.setHttpOnly(httpOnly);
        c.setSecure(secure);

        // KHÔNG set Domain=localhost (bị reject). Prod set .unifiedteamspace.com
        if (domain != null && !domain.isBlank() && !"localhost".equalsIgnoreCase(domain)) {
            c.setDomain(domain);
        }
        response.addCookie(c);

        // Ghi thêm header Set-Cookie có SameSite=Lax để chắc chắn mọi browser hỗ trợ
        StringBuilder header = new StringBuilder()
                .append(name).append("=").append(value)
                .append("; Path=/")
                .append("; Max-Age=").append(maxAgeSeconds)
                .append(secure ? "; Secure" : "")
                .append(httpOnly ? "; HttpOnly" : "")
                .append("; SameSite=Lax");
        if (domain != null && !domain.isBlank() && !"localhost".equalsIgnoreCase(domain)) {
            header.append("; Domain=").append(domain);
        }
        response.addHeader("Set-Cookie", header.toString());
    }

        /**
     * POST /auth/logout
     * Xoá cookie phiên và (tuỳ) thu hồi refresh token.
     */
    /**
     * POST /auth/switch-org
     * Switch to a different organization - issues a new token with org_id embedded
     * Previous token becomes invalid (short TTL ensures it expires soon)
     */
    public record SwitchOrgReq(@NotBlank String org_id) {}
    public record SwitchOrgRes(String user_id, String org_id, String email, Set<String> roles) {}

    @PostMapping("/switch-org")
    public ResponseEntity<?> switchOrg(@Valid @RequestBody SwitchOrgReq req,
                                       HttpServletRequest httpReq,
                                       HttpServletResponse resp) {
        // Get current user from existing token
        UUID userId = SecurityUtils.getCurrentUserId();
        String email = SecurityUtils.getCurrentUserEmail();

        if (userId == null || email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        // Parse org_id
        UUID orgId;
        try {
            orgId = UUID.fromString(req.org_id());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", "invalid_org_id"));
        }

        // Verify user is member of this org
        var membershipOpt = memberships.find(userId, orgId);
        if (membershipOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("error", "not_member_of_org"));
        }

        var membership = membershipOpt.get();
        Set<String> roles = Set.copyOf(membership.roles());

        // Issue new access token with org_id and roles
        String accessToken = tokens.issueAccessToken(userId, email, orgId, roles);

        // Set new cookie (this invalidates old token by replacing it)
        addCookie(resp, "uts_at", accessToken, accessTtlSeconds, cookieSecure, cookieDomain, true);

        // Issue new refresh token with org context (revoke old one and create new one)
        if (refreshEnabled) {
            // Revoke all existing refresh tokens for this user+org combo
            tokens.revokeAllUserTokens(userId); // For simplicity, revoke all user tokens

            // Issue new refresh token with org context
            String userAgent = httpReq != null ? httpReq.getHeader("User-Agent") : null;
            String ipAddress = httpReq != null ? getClientIP(httpReq) : null;
            String newRefreshToken = tokens.issueRefreshToken(userId, orgId, userAgent, ipAddress);

            // Set new refresh token cookie
            addCookie(resp, "uts_rt", newRefreshToken, refreshTtlSeconds, cookieSecure, cookieDomain, true);
        }

        // Return new context
        return ResponseEntity.ok(new SwitchOrgRes(userId.toString(), orgId.toString(), email, roles));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req, HttpServletResponse resp) {
        // 1) Revoke refresh token if exists
        if (refreshEnabled) {
            String rt = readCookie(req, "uts_rt");
            if (rt != null && !rt.isBlank()) {
                try {
                    tokens.revokeRefreshToken(rt);
                } catch (Exception ignore) {
                    // Don't expose errors; continue with cookie deletion
                }
            }
        }

        // 2) Clear cookies uts_at & uts_rt
        clearCookie(resp, "uts_at", cookieSecure, cookieDomain);
        clearCookie(resp, "uts_rt", cookieSecure, cookieDomain);

        // 3) Return 204
        return ResponseEntity.noContent().build();
    }

    private static String readCookie(HttpServletRequest req, String name) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private static void clearCookie(HttpServletResponse response, String name,
                                    boolean secure, String domain) {
        // Cookie API cơ bản
        Cookie c = new Cookie(name, "");
        c.setPath("/");
        c.setMaxAge(0);
        c.setHttpOnly(true);
        c.setSecure(secure);
        if (domain != null && !domain.isBlank() && !"localhost".equalsIgnoreCase(domain)) {
            c.setDomain(domain);
        }
        response.addCookie(c);

        // Ghi thêm header để chắc chắn có SameSite=Lax và Max-Age=0
        StringBuilder header = new StringBuilder()
                .append(name).append("=").append("")
                .append("; Path=/")
                .append("; Max-Age=0")
                .append(secure ? "; Secure" : "")
                .append("; HttpOnly")
                .append("; SameSite=Lax");
        if (domain != null && !domain.isBlank() && !"localhost".equalsIgnoreCase(domain)) {
            header.append("; Domain=").append(domain);
        }
        response.addHeader("Set-Cookie", header.toString());
    }

    private static String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // If X-Forwarded-For contains multiple IPs, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * POST /auth/refresh
     * Use refresh token to get a new access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest req, HttpServletResponse resp) {
        if (!refreshEnabled) {
            return ResponseEntity.status(501).body(Map.of("error", "refresh_not_enabled"));
        }

        // 1) Read refresh token from cookie
        String refreshTokenValue = readCookie(req, "uts_rt");
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "refresh_token_missing"));
        }

        // 2) Validate refresh token
        var refreshToken = tokens.validateRefreshToken(refreshTokenValue);
        if (refreshToken == null) {
            // Clear invalid cookies
            clearCookie(resp, "uts_at", cookieSecure, cookieDomain);
            clearCookie(resp, "uts_rt", cookieSecure, cookieDomain);
            return ResponseEntity.status(401).body(Map.of("error", "invalid_refresh_token"));
        }

        // 3) Get user info
        var userOpt = users.findById(refreshToken.userId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "user_not_found"));
        }

        var user = userOpt.get();

        // 4) Check if org context exists, get roles
        UUID orgId = refreshToken.orgId();
        Set<String> roles = Set.of();

        if (orgId != null) {
            var membershipOpt = memberships.find(user.id(), orgId);
            if (membershipOpt.isPresent()) {
                roles = Set.copyOf(membershipOpt.get().roles());
            }
        }

        // 5) Issue new access token
        String newAccessToken = tokens.issueAccessToken(user.id(), user.email().value(), orgId, roles);

        // 6) Set new access token cookie
        addCookie(resp, "uts_at", newAccessToken, accessTtlSeconds, cookieSecure, cookieDomain, true);

        // 7) Return success
        return ResponseEntity.ok(Map.of(
                "user_id", user.id().toString(),
                "email", user.email().value(),
                "org_id", orgId != null ? orgId.toString() : "",
                "refreshed", true
        ));
    }
}