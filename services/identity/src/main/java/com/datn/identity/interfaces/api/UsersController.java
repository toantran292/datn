package com.datn.identity.interfaces.api;

import com.datn.identity.application.UserApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UsersController {
    private final UserApplicationService users;

    public UsersController(UserApplicationService users) { this.users = users; }

    @PostMapping
    public ResponseEntity<IdRes> create(@Valid @RequestBody CreateUserReq req) {
        var id = users.register(req.email(), req.password());
        return ResponseEntity.status(201).body(new IdRes(id.toString()));
    }

    /**
     * Get current user's profile (UC05).
     */
    @GetMapping("/me")
    public ResponseEntity<ProfileRes> getMyProfile() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        var profile = users.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    /**
     * Update current user's profile (UC05).
     * Supports partial updates - only provided fields will be updated.
     */
    @PatchMapping("/me")
    public ResponseEntity<ProfileRes> updateMyProfile(@RequestBody UpdateProfileReq req) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        var profile = users.updateProfile(userId, req);
        return ResponseEntity.ok(profile);
    }
}
