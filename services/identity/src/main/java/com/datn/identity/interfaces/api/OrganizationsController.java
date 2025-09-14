package com.datn.identity.interfaces.api;

import com.datn.identity.application.OrganizationApplicationService;
import com.datn.identity.interfaces.api.dto.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/orgs")
@Validated
public class OrganizationsController {
    private final OrganizationApplicationService orgs;

    public OrganizationsController(OrganizationApplicationService orgs) { this.orgs = orgs; }

    @PostMapping
    public ResponseEntity<IdRes> create(@RequestHeader(value = "X-User-ID", required = false) String hdrUserId,
                                        @Valid @RequestBody CreateOrgReq req) {
        var owner = hdrUserId != null ? UUID.fromString(hdrUserId) : UUID.fromString(req.ownerUserId());
        var id = orgs.createOrg(owner, req.slug(), req.name());
        return ResponseEntity.status(201).body(new IdRes(id.toString()));
    }

    @PutMapping("/{orgId}/members/roles")
    public ResponseEntity<Void> updateMemberRoles(@RequestHeader("X-User-ID") String actorUserId,
                                                  @PathVariable String orgId,
                                                  @Valid @RequestBody UpdateMemberRolesReq req) {
        orgs.updateMemberRoles(UUID.fromString(actorUserId),
                UUID.fromString(orgId),
                UUID.fromString(req.userId()),
                req.roles() == null ? Set.of() : req.roles());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{orgId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@RequestHeader("X-User-ID") String actorUserId,
                                             @PathVariable String orgId,
                                             @PathVariable String userId) {
        orgs.removeMember(UUID.fromString(actorUserId), UUID.fromString(orgId), UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    // com.datn.identity.interfaces.api.OrganizationsController (bổ sung)
    @GetMapping("/resolve")
    public ResponseEntity<?> resolve(@RequestParam("slug") String slug) {
        return orgs.findBySlug(slug)
                .map(o -> ResponseEntity.ok(Map.of(
                        "org_id", o.id().toString(),
                        "slug", o.slug(),
                        "display_name", o.displayName()
                )))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "org_not_found")));

    }
}