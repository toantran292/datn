package com.datn.identity.domain.events;

import com.datn.identity.common.DomainEvent;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public final class IdentityEvents {

    public record UserRegistered(UUID userId, String email, Instant occurredAt) implements DomainEvent {
        public UserRegistered(UUID userId, String email){ this(userId, email, Instant.now()); }
        @Override public String topic(){ return "identity.user.registered"; }
    }

    public record PasswordSet(UUID userId, Instant occurredAt) implements DomainEvent {
        public PasswordSet(UUID userId){ this(userId, Instant.now()); }
        public String topic() { return "identity.user.password_set"; }
    }

    public record OrganizationCreated(UUID orgId, String slug, String displayName, Instant occurredAt) implements DomainEvent {
        public OrganizationCreated(UUID orgId, String slug, String displayName){ this(orgId, slug, displayName, Instant.now()); }
        @Override public String topic(){ return "identity.organization.created"; }
    }

    public record MembershipAdded(UUID orgId, UUID userId, Set<String> roles, String memberType, Instant occurredAt) implements DomainEvent {
        public MembershipAdded(UUID orgId, UUID userId, Set<String> roles, String memberType){ this(orgId, userId, roles, memberType, Instant.now()); }
        @Override public String topic(){ return "identity.membership.added"; }
    }

    public record MembershipRemoved(UUID orgId, UUID userId, Instant occurredAt) implements DomainEvent {
        public MembershipRemoved(UUID orgId, UUID userId){ this(orgId, userId, Instant.now()); }
        @Override public String topic(){ return "identity.membership.removed"; }
    }

    public record MembershipRolesUpdated(UUID orgId, UUID userId, Set<String> roles) {
        public String topic() { return "identity.membership.roles.updated"; }
    }

    public record InvitationCreated(UUID orgId, String email, String memberType, Instant occurredAt) implements DomainEvent {
        public InvitationCreated(UUID orgId, String email, String memberType){ this(orgId, email, memberType, Instant.now()); }
        @Override public String topic(){ return "identity.invitation.created"; }
    }

    public record InvitationAccepted(UUID orgId, UUID userId, String email, Instant occurredAt) implements DomainEvent {
        public InvitationAccepted(UUID orgId, UUID userId, String email){ this(orgId, userId, email, Instant.now()); }
        @Override public String topic(){ return "identity.invitation.accepted"; }
    }

    public record RoleBindingCreated(UUID id, UUID orgId, UUID userId, Integer roleId, String scope, String scopeId, Instant occurredAt) implements DomainEvent {
        public RoleBindingCreated(UUID id, UUID orgId, UUID userId, Integer roleId, String scope, String scopeId){ this(id, orgId, userId, roleId, scope, scopeId, Instant.now()); }
        @Override public String topic(){ return "identity.rolebinding.created"; }
    }

    public record RoleBindingDeleted(UUID id, UUID orgId, UUID userId, Instant occurredAt) implements DomainEvent {
        public RoleBindingDeleted(UUID id, UUID orgId, UUID userId){ this(id, orgId, userId, Instant.now()); }
        @Override public String topic(){ return "identity.rolebinding.deleted"; }
    }
}