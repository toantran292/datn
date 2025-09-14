package com.datn.identity.interfaces.api;

import com.datn.identity.application.UserApplicationService;
import jakarta.validation.Valid;
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

    public PasswordController(UserApplicationService userApp) {
        this.userApp = userApp;
    }

    public record SetPasswordReq(@NotBlank String newPassword) {}

    @PostMapping("/password/set")
    public ResponseEntity<Void> set(@RequestHeader("X-User-ID") String actorUserId,
                                    @Valid @RequestBody SetPasswordReq req) {
        // actorUserId đến từ HeaderAuthFilter (dev) hoặc từ JWT (prod)
        userApp.setPassword(UUID.fromString(actorUserId), req.newPassword());
        return ResponseEntity.noContent().build(); // 204
    }
}