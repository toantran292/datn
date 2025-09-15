package com.datn.identity.application;

import com.datn.identity.common.Slug;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.org.*;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrganizationApplicationService {
    private final OrganizationRepository orgs;
    private final MembershipRepository memberships;
    private final OutboxRepository outbox;
    private final ObjectMapper mapper;

    public OrganizationApplicationService(OrganizationRepository orgs,
                                          MembershipRepository memberships,
                                          OutboxRepository outbox,
                                          ObjectMapper mapper) {
        this.orgs = orgs; this.memberships = memberships;
        this.outbox = outbox; this.mapper = mapper;
    }

    @Transactional
    public UUID createOrg(UUID ownerUserId, String slugRaw, String displayName) {
        var slug = Slug.of(slugRaw != null ? slugRaw : displayName);
        if (orgs.existsBySlug(slug.value())) throw new IllegalStateException("slug_exists");

        var org = Organization.create(slug, displayName);
        orgs.save(org);
        
        memberships.save(Membership.of(ownerUserId, org.id(), Set.of("OWNER"), MemberType.STAFF));

        var evt1 = new IdentityEvents.OrganizationCreated(org.id(), org.slug().value(), org.displayName());
        var evt2 = new IdentityEvents.MembershipAdded(org.id(), ownerUserId, Set.of("OWNER"), MemberType.STAFF.name());
        outbox.append(OutboxMessage.create(evt1.topic(), toJson(evt1)));
        outbox.append(OutboxMessage.create(evt2.topic(), toJson(evt2)));
        return org.id();
    }

    @Transactional
    public void updateMemberRoles(UUID actorUserId, UUID orgId, UUID targetUserId, Set<String> roles) {
        // TODO: inject OrgPolicy & enforce actor permission + last-owner guard
        var m = memberships.find(targetUserId, orgId).orElseThrow(() -> new IllegalStateException("not_member"));
        memberships.save(m.withRoles(roles));

        var evt = new IdentityEvents.MembershipRolesUpdated(orgId, targetUserId, roles);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));
    }

    @Transactional
    public void removeMember(UUID actorUserId, UUID orgId, UUID targetUserId) {
        // TODO: OrgPolicy checks (can manage members & not removing last owner)
        memberships.delete(targetUserId, orgId);

        var evt = new IdentityEvents.MembershipRemoved(orgId, targetUserId);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));
    }

    @Transactional
    public Optional<Organization> findBySlug(String slug) {
        return orgs.findBySlug(slug);
    }

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new RuntimeException(e); }
    }
}