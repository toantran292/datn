package com.datn.identity.interfaces.api;

import com.datn.identity.domain.org.MembershipRepository;
import com.datn.identity.domain.user.UserRepository;
import com.datn.identity.infrastructure.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal")
public class InternalMembershipsController {
    private final MembershipRepository memberships;
    private final UserRepository users;

    public InternalMembershipsController(MembershipRepository memberships, UserRepository users) {
        this.memberships = memberships;
        this.users = users;
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

    /**
     * Batch get users by IDs within an organization
     * Used by chat service to fetch user info for room members
     *
     * @param orgId Organization ID
     * @param userIds Comma-separated list of user IDs
     * @return List of user info for members in the org
     */
    @GetMapping("/orgs/{orgId}/users")
    public ResponseEntity<?> getBatchUsersInOrg(@PathVariable("orgId") String orgId,
                                                  @RequestParam("user_ids") String userIds) {
        try {
            var oid = UUID.fromString(orgId);

            // Parse user IDs
            var uids = Arrays.stream(userIds.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(UUID::fromString)
                    .collect(Collectors.toSet());

            if (uids.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Get all memberships for this org
            var orgMemberships = memberships.findByOrg(oid);
            var orgMemberIds = orgMemberships.stream()
                    .map(m -> m.userId())
                    .collect(Collectors.toSet());

            // Filter: only return users that are members of this org
            var validUserIds = uids.stream()
                    .filter(orgMemberIds::contains)
                    .collect(Collectors.toList());

            // Fetch user details
            var usersList = users.findByIds(validUserIds);
            var usersMap = usersList.stream()
                    .collect(Collectors.toMap(
                            com.datn.identity.domain.user.User::id,
                            u -> u
                    ));

            // Build response
            var result = validUserIds.stream()
                    .map(userId -> usersMap.get(userId))
                    .filter(Objects::nonNull)
                    .map(user -> {
                        String displayName = user.displayName();
                        // Fallback to email prefix if displayName is null
                        if (displayName == null || displayName.isBlank()) {
                            String email = user.email().value();
                            displayName = email.contains("@")
                                    ? email.substring(0, email.indexOf("@"))
                                    : email;
                        }

                        return Map.of(
                                "id", user.id().toString(),
                                "email", user.email().value(),
                                "display_name", displayName,
                                "disabled", user.disabled()
                        );
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_uuid_format"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "internal_error", "message", e.getMessage()));
        }
    }
}

