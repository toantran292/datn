package com.datn.identity.interfaces.api;

import com.datn.identity.application.RBACApplicationService;
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
    public ResponseEntity<CreateBindingRes> createBinding(
            @RequestHeader("X-User-ID") String actorUserId,
            @RequestHeader("X-Org-ID") String orgId,
            @Valid @RequestBody CreateBindingReq req
    ) {
        var id = rbac.createBinding(
                UUID.fromString(actorUserId),
                UUID.fromString(orgId),
                UUID.fromString(req.userId()),
                req.roleId(),
                req.scope(),
                req.scopeId()
        );
        return ResponseEntity.status(201).body(new CreateBindingRes(id.toString()));
    }

    @DeleteMapping("/bindings/{bindingId}")
    public ResponseEntity<?> deleteBinding(@RequestHeader("X-User-ID") String actorUserId,
                                           @RequestHeader("X-Org-ID") String orgId,
                                           @PathVariable String bindingId) {
        rbac.deleteBinding(
                UUID.fromString(actorUserId),
                UUID.fromString(orgId),
                UUID.fromString(bindingId)
        );
        return ResponseEntity.ok().build();
    }
}