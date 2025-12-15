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

    public record PasswordResetRequested(UUID userId, String email, String resetToken, Instant occurredAt) implements DomainEvent {
        public PasswordResetRequested(UUID userId, String email, String resetToken){ this(userId, email, resetToken, Instant.now()); }
        @Override public String topic(){ return "identity.password.reset_requested"; }
    }

    public record PasswordReset(UUID userId, Instant occurredAt) implements DomainEvent {
        public PasswordReset(UUID userId){ this(userId, Instant.now()); }
        @Override public String topic(){ return "identity.password.reset"; }
    }

    public record EmailVerified(UUID userId, String email, Instant occurredAt) implements DomainEvent {
        public EmailVerified(UUID userId, String email){ this(userId, email, Instant.now()); }
        @Override public String topic(){ return "identity.email.verified"; }
    }

    public record ProfileUpdated(UUID userId, Instant occurredAt) implements DomainEvent {
        public ProfileUpdated(UUID userId){ this(userId, Instant.now()); }
        @Override public String topic(){ return "identity.profile.updated"; }
    }

    public record PasswordChanged(UUID userId, Instant occurredAt) implements DomainEvent {
        public PasswordChanged(UUID userId){ this(userId, Instant.now()); }
        @Override public String topic(){ return "identity.password.changed"; }
    }

    public record OrganizationUpdated(UUID orgId, Instant occurredAt) implements DomainEvent {
        public OrganizationUpdated(UUID orgId){ this(orgId, Instant.now()); }
        @Override public String topic(){ return "identity.organization.updated"; }
    }

    public record OrganizationSettingsUpdated(UUID orgId, Instant occurredAt) implements DomainEvent {
        public OrganizationSettingsUpdated(UUID orgId){ this(orgId, Instant.now()); }
        @Override public String topic(){ return "identity.organization.settings_updated"; }
    }

    public record GoogleAccountLinked(UUID userId, String googleEmail, Instant occurredAt) implements DomainEvent {
        public GoogleAccountLinked(UUID userId, String googleEmail){ this(userId, googleEmail, Instant.now()); }
        @Override public String topic(){ return "identity.google.linked"; }
    }
}