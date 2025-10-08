package com.datn.identity.interfaces.api;

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

    public AuthController(UserApplicationService userApp) {
        this.userApp = userApp;
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
}