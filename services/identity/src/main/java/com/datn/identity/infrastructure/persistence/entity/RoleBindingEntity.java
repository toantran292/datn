package com.datn.identity.infrastructure.persistence.entity;

import com.datn.identity.domain.rbac.ScopeType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="role_bindings")
public class RoleBindingEntity {
    @Id @Column(columnDefinition="uuid") private UUID id;
    @Column(name="org_id", columnDefinition="uuid", nullable=false) private UUID orgId;
    @Column(name="user_id", columnDefinition="uuid", nullable=false) private UUID userId;
    @Column(name="role_id", nullable=false) private Integer roleId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private ScopeType scope;
    @Column(name="scope_id") private String scopeId; // null when ORG
    @Column(name="created_at", nullable=false) private Instant createdAt;

    // getters/setters
    public UUID getId(){return id;} public void setId(UUID id){this.id=id;}
    public UUID getOrgId(){return orgId;} public void setOrgId(UUID id){this.orgId=id;}
    public UUID getUserId(){return userId;} public void setUserId(UUID id){this.userId=id;}
    public Integer getRoleId(){return roleId;} public void setRoleId(Integer r){this.roleId=r;}
    public ScopeType getScope(){return scope;} public void setScope(ScopeType s){this.scope=s;}
    public String getScopeId(){return scopeId;} public void setScopeId(String s){this.scopeId=s;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant i){this.createdAt=i;}
}