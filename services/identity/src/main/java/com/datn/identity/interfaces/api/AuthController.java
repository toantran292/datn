package com.datn.identity.interfaces.api;

import com.datn.identity.application.EmailVerificationService;
import com.datn.identity.application.TokenService;
import com.datn.identity.application.UserApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {
    private final UserApplicationService userApp;
    private final EmailVerificationService emailVerificationService;
    private final TokenService tokens;

    @Value("${uts.cookie.domain:localhost}")
    private String cookieDomain;

    @Value("${uts.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${uts.cookie.access-ttl-seconds:900}")
    private int accessTtlSeconds;

    public AuthController(UserApplicationService userApp, EmailVerificationService emailVerificationService,
                          TokenService tokens) {
        this.userApp = userApp;
        this.emailVerificationService = emailVerificationService;
        this.tokens = tokens;
    }

    public record RegisterReq(@Email @NotBlank String email, @NotBlank String password) {}
    public record RegisterRes(String user_id) {}

    @PostMapping("/register")
    public ResponseEntity<RegisterRes> register(@Valid @RequestBody RegisterReq req){
        UUID userId = userApp.register(req.email(), req.password());
        return ResponseEntity.status(201).body(new RegisterRes(userId.toString()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        String userId = SecurityUtils.getCurrentUserIdAsString();
        String orgId = SecurityUtils.getCurrentOrgIdAsString();
        String email = SecurityUtils.getCurrentUserEmail();

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        return ResponseEntity.ok(Map.of(
            "user_id", userId,
            "org_id", orgId != null ? orgId : "",
            "email", email != null ? email : "",
            "roles", SecurityUtils.getCurrentUserRoles()
        ));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify() {
        String userId = SecurityUtils.getCurrentUserIdAsString();
        String orgId = SecurityUtils.getCurrentOrgIdAsString();

        return ResponseEntity.ok(Map.of(
            "ok", true
        ));
    }

    // ==================== Email Verification ====================

    public record VerifyEmailReq(@NotBlank String token) {}
    public record VerifyEmailRes(boolean success, String message, String email) {}

    /**
     * Verify email using token from email link.
     * GET request to support direct link from email.
     */
    @GetMapping("/verify-email")
    public ResponseEntity<VerifyEmailRes> verifyEmail(@RequestParam @NotBlank String token) {
        var result = emailVerificationService.verifyEmail(token);
        if (result.success()) {
            return ResponseEntity.ok(new VerifyEmailRes(true, result.message(), result.email()));
        } else {
            return ResponseEntity.badRequest().body(new VerifyEmailRes(false, result.message(), null));
        }
    }

    /**
     * Verify email using POST request (alternative to GET).
     */
    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailRes> verifyEmailPost(@Valid @RequestBody VerifyEmailReq req) {
        var result = emailVerificationService.verifyEmail(req.token());
        if (result.success()) {
            return ResponseEntity.ok(new VerifyEmailRes(true, result.message(), result.email()));
        } else {
            return ResponseEntity.badRequest().body(new VerifyEmailRes(false, result.message(), null));
        }
    }

    public record ResendVerificationReq(@Email @NotBlank String email) {}

    /**
     * Resend verification email.
     * Always returns 202 to prevent email enumeration.
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody ResendVerificationReq req) {
        try {
            emailVerificationService.resendVerificationEmail(req.email());
            return ResponseEntity.accepted().build(); // 202
        } catch (IllegalStateException e) {
            if ("rate_limit_exceeded".equals(e.getMessage())) {
                return ResponseEntity.status(429).build(); // Too Many Requests
            }
            return ResponseEntity.accepted().build(); // Don't reveal errors
        }
    }

    public record CheckTokenReq(@NotBlank String token) {}
    public record CheckTokenRes(boolean valid) {}

    /**
     * Check if verification token is valid (for frontend).
     */
    @PostMapping("/verify-email/check")
    public ResponseEntity<CheckTokenRes> checkVerificationToken(@Valid @RequestBody CheckTokenReq req) {
        boolean valid = emailVerificationService.isTokenValid(req.token());
        return ResponseEntity.ok(new CheckTokenRes(valid));
    }

    // ==================== Password Change ====================

    public record ChangePasswordReq(
        @NotBlank String current_password,
        @NotBlank String new_password
    ) {}

    /**
     * Change password for authenticated user.
     */
    @PostMapping("/password/change")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        try {
            userApp.changePassword(userId, req.current_password(), req.new_password());
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== Link Google with Password ====================

    public record LinkGoogleReq(
        @NotBlank String google_sub,
        @NotBlank String google_email,
        @NotBlank String password
    ) {}

    /**
     * Link Google account to existing user after password verification.
     * Called when user logs in with Google but email already exists.
     * Also logs the user in by setting authentication cookies.
     */
    @PostMapping("/link-google")
    public ResponseEntity<?> linkGoogleWithPassword(@Valid @RequestBody LinkGoogleReq req,
                                                    HttpServletResponse resp) {
        try {
            var result = userApp.linkGoogleWithPasswordVerification(
                req.google_sub(),
                req.google_email(),
                req.password()
            );

            // Issue access token and set cookie (log in the user)
            var accessToken = tokens.issueAccessToken(result.userId(), result.email(), null, Set.of());
            addCookie(resp, "uts_at", accessToken, accessTtlSeconds, cookieSecure, cookieDomain, true);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "user_id", result.userId().toString(),
                "message", "Google account linked successfully"
            ));
        } catch (IllegalArgumentException e) {
            String error = e.getMessage();
            if ("invalid_credentials".equals(error)) {
                return ResponseEntity.status(401).body(Map.of("error", error));
            }
            return ResponseEntity.badRequest().body(Map.of("error", error));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Helper to set HttpOnly cookie with SameSite=Lax.
     */
    private static void addCookie(HttpServletResponse response, String name, String value,
                                  int maxAgeSeconds, boolean secure, String domain, boolean httpOnly) {
        Cookie c = new Cookie(name, value);
        c.setPath("/");
        c.setMaxAge(maxAgeSeconds);
        c.setHttpOnly(httpOnly);
        c.setSecure(secure);

        if (domain != null && !domain.isBlank() && !"localhost".equalsIgnoreCase(domain)) {
            c.setDomain(domain);
        }
        response.addCookie(c);

        // Set header with SameSite=Lax
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
}