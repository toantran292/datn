package com.datn.identity.infrastructure.persistence.springdata;

import com.datn.identity.infrastructure.persistence.entity.RoleBindingEntity;
import com.datn.identity.domain.rbac.ScopeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RoleBindingJpaRepo extends JpaRepository<RoleBindingEntity, UUID> {
    List<RoleBindingEntity> findByOrgIdAndUserIdAndScopeAndScopeId(UUID orgId, UUID userId, ScopeType scope, String scopeId);
}