package com.datn.identity.infrastructure.persistence.springdata;

import com.datn.identity.infrastructure.persistence.entity.ExternalIdentityEntity;
import com.datn.identity.infrastructure.persistence.entity.ExternalIdentityId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExternalIdentityJpaRepo extends JpaRepository<ExternalIdentityEntity, ExternalIdentityId> {
    Optional<ExternalIdentityEntity> findByProviderAndSubject(String provider, String subject);
}