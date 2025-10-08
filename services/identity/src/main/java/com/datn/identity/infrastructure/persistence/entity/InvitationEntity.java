// infrastructure/persistence/entity/InvitationEntity.java
package com.datn.identity.infrastructure.persistence.entity;

import com.datn.identity.domain.org.MemberType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invitations")
public class InvitationEntity {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "org_id", columnDefinition = "uuid", nullable = false)
    private UUID orgId;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "email", columnDefinition = "citext", nullable = false)
    private String email;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_type", nullable = false)
    private MemberType memberType = MemberType.STAFF;

    // getters/setters ...
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getOrgId() { return orgId; }
    public void setOrgId(UUID orgId) { this.orgId = orgId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }
    public MemberType getMemberType() { return memberType; }
    public void setMemberType(MemberType memberType) { this.memberType = memberType; }
}