package com.datn.identity.domain.rbac;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleBindingRepository {
    void save(RoleBinding rb);
    void delete(UUID id);
    Optional<RoleBinding> findById(UUID id);
    List<RoleBinding> query(UUID orgId, UUID userId, ScopeType scope, String scopeId);
}