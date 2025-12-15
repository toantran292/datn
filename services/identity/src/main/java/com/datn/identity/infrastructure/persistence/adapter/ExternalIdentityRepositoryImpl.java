package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.user.ExternalIdentity;
import com.datn.identity.domain.user.ExternalIdentityRepository;
import com.datn.identity.infrastructure.persistence.entity.ExternalIdentityEntity;
import com.datn.identity.infrastructure.persistence.springdata.ExternalIdentityJpaRepo;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class ExternalIdentityRepositoryImpl implements ExternalIdentityRepository {
    private final ExternalIdentityJpaRepo repo;
    public ExternalIdentityRepositoryImpl(ExternalIdentityJpaRepo repo){ this.repo = repo; }

    private static ExternalIdentity toDomain(ExternalIdentityEntity e){
        return new ExternalIdentity(e.getProvider(), e.getSubject(), e.getUserId(), e.getEmail());
    }
    private static ExternalIdentityEntity toEntity(ExternalIdentity d){
        var e = new ExternalIdentityEntity();
        e.setProvider(d.provider());
        e.setSubject(d.subject());
        e.setUserId(d.userId());
        e.setEmail(d.email());
        return e;
    }

    @Override public Optional<ExternalIdentity> find(String provider, String subject) {
        return repo.findByProviderAndSubject(provider, subject).map(ExternalIdentityRepositoryImpl::toDomain);
    }

    @Override public Optional<ExternalIdentity> findByUserId(UUID userId) {
        return repo.findByUserId(userId).map(ExternalIdentityRepositoryImpl::toDomain);
    }

    @Override public void save(ExternalIdentity ei) { repo.save(toEntity(ei)); }
}