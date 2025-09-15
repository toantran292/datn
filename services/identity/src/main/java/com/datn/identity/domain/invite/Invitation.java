package com.datn.identity.domain.invite;

import com.datn.identity.domain.org.MemberType;

import java.time.Instant;
import java.util.UUID;

public final class Invitation {
    private final UUID id;
    private final UUID orgId;
    private final String email;
    private final String token;
    private final Instant createdAt;
    private final Instant acceptedAt;    // nullable
    private final MemberType memberType;

    public Invitation(UUID id, UUID orgId, String email, String token,
                      Instant createdAt, Instant acceptedAt, MemberType memberType) {
        this.id = id;
        this.orgId = orgId;
        this.email = email;
        this.token = token;
        this.createdAt = createdAt;
        this.acceptedAt = acceptedAt;
        this.memberType = memberType;
    }

    public static Invitation create(UUID orgId, String email, MemberType type) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email_required");
        }
        return new Invitation(
                UUID.randomUUID(),
                orgId,
                email.toLowerCase(),
                UUID.randomUUID().toString(), 
                Instant.now(),
                null,
                type == null ? MemberType.STAFF : type
        );
    }

    public Invitation markAccepted() {
        if (acceptedAt != null) {
            throw new IllegalStateException("already_accepted");
        }
        return new Invitation(id, orgId, email, token, createdAt, Instant.now(), memberType);
    }

    // Getters
    public UUID id() { return id; }
    public UUID orgId() { return orgId; }
    public String email() { return email; }
    public String token() { return token; }
    public Instant createdAt() { return createdAt; }
    public Instant acceptedAt() { return acceptedAt; }
    public MemberType memberType() { return memberType; }
}