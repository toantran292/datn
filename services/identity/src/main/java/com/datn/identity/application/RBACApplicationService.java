package com.datn.identity.application;

import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.org.MembershipRepository;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.domain.rbac.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class RBACApplicationService implements RBACPolicy {
    private final RoleBindingRepository bindings;
    private final MembershipRepository memberships;
    private final OutboxRepository outbox;
    private final ObjectMapper mapper;

    public RBACApplicationService(RoleBindingRepository bindings,
                                  MembershipRepository memberships,
                                  OutboxRepository outbox,
                                  ObjectMapper mapper) {
        this.bindings = bindings;
        this.memberships = memberships;
        this.outbox = outbox;
        this.mapper = mapper;
    }

    /** Tạo role binding (ORG/PROJECT scope). */
    @Transactional
    public UUID createBinding(UUID actorUserId, UUID orgId, UUID targetUserId,
                              Integer roleId, ScopeType scope, String scopeId) {
        assertActorCanBind(actorUserId, orgId, memberships);
        // target user phải là member của org
        memberships.find(targetUserId, orgId)
                .orElseThrow(() -> new IllegalStateException("target_not_member"));

        var rb = RoleBinding.create(orgId, targetUserId, roleId, scope, scopeId);
        bindings.save(rb);

        var evt = new IdentityEvents.RoleBindingCreated(
                rb.id(), orgId, targetUserId, roleId, scope.name(), scopeId);
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));

        // Lưu ý: không cập nhật cache roles trong memberships ở đây.
        // Nếu bạn muốn “cache” vai trò ORG-level trong memberships, hãy dùng OrganizationApplicationService.updateMemberRoles()
        // để đảm bảo một luồng thống nhất phát IdentityEvents.MembershipRolesUpdated.

        return rb.id();
    }

    /** Xoá role binding. */
    @Transactional
    public void deleteBinding(UUID actorUserId, UUID orgId, UUID bindingId){
        assertActorCanBind(actorUserId, orgId, memberships);

        var rb = bindings.findById(bindingId)
                .orElseThrow(() -> new IllegalArgumentException("binding_not_found"));
        if (!rb.orgId().equals(orgId)) throw new SecurityException("cross_org");

        bindings.delete(bindingId);

        var evt = new IdentityEvents.RoleBindingDeleted(bindingId, orgId, rb.userId());
        outbox.append(OutboxMessage.create(evt.topic(), toJson(evt)));
    }

    // ===== RBACPolicy (stub mặc định): actor phải là OWNER/ADMIN trong org =====
    @Override
    public void assertActorCanBind(UUID actorUserId, UUID orgId, MembershipRepository memberships) {
        var m = memberships.find(actorUserId, orgId)
                .orElseThrow(() -> new SecurityException("actor_not_member"));
        var hasAdmin = m.roles().stream().anyMatch(r -> r.equalsIgnoreCase("OWNER") || r.equalsIgnoreCase("ADMIN"));
        if (!hasAdmin) throw new SecurityException("forbidden");
    }

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new RuntimeException(e); }
    }
}