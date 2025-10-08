package com.datn.identity.domain.rbac;

import java.time.Instant;
import java.util.UUID;

public final class RoleBinding {
    private final UUID id;
    private final UUID orgId;
    private final UUID userId;
    private final Integer roleId;
    private final ScopeType scope;
    private final String scopeId; // nullable for ORG
    private final Instant createdAt;

    public RoleBinding(UUID id, UUID orgId, UUID userId, Integer roleId, ScopeType scope, String scopeId, Instant createdAt) {
        this.id = id; this.orgId = orgId; this.userId = userId; this.roleId = roleId; this.scope = scope; this.scopeId = scopeId; this.createdAt = createdAt;
    }

    public static RoleBinding create(UUID orgId, UUID userId, Integer roleId, ScopeType scope, String scopeId){
        if (scope == ScopeType.ORG && scopeId != null) throw new IllegalArgumentException("org_scope_scopeId_must_null");
        if (scope == ScopeType.PROJECT && (scopeId == null || scopeId.isBlank()))
            throw new IllegalArgumentException("project_scope_scopeId_required");
        return new RoleBinding(UUID.randomUUID(), orgId, userId, roleId, scope, scopeId, Instant.now());
    }

    public UUID id(){ return id; }
    public UUID orgId(){ return orgId; }
    public UUID userId(){ return userId; }
    public Integer roleId(){ return roleId; }
    public ScopeType scope(){ return scope; }
    public String scopeId(){ return scopeId; }
    public Instant createdAt(){ return createdAt; }
}