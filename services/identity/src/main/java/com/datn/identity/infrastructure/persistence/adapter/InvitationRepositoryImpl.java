package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.invite.*;
import com.datn.identity.domain.org.MemberType;
import com.datn.identity.infrastructure.persistence.entity.InvitationEntity;
import com.datn.identity.infrastructure.persistence.springdata.InvitationJpaRepo;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.Arrays;

@Repository
public class InvitationRepositoryImpl implements InvitationRepository {
    private final InvitationJpaRepo repo;
    public InvitationRepositoryImpl(InvitationJpaRepo repo){ this.repo=repo; }

    private static Invitation toDomain(InvitationEntity e) {
        // nếu domain dùng emailCI, chuẩn hoá lowercase tại đây
        return new Invitation(
                e.getId(),
                e.getOrgId(),
                e.getEmail().toLowerCase(),   // <- từ email (CITEXT)
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
    // infrastructure/persistence/adapter/InvitationRepositoryImpl.java
    @Override
    public boolean existsOpenByEmail(UUID orgId, String emailCI) {
        // CITEXT của Postgres so sánh không phân biệt hoa thường — truyền lowercase cũng ok
        return repo.existsByOrgIdAndEmailAndAcceptedAtIsNull(orgId, emailCI);
    }
    @Override public void save(Invitation inv){ repo.save(toEntity(inv)); }
}