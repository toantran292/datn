package com.datn.identity.interfaces.api;

import com.datn.identity.domain.org.MembershipRepository;
import com.datn.identity.infrastructure.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/authz")
@Validated
public class AuthzController {

    private final MembershipRepository memberships;

    public AuthzController(MembershipRepository memberships) {
        this.memberships = memberships;
    }

    private static final Map<String, Set<String>> ROLE_PERMS = Map.of(
            "OWNER", Set.of(
                    "org.read","org.manage","user.invite","member.manage","rbac.manage",
                    "project.manage","project.member.manage"
            ),
            "ADMIN", Set.of(
                    "org.read","user.invite","member.manage","rbac.manage",
                    "project.manage","project.member.manage"
            ),
            "MEMBER", Set.of("org.read")
    );

    private record CheckResult(String user_id, String org_id, String permission, boolean allow, String reason) {}

    @GetMapping("/check")
    public ResponseEntity<CheckResult> check(@RequestParam("user_id") UUID userId,
                                             @RequestParam("org_id") UUID orgId,
                                             @RequestParam("permission") String permission) {
        var mOpt = memberships.find(userId, orgId);
        if (mOpt.isEmpty()) {
            return ResponseEntity.ok(new CheckResult(userId.toString(), orgId.toString(), permission, false, "not_member"));
        }

        var m = mOpt.get();
        if (m.roles().stream().anyMatch(r -> r.equalsIgnoreCase("OWNER"))) {
            return ResponseEntity.ok(new CheckResult(userId.toString(), orgId.toString(), permission, true, "owner"));
        }

        var perms = m.roles().stream()
                .map(String::toUpperCase)
                .map(ROLE_PERMS::get)
                .filter(Objects::nonNull)
                .flatMap(Set::stream)
                .collect(Collectors.toSet());

        boolean allow = perms.contains(permission.toLowerCase());
        return ResponseEntity.ok(new CheckResult(userId.toString(), orgId.toString(), permission, allow, allow ? "ok" : "forbidden"));
    }

    public record BatchCheckItem(UUID user_id, UUID org_id, String permission) {}
    public record BatchCheckResult(List<CheckResult> results) {}

    @PostMapping("/check/batch")
    public ResponseEntity<BatchCheckResult> batch(@RequestBody List<BatchCheckItem> items) {
        var results = new ArrayList<CheckResult>(items.size());
        for (var it : items) {
            var one = check(it.user_id(), it.org_id(), it.permission());
            results.add(one.getBody());
        }
        return ResponseEntity.ok(new BatchCheckResult(results));
    }

    /**
     * Check permission for the currently authenticated user
     */
    @GetMapping("/check/me")
    public ResponseEntity<CheckResult> checkMe(@RequestParam("permission") String permission) {
        UUID userId = SecurityUtils.getCurrentUserId();
        UUID orgId = SecurityUtils.getCurrentOrgId();

        if (userId == null) {
            return ResponseEntity.status(401).body(new CheckResult("", "", permission, false, "not_authenticated"));
        }
        if (orgId == null) {
            return ResponseEntity.status(400).body(new CheckResult(userId.toString(), "", permission, false, "no_org_context"));
        }

        return check(userId, orgId, permission);
    }
}
