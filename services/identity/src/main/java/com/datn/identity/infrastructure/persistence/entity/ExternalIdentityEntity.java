package com.datn.identity.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@IdClass(ExternalIdentityId.class)
@Table(name = "external_identities")
public class ExternalIdentityEntity {
    @Id
    @Column(name = "provider", nullable = false)
    private String provider;

    @Id
    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name="email", columnDefinition="citext", nullable=false, unique=true)
    private String email;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}