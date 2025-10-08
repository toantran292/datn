package com.datn.identity.interfaces.api;

import com.datn.identity.application.UserApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
