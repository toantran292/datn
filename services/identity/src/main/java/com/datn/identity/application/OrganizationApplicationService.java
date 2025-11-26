package com.datn.identity.application;

import com.datn.identity.common.Slug;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.org.*;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.domain.user.UserRepository;
import com.datn.identity.interfaces.api.dto.Dtos;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationApplicationService {
    private final OrganizationRepository orgs;
    private final MembershipRepository memberships;
    private final UserRepository users;
    private final OutboxRepository outbox;
    private final ObjectMapper mapper;

    public OrganizationApplicationService(OrganizationRepository orgs,
                                          MembershipRepository memberships,
                                          UserRepository users,
                                          OutboxRepository outbox,
                                          ObjectMapper mapper) {
        this.orgs = orgs; this.memberships = memberships; this.users = users;
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
    public Dtos.PagedResponse<Dtos.MemberInfo> listMembers(UUID orgId, int page, int size) {
        long total = memberships.countByOrg(orgId);
        int totalPages = (int) Math.ceil((double) total / size);

        DateTimeFormatter formatter = DateTimeFormatter.ISO_INSTANT;

        List<Dtos.MemberInfo> items = memberships.listByOrg(orgId, page, size).stream()
                .map(m -> {
                    var userOpt = users.findById(m.userId());
                    String email = userOpt.map(u -> u.email().value()).orElse("unknown@email.com");

                    // Determine primary role for display
                    String primaryRole = m.roles().contains("OWNER") ? "owner" :
                                       m.roles().contains("ADMIN") ? "admin" :
                                       m.roles().contains("MEMBER") ? "member" : "viewer";

                    // Status based on member type (STAFF = active, GUEST = pending for now)
                    String status = m.memberType() == MemberType.STAFF ? "active" : "pending";

                    // Format joined date
                    String joinedAt = m.createdAt() != null ?
                        formatter.format(m.createdAt()) :
                        formatter.format(Instant.now());

                    return new Dtos.MemberInfo(
                        m.userId().toString(),
                        email,
                        email.split("@")[0], // Use email prefix as display name for now
                        primaryRole,
                        status,
                        null, // avatar_url - not implemented yet
                        joinedAt,
                        m.roles(),
                        m.memberType().name(),
                        Collections.emptyList() // project_roles - not implemented yet
                    );
                })
                .collect(Collectors.toList());

        return new Dtos.PagedResponse<>(items, page, size, total, totalPages);
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

    public boolean isMember(UUID userId, UUID orgId) {
        return memberships.find(userId, orgId).isPresent();
    }

    /**
     * Find all organizations for a user with their membership details
     */
    public List<Dtos.UserOrgRes> findByUserId(UUID userId) {
        List<Membership> userMemberships = memberships.listByUser(userId);

        return userMemberships.stream()
                .map(membership -> {
                    Optional<Organization> orgOpt = orgs.findById(membership.orgId());
                    if (orgOpt.isPresent()) {
                        Organization org = orgOpt.get();
                        return new Dtos.UserOrgRes(
                                org.id().toString(),
                                org.slug().value(),
                                org.displayName(),
                                membership.roles(),
                                membership.memberType().name()
                        );
                    }
                    return null;
                })
                .filter(org -> org != null)
                .collect(Collectors.toList());
    }

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new RuntimeException(e); }
    }
}
