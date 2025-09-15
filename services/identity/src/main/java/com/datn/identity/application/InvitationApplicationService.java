package com.datn.identity.application;

import com.datn.identity.common.Email;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.invite.Invitation;
import com.datn.identity.domain.invite.InvitationRepository;
import com.datn.identity.domain.org.MemberType;
import com.datn.identity.domain.org.Membership;
import com.datn.identity.domain.org.MembershipRepository;
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

import java.util.UUID;

@Service
public class InvitationApplicationService {
    private final InvitationRepository invites;
    private final MembershipRepository memberships;
    private final UserRepository users;
    private final PasswordHasher hasher;
    private final PasswordPolicy pwdPolicy;
    private final OutboxRepository outbox;
    private final ObjectMapper mapper;

    public InvitationApplicationService(InvitationRepository invites,
                                        MembershipRepository memberships,
                                        UserRepository users,
                                        PasswordHasher hasher,
                                        PasswordPolicy pwdPolicy,
                                        OutboxRepository outbox,
                                        ObjectMapper mapper) {
        this.invites = invites; this.memberships = memberships; this.users = users;
        this.hasher = hasher; this.pwdPolicy = pwdPolicy; this.outbox = outbox; this.mapper = mapper;
    }

    @Transactional
    public String createInvitation(UUID actorUserId, UUID orgId, String emailRaw, MemberType type) {
        // TODO: check actor permission in org (OWNER/ADMIN)
        var email = Email.of(emailRaw).value();
        if (invites.existsOpenByEmail(orgId, email)) {
            throw new IllegalStateException("invite_open_exists");
        }

        var inv = Invitation.create(orgId, email, type);
        invites.save(inv);

        var evt = new IdentityEvents.InvitationCreated(orgId, email, inv.memberType().name());
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
            var roles = java.util.Set.of("MEMBER");
            memberships.save(Membership.of(user.id(), orgId, roles, inv.memberType()));

            var mEvt = new IdentityEvents.MembershipAdded(orgId, user.id(), roles, inv.memberType().name());
            outbox.append(OutboxMessage.create(mEvt.topic(), toJson(mEvt)));
        }

        invites.save(inv.markAccepted());

        var evt = new IdentityEvents.InvitationAccepted(orgId, user.id(), email);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        return new AcceptResult(user.id(), orgId);
    }

    public record AcceptResult(UUID userId, UUID orgId) {}

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new RuntimeException(e); }
    }
}