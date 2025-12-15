package com.datn.identity.interfaces.api;

import com.datn.identity.application.EmailVerificationService;
import com.datn.identity.application.UserApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {
    private final UserApplicationService userApp;
    private final EmailVerificationService emailVerificationService;

    public AuthController(UserApplicationService userApp, EmailVerificationService emailVerificationService) {
        this.userApp = userApp;
        this.emailVerificationService = emailVerificationService;
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
}