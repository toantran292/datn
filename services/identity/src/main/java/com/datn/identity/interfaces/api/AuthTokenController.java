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

        // 2) (tuỳ) issue refresh token
        String refreshToken = null;
        if (refreshEnabled) {
            refreshToken = tokens.issueAccessToken(u.id(), u.email().value(), null, Set.of());
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
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req, HttpServletResponse resp) {
        // // 1) Nếu dùng refresh token server-side → thu hồi
        // if (refreshEnabled) {
        //     String rt = readCookie(req, "uts_rt");
        //     if (rt != null && !rt.isBlank()) {
        //         try {
        //             // Nếu TokenService có hàm revoke/blacklist, gọi ở đây
        //             tokens.revokeAccessToken(rt);
        //         } catch (Exception ignore) {
        //             // không lộ lỗi ra ngoài; vẫn tiếp tục xoá cookie
        //         }
        //     }
        // }

        // 2) Xoá cookie uts_at & uts_rt
        clearCookie(resp, "uts_at", cookieSecure, cookieDomain);
        clearCookie(resp, "uts_rt", cookieSecure, cookieDomain);

        // 3) Trả 204
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
}