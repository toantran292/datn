package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.invite.*;
import com.datn.identity.infrastructure.persistence.entity.InvitationEntity;
import com.datn.identity.infrastructure.persistence.springdata.InvitationJpaRepo;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class InvitationRepositoryImpl implements InvitationRepository {
    private final InvitationJpaRepo repo;
    public InvitationRepositoryImpl(InvitationJpaRepo repo){ this.repo=repo; }

    private static Invitation toDomain(InvitationEntity e) {
        return new Invitation(
                e.getId(),
                e.getOrgId(),
                e.getEmail().toLowerCase(),
                e.getToken(),
                e.getCreatedAt(),
                e.getAcceptedAt(),
                e.getMemberType()
        );
    }

    private static InvitationEntity toEntity(Invitation d) {
        var e = new InvitationEntity();
        e.setId(d.id());
        e.setOrgId(d.orgId());
        e.setEmail(d.email() != null ? d.email().toLowerCase() : null);
        e.setToken(d.token());
        e.setCreatedAt(d.createdAt());
        e.setAcceptedAt(d.acceptedAt());
        e.setMemberType(d.memberType());
        return e;
    }
    @Override public Optional<Invitation> findByToken(String token){ return repo.findByToken(token).map(InvitationRepositoryImpl::toDomain); }
    @Override
    public Optional<Invitation> findById(UUID id) {
        return repo.findById(id).map(InvitationRepositoryImpl::toDomain);
    }
    @Override
    public boolean existsOpenByEmail(UUID orgId, String emailCI) {
        return repo.existsByOrgIdAndEmailAndAcceptedAtIsNull(orgId, emailCI);
    }
    @Override public void save(Invitation inv){ repo.save(toEntity(inv)); }
    @Override
    public void deleteById(UUID id) {
        repo.deleteById(id);
    }
    @Override
    public List<Invitation> findPendingByEmail(String email) {
        return repo.findByEmailAndAcceptedAtIsNull(email.toLowerCase())
                .stream()
                .map(InvitationRepositoryImpl::toDomain)
                .collect(Collectors.toList());
    }
    @Override
    public List<Invitation> findPendingByOrgId(UUID orgId) {
        return repo.findByOrgIdAndAcceptedAtIsNullOrderByCreatedAtDesc(orgId)
                .stream()
                .map(InvitationRepositoryImpl::toDomain)
                .collect(Collectors.toList());
    }
}