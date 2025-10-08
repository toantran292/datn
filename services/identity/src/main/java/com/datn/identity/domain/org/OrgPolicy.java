package com.datn.identity.domain.org;

import java.util.Set;
import java.util.UUID;

public interface OrgPolicy {
    default void assertActorCanManageMembers(UUID actorUserId, UUID orgId, MembershipRepository memberships){
        var m = memberships.find(actorUserId, orgId).orElseThrow(() -> new SecurityException("not_member"));
        var can = m.roles().contains("OWNER") || m.roles().contains("ADMIN");
        if (!can) throw new SecurityException("forbidden");
    }

    default void assertNotRemovingLastOwner(UUID userId, UUID orgId, MembershipRepository memberships, Set<String> remainingRoles){
        var m = memberships.find(userId, orgId).orElseThrow();
        if (m.isOwner() && (remainingRoles == null || !remainingRoles.contains("OWNER"))){
            if (memberships.countOwners(orgId) <= 1) throw new IllegalStateException("last_owner_cannot_be_removed");
        }
    }
}