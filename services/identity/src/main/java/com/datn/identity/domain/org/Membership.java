package com.datn.identity.domain.org;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public final class Membership {
    private final UUID userId;
    private final UUID orgId;
    private final Set<String> roles; // OWNER, ADMIN, MEMBER...
    private final MemberType memberType;
    private final Instant createdAt;

    private Membership(UUID userId, UUID orgId, Set<String> roles, MemberType memberType, Instant createdAt){
        this.userId = userId; this.orgId = orgId;
        this.roles = Collections.unmodifiableSet(new HashSet<>(roles));
        this.memberType = memberType; this.createdAt = createdAt;
    }

    public static Membership of(UUID userId, UUID orgId, Set<String> roles, MemberType type){
        if (roles == null || roles.isEmpty()) roles = Set.of("MEMBER");
        return new Membership(userId, orgId, roles, type, Instant.now());
    }

    public boolean isOwner(){ return roles.contains("OWNER"); }
    public UUID userId(){ return userId; }
    public UUID orgId(){ return orgId; }
    public Set<String> roles(){ return roles; }
    public MemberType memberType(){ return memberType; }
    public Instant createdAt(){ return createdAt; }

    public Membership withRoles(Set<String> newRoles){
        return new Membership(userId, orgId, newRoles, memberType, createdAt);
    }
    public Membership withMemberType(MemberType t){
        return new Membership(userId, orgId, roles, t, createdAt);
    }
}