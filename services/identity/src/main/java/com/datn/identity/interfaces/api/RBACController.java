package com.datn.identity.interfaces.api;

import com.datn.identity.application.RBACApplicationService;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.interfaces.api.dto.RbacDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/rbac")
public class RBACController {

    private final RBACApplicationService rbac;

    public RBACController(RBACApplicationService rbac) {
        this.rbac = rbac;
    }

    @PostMapping("/bindings")
    public ResponseEntity<CreateBindingRes> createBinding(@Valid @RequestBody CreateBindingReq req) {
        UUID actorUserId = SecurityUtils.getCurrentUserId();
        UUID orgId = SecurityUtils.getCurrentOrgId();

        if (actorUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (orgId == null) {
            return ResponseEntity.status(400).build(); // Bad request - no org context
        }

        var id = rbac.createBinding(
                actorUserId,
                orgId,
                UUID.fromString(req.userId()),
                req.roleId(),
                req.scope(),
                req.scopeId()
        );
        return ResponseEntity.status(201).body(new CreateBindingRes(id.toString()));
    }

    @DeleteMapping("/bindings/{bindingId}")
    public ResponseEntity<?> deleteBinding(@PathVariable String bindingId) {
        UUID actorUserId = SecurityUtils.getCurrentUserId();
        UUID orgId = SecurityUtils.getCurrentOrgId();

        if (actorUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (orgId == null) {
            return ResponseEntity.status(400).build(); // Bad request - no org context
        }

        rbac.deleteBinding(
                actorUserId,
                orgId,
                UUID.fromString(bindingId)
        );
        return ResponseEntity.ok().build();
    }
}