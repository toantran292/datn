package com.datn.identity.interfaces.api;

import com.datn.identity.application.PasswordResetService;
import com.datn.identity.application.UserApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@Validated
public class PasswordController {

    private final UserApplicationService userApp;
    private final PasswordResetService passwordResetService;

    public PasswordController(UserApplicationService userApp, PasswordResetService passwordResetService) {
        this.userApp = userApp;
        this.passwordResetService = passwordResetService;
    }

    public record SetPasswordReq(@NotBlank String newPassword) {}

    @PostMapping("/password/set")
    public ResponseEntity<Void> set(@Valid @RequestBody SetPasswordReq req) {
        UUID actorUserId = SecurityUtils.getCurrentUserId();
        if (actorUserId == null) {
            return ResponseEntity.status(401).build();
        }

        userApp.setPassword(actorUserId, req.newPassword());
        return ResponseEntity.noContent().build(); // 204
    }

    // ==================== Forgot Password Flow ====================

    public record ForgotPasswordReq(@NotBlank @Email String email) {}

    /**
     * Request password reset. Sends email with reset link.
     * Always returns 202 to prevent email enumeration.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordReq req) {
        passwordResetService.requestPasswordReset(req.email());
        return ResponseEntity.accepted().build(); // 202
    }

    public record ValidateTokenReq(@NotBlank String token) {}
    public record ValidateTokenRes(boolean valid) {}

    /**
     * Validate reset token without using it.
     * Used by frontend to check if token is valid before showing reset form.
     */
    @PostMapping("/reset-password/validate")
    public ResponseEntity<ValidateTokenRes> validateResetToken(@Valid @RequestBody ValidateTokenReq req) {
        boolean valid = passwordResetService.validateToken(req.token());
        return ResponseEntity.ok(new ValidateTokenRes(valid));
    }

    public record ResetPasswordReq(
        @NotBlank String token,
        @NotBlank String newPassword
    ) {}

    /**
     * Reset password using a valid token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordReq req) {
        passwordResetService.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.noContent().build(); // 204
    }
}