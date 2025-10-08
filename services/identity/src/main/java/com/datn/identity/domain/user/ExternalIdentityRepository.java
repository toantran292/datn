package com.datn.identity.domain.user;

import java.util.Optional;

public interface ExternalIdentityRepository {
    Optional<ExternalIdentity> find(String provider, String subject);
    void save(ExternalIdentity ei);
}