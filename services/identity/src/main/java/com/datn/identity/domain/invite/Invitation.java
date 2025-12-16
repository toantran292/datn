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
    private final String role;           // ADMIN or MEMBER

    public Invitation(UUID id, UUID orgId, String email, String token,
                      Instant createdAt, Instant acceptedAt, MemberType memberType, String role) {
        this.id = id;
        this.orgId = orgId;
        this.email = email;
        this.token = token;
        this.createdAt = createdAt;
        this.acceptedAt = acceptedAt;
        this.memberType = memberType;
        this.role = role;
    }

    // Backward compatible constructor
    public Invitation(UUID id, UUID orgId, String email, String token,
                      Instant createdAt, Instant acceptedAt, MemberType memberType) {
        this(id, orgId, email, token, createdAt, acceptedAt, memberType, "MEMBER");
    }

    public static Invitation create(UUID orgId, String email, MemberType type, String role) {
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
                type == null ? MemberType.STAFF : type,
                role == null ? "MEMBER" : role
        );
    }

    // Backward compatible factory method
    public static Invitation create(UUID orgId, String email, MemberType type) {
        return create(orgId, email, type, "MEMBER");
    }

    public Invitation markAccepted() {
        if (acceptedAt != null) {
            throw new IllegalStateException("already_accepted");
        }
        return new Invitation(id, orgId, email, token, createdAt, Instant.now(), memberType, role);
    }

    // Getters
    public UUID id() { return id; }
    public UUID orgId() { return orgId; }
    public String email() { return email; }
    public String token() { return token; }
    public Instant createdAt() { return createdAt; }
    public Instant acceptedAt() { return acceptedAt; }
    public MemberType memberType() { return memberType; }
    public String role() { return role; }
}
