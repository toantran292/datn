package com.datn.identity.interfaces.api;

import com.datn.identity.domain.org.MembershipRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal")
public class InternalMembershipsController {
    private final MembershipRepository memberships;

    public InternalMembershipsController(MembershipRepository memberships) {
        this.memberships = memberships;
    }

    @GetMapping("/memberships")
    public ResponseEntity<?> getMembership(@RequestParam("user_id") String userId,
                                           @RequestParam("org_id") String orgId) {
        var uid = UUID.fromString(userId);
        var oid = UUID.fromString(orgId);
        return memberships.find(uid, oid)
                .map(m -> ResponseEntity.ok(Map.of(
                        "user_id", m.userId().toString(),
                        "org_id", m.orgId().toString(),
                        "roles", m.roles(),
                        "member_type", m.memberType().name()
                )))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "membership_not_found")));
    }
}

