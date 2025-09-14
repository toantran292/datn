package com.datn.identity.interfaces.api;

import com.datn.identity.application.UserApplicationService;
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

    // Optional: tiện test nhanh
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("X-User-ID") String userId,
                                @RequestHeader("X-Org-ID") String orgId) {
        return ResponseEntity.ok(new Object() {
            public final String user_id = userId;
            public final String org_id = orgId;
        });
    }
}