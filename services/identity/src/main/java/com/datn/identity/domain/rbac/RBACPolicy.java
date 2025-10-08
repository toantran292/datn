package com.datn.identity.domain.rbac;

import com.datn.identity.domain.org.MembershipRepository;

import java.util.UUID;

public interface RBACPolicy {
    default void assertActorCanBind(UUID actorUserId, UUID orgId, MembershipRepository memberships){
        var m = memberships.find(actorUserId, orgId).orElseThrow(() -> new SecurityException("not_member"));
        var can = m.roles().contains("OWNER") || m.roles().contains("ADMIN");
        if (!can) throw new SecurityException("forbidden");
    }
}