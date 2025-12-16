package com.datn.identity.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface ExternalIdentityRepository {
    Optional<ExternalIdentity> find(String provider, String subject);
    Optional<ExternalIdentity> findByUserId(UUID userId);
    void save(ExternalIdentity ei);
}