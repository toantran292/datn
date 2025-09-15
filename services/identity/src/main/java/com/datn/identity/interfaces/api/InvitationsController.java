package com.datn.identity.interfaces.api;

import com.datn.identity.application.InvitationApplicationService;
import com.datn.identity.domain.org.MemberType;
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
    public ResponseEntity<CreateInviteRes> create(@RequestHeader("X-User-ID") String actorUserId,
                                                  @RequestHeader("X-Org-ID") String orgId,
                                                  @Valid @RequestBody CreateInviteReq req) {
        var token = invites.createInvitation(
                UUID.fromString(actorUserId),
                UUID.fromString(orgId),
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
}