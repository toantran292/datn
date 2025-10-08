package com.datn.identity.domain.invite;

import com.datn.identity.domain.org.MembershipRepository;

import java.util.Arrays;
import java.util.UUID;

public interface InvitationPolicy {
    default void assertActorCanInvite(UUID actorUserId, UUID orgId, MembershipRepository memberships){
        var m = memberships.find(actorUserId, orgId).orElseThrow(() -> new SecurityException("not_member"));
        var can = m.roles().contains("OWNER") || m.roles().contains("ADMIN");
        if (!can) throw new SecurityException("forbidden");
    }

    default void assertRolesWithinActorPower(UUID actorUserId, UUID orgId, String[] roles, MembershipRepository memberships){
        var m = memberships.find(actorUserId, orgId).orElseThrow();
        if (m.roles().contains("OWNER")) return;
        if (Arrays.stream(roles).anyMatch(r -> r.equalsIgnoreCase("OWNER")))
            throw new SecurityException("cannot_grant_owner");
    }

    default void ensureNoOpenInvite(UUID orgId, String emailCI, InvitationRepository invites){
        if (invites.existsOpenByEmail(orgId, emailCI.toLowerCase()))
            throw new IllegalStateException("invite_exists");
    }
}