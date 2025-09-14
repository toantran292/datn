package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.rbac.*;
import com.datn.identity.infrastructure.persistence.entity.RoleBindingEntity;
import com.datn.identity.infrastructure.persistence.springdata.RoleBindingJpaRepo;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class RoleBindingRepositoryImpl implements RoleBindingRepository {
    private final RoleBindingJpaRepo repo;
    public RoleBindingRepositoryImpl(RoleBindingJpaRepo repo){ this.repo=repo; }

    private static RoleBindingEntity toEntity(RoleBinding rb){
        var e = new RoleBindingEntity();
        e.setId(rb.id()); e.setOrgId(rb.orgId()); e.setUserId(rb.userId());
        e.setRoleId(rb.roleId()); e.setScope(rb.scope()); e.setScopeId(rb.scopeId());
        e.setCreatedAt(rb.createdAt() != null ? rb.createdAt() : Instant.now());
        return e;
    }
    private static RoleBinding toDomain(RoleBindingEntity e){
        return RoleBinding.create(e.getOrgId(), e.getUserId(), e.getRoleId(), e.getScope(), e.getScopeId())
                ; // create() sinh id mới—để giữ id cũ, thêm ctor public trong domain:
    }
    @Override public void save(RoleBinding rb){ repo.save(toEntity(rb)); }
    @Override public void delete(UUID id){ repo.deleteById(id); }
    @Override public Optional<RoleBinding> findById(UUID id){
        return repo.findById(id).map(e ->
                new RoleBinding(e.getId(), e.getOrgId(), e.getUserId(), e.getRoleId(), e.getScope(), e.getScopeId(), e.getCreatedAt()));
    }
    @Override public List<RoleBinding> query(UUID orgId, UUID userId, ScopeType scope, String scopeId){
        return repo.findByOrgIdAndUserIdAndScopeAndScopeId(orgId, userId, scope, scopeId)
                .stream().map(e -> new RoleBinding(e.getId(), e.getOrgId(), e.getUserId(), e.getRoleId(), e.getScope(), e.getScopeId(), e.getCreatedAt()))
                .toList();
    }
}