package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.org.*;
import com.datn.identity.infrastructure.persistence.entity.MembershipEntity;
import com.datn.identity.infrastructure.persistence.entity.MembershipId;
import com.datn.identity.infrastructure.persistence.springdata.MembershipJpaRepo;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class MembershipRepositoryImpl implements MembershipRepository {
    private final MembershipJpaRepo repo;
    public MembershipRepositoryImpl(MembershipJpaRepo repo){ this.repo=repo; }

    private static MembershipEntity toEntity(Membership m){
        var e = new MembershipEntity();
        e.setId(new MembershipId(m.userId(), m.orgId()));
        e.setRoles(m.roles().toArray(String[]::new));
        e.setMemberType(m.memberType());
        e.setCreatedAt(m.createdAt() != null ? m.createdAt() : java.time.Instant.now());
        return e;
    }

    private static Membership toDomain(MembershipEntity e){
        java.util.Set<String> roles = e.getRoles() == null
                ? java.util.Set.of()
                : java.util.Set.copyOf(java.util.Arrays.asList(e.getRoles()));
        return Membership.of(e.getId().userId, e.getId().orgId, roles, e.getMemberType());
    }

    @Override public Optional<Membership> find(UUID userId, UUID orgId){
        return repo.findById(new MembershipId(userId, orgId)).map(MembershipRepositoryImpl::toDomain);
    }
    @Override public void save(Membership m){ repo.save(toEntity(m)); }
    @Override public void delete(UUID userId, UUID orgId){ repo.deleteById(new MembershipId(userId, orgId)); }
    @Override public List<Membership> listByOrg(UUID orgId, int page, int size){
        return repo.findById_OrgId(orgId).stream().map(MembershipRepositoryImpl::toDomain).collect(Collectors.toList());
    }
    @Override public List<Membership> listByUser(UUID userId){
        return repo.findById_UserId(userId).stream().map(MembershipRepositoryImpl::toDomain).collect(Collectors.toList());
    }
    @Override public long countOwners(UUID orgId){ return repo.countOwners(orgId); }
}