package com.datn.identity.application;

import com.datn.identity.common.Email;
import com.datn.identity.domain.audit.AuditAction;
import com.datn.identity.domain.audit.AuditLog;
import com.datn.identity.domain.audit.AuditLogRepository;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.invite.Invitation;
import com.datn.identity.domain.invite.InvitationRepository;
import com.datn.identity.domain.org.MemberType;
import com.datn.identity.domain.org.Membership;
import com.datn.identity.domain.org.MembershipRepository;
import com.datn.identity.domain.org.OrganizationRepository;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.domain.user.PasswordHasher;
import com.datn.identity.domain.user.PasswordPolicy;
import com.datn.identity.domain.user.User;
import com.datn.identity.domain.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class InvitationApplicationService {
    private final InvitationRepository invites;
    private final MembershipRepository memberships;
    private final OrganizationRepository orgs;
    private final UserRepository users;
    private final PasswordHasher hasher;
    private final PasswordPolicy pwdPolicy;
    private final OutboxRepository outbox;
    private final AuditLogRepository auditLogs;
    private final ObjectMapper mapper;

    public InvitationApplicationService(InvitationRepository invites,
                                        MembershipRepository memberships,
                                        OrganizationRepository orgs,
                                        UserRepository users,
                                        PasswordHasher hasher,
                                        PasswordPolicy pwdPolicy,
                                        OutboxRepository outbox,
                                        AuditLogRepository auditLogs,
                                        ObjectMapper mapper) {
        this.invites = invites; this.memberships = memberships; this.orgs = orgs;
        this.users = users; this.hasher = hasher; this.pwdPolicy = pwdPolicy;
        this.outbox = outbox; this.auditLogs = auditLogs; this.mapper = mapper;
    }

    @Transactional
    public String createInvitation(UUID actorUserId, UUID orgId, String emailRaw, MemberType type, String role) {
        // TODO: check actor permission in org (OWNER/ADMIN)
        var email = Email.of(emailRaw).value();
        if (invites.existsOpenByEmail(orgId, email)) {
            throw new IllegalStateException("invite_open_exists");
        }

        var inv = Invitation.create(orgId, email, type, role);
        invites.save(inv);

        var evt = new IdentityEvents.InvitationCreated(orgId, email, inv.memberType().name(), inv.role(), inv.token());
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        // Audit log
        auditLogs.save(AuditLog.create(orgId, actorUserId, AuditAction.MEMBER_INVITED,
            "Invitation sent to " + email,
            Map.of("email", email, "memberType", type.name(), "role", role)));

        return inv.token();
    }

    // Backward compatible method
    @Transactional
    public String createInvitation(UUID actorUserId, UUID orgId, String emailRaw, MemberType type) {
        return createInvitation(actorUserId, orgId, emailRaw, type, "MEMBER");
    }

    /**
     * Create invitation (internal use - no actor user required)
     */
    @Transactional
    public String createInvitationInternal(UUID orgId, String emailRaw, String role) {
        var email = Email.of(emailRaw).value();
        if (invites.existsOpenByEmail(orgId, email)) {
            throw new IllegalStateException("invite_open_exists");
        }

        var inv = Invitation.create(orgId, email, MemberType.STAFF, role);
        invites.save(inv);

        var evt = new IdentityEvents.InvitationCreated(orgId, email, inv.memberType().name(), inv.role(), inv.token());
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        return inv.token();
    }

    @Transactional
    public AcceptResult accept(String token, String rawPasswordIfNew) {
        var inv = invites.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("invalid_token"));
        if (inv.acceptedAt() != null) throw new IllegalStateException("already_accepted");

        var email = inv.email();
        var user = users.findByEmail(email).orElseGet(() -> {
            if (rawPasswordIfNew == null || rawPasswordIfNew.isBlank()) {
                throw new IllegalArgumentException("password_required_for_new_user");
            }
            pwdPolicy.validate(rawPasswordIfNew);
            var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
            var hash = hasher.hash(rawPasswordIfNew + pepper);

            var u = User.createNew(Email.of(email), hash);
            users.save(u);

            var evtUser = new IdentityEvents.UserRegistered(u.id(), email);
            outbox.append(OutboxMessage.create(evtUser.topic(), toJson(evtUser)));
            return u;
        });

        var orgId = inv.orgId();
        if (memberships.find(user.id(), orgId).isEmpty()) {
            // Use role from invitation (ADMIN or MEMBER)
            var roles = java.util.Set.of(inv.role());
            memberships.save(Membership.of(user.id(), orgId, roles, inv.memberType()));

            var mEvt = new IdentityEvents.MembershipAdded(orgId, user.id(), roles, inv.memberType().name());
            outbox.append(OutboxMessage.create(mEvt.topic(), toJson(mEvt)));
        }

        invites.save(inv.markAccepted());

        var evt = new IdentityEvents.InvitationAccepted(orgId, user.id(), email);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        // Audit log
        auditLogs.save(AuditLog.create(orgId, user.id(), AuditAction.INVITATION_ACCEPTED,
            "Invitation accepted by " + email,
            Map.of("email", email)));
        auditLogs.save(AuditLog.create(orgId, user.id(), AuditAction.MEMBER_JOINED,
            "Member joined: " + email,
            Map.of("email", email, "memberType", inv.memberType().name())));

        return new AcceptResult(user.id(), orgId);
    }

    /**
     * Find all pending invitations for a user by email
     */
    public List<Invitation> findPendingByEmail(String email) {
        return invites.findPendingByEmail(email);
    }

    /**
     * Find all pending invitations for an organization
     */
    public List<Invitation> findPendingByOrgId(UUID orgId) {
        return invites.findPendingByOrgId(orgId);
    }

    /**
     * Cancel a pending invitation
     */
    @Transactional
    public void cancelInvitation(UUID actorUserId, UUID orgId, UUID invitationId) {
        var inv = invites.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("invitation_not_found"));

        // Verify invitation belongs to the org
        if (!inv.orgId().equals(orgId)) {
            throw new IllegalArgumentException("invitation_not_found");
        }

        // Verify invitation is still pending
        if (inv.acceptedAt() != null) {
            throw new IllegalStateException("invitation_already_accepted");
        }

        invites.deleteById(invitationId);

        // Audit log
        auditLogs.save(AuditLog.create(orgId, actorUserId, AuditAction.INVITATION_CANCELLED,
            "Invitation cancelled for " + inv.email(),
            Map.of("email", inv.email(), "invitationId", invitationId.toString())));
    }

    /**
     * Cancel a pending invitation (internal use - no actor user required)
     */
    @Transactional
    public void cancelInvitationInternal(UUID orgId, UUID invitationId) {
        var inv = invites.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("invitation_not_found"));

        // Verify invitation belongs to the org
        if (!inv.orgId().equals(orgId)) {
            throw new IllegalArgumentException("invitation_not_found");
        }

        // Verify invitation is still pending
        if (inv.acceptedAt() != null) {
            throw new IllegalStateException("invitation_already_accepted");
        }

        invites.deleteById(invitationId);
    }

    /**
     * Resend invitation email (internal use - no actor user required)
     */
    @Transactional
    public void resendInvitationInternal(UUID orgId, UUID invitationId) {
        var inv = invites.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("invitation_not_found"));

        // Verify invitation belongs to the org
        if (!inv.orgId().equals(orgId)) {
            throw new IllegalArgumentException("invitation_not_found");
        }

        // Verify invitation is still pending
        if (inv.acceptedAt() != null) {
            throw new IllegalStateException("invitation_already_accepted");
        }

        // Resend invitation event (notification service will send email)
        var evt = new IdentityEvents.InvitationCreated(
            orgId, inv.email(), inv.memberType().name(), inv.role(), inv.token()
        );
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));
    }

    public record AcceptResult(UUID userId, UUID orgId) {}

    /**
     * Get invitation preview by token (public - for UI display before accepting)
     */
    public InvitationPreview getInvitationPreview(String token) {
        System.out.println("[DEBUG] getInvitationPreview called with token: " + token);

        var inv = invites.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("invitation_not_found"));

        System.out.println("[DEBUG] Found invitation: id=" + inv.id() + ", orgId=" + inv.orgId() + ", email=" + inv.email());

        if (inv.acceptedAt() != null) {
            throw new IllegalStateException("invitation_already_accepted");
        }

        var org = orgs.findById(inv.orgId()).orElse(null);
        var orgName = org != null ? org.displayName() : "Organization";

        System.out.println("[DEBUG] Org found: " + (org != null) + ", orgName=" + orgName);

        return new InvitationPreview(
            inv.id(),
            inv.orgId(),
            orgName,
            inv.email(),
            inv.role(),
            inv.memberType().name()
        );
    }

    public record InvitationPreview(UUID id, UUID orgId, String orgName, String email, String role, String memberType) {}

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new RuntimeException(e); }
    }
}