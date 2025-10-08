// infrastructure/persistence/entity/MembershipEntity.java
package com.datn.identity.infrastructure.persistence.entity;

import com.datn.identity.domain.org.MemberType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "memberships")
public class MembershipEntity {
    @EmbeddedId
    private MembershipId id;

    // V1: roles TEXT[] NOT NULL DEFAULT '{}'
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "roles", columnDefinition = "text[]", nullable = false)
    private String[] roles = new String[0];

    @Enumerated(EnumType.STRING)
    @Column(name = "member_type", nullable = false)
    private MemberType memberType = MemberType.STAFF;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // getters/setters
    public MembershipId getId() { return id; }
    public void setId(MembershipId id) { this.id = id; }
    public String[] getRoles() { return roles; }
    public void setRoles(String[] roles) { this.roles = roles; }
    public MemberType getMemberType() { return memberType; }
    public void setMemberType(MemberType memberType) { this.memberType = memberType; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}