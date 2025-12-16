package com.datn.identity.interfaces.api;

import com.datn.identity.application.InvitationApplicationService;
import com.datn.identity.domain.org.MemberType;
import com.datn.identity.infrastructure.security.SecurityUtils;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/invitations")
public class InvitationsController {
    private final InvitationApplicationService invites;

    public InvitationsController(InvitationApplicationService invites) { this.invites = invites; }

    @PostMapping
    public ResponseEntity<CreateInviteRes> create(@Valid @RequestBody CreateInviteReq req) {
        UUID actorUserId = SecurityUtils.getCurrentUserId();
        UUID orgId = SecurityUtils.getCurrentOrgId();

        if (actorUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (orgId == null) {
            return ResponseEntity.status(400).build(); // Bad request - no org context
        }

        var token = invites.createInvitation(
                actorUserId,
                orgId,
                req.email(),
                req.memberType() == null ? MemberType.STAFF : req.memberType()
        );
        return ResponseEntity.status(201).body(new CreateInviteRes(token));
    }

    @PostMapping("/accept")
    public ResponseEntity<AcceptInviteRes> accept(@Valid @RequestBody AcceptInviteReq req) {
        var res = invites.accept(req.token(), req.password());
        return ResponseEntity.ok(new AcceptInviteRes("accepted", res.userId().toString(), res.orgId().toString()));
    }

    /**
     * Get invitation preview by token (public endpoint - no auth required)
     */
    @GetMapping("/preview")
    public ResponseEntity<?> preview(@RequestParam String token) {
        try {
            var preview = invites.getInvitationPreview(token);
            return ResponseEntity.ok(preview);
        } catch (IllegalArgumentException e) {
            if ("invitation_not_found".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(java.util.Map.of(
                    "error", "invitation_not_found",
                    "message", "This invitation link is invalid or has expired"
                ));
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            if ("invitation_already_accepted".equals(e.getMessage())) {
                return ResponseEntity.status(410).body(java.util.Map.of(
                    "error", "invitation_already_accepted",
                    "message", "This invitation has already been accepted"
                ));
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Log the unexpected error for debugging
            System.err.println("Unexpected error in preview: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                "error", "internal_error",
                "message", "An unexpected error occurred"
            ));
        }
    }
}