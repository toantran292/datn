package com.datn.identity.domain.org;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository {
    boolean existsBySlug(String slugCI);
    Optional<Organization> findById(UUID id);
    Optional<Organization> findBySlug(String slugCI);
    void save(Organization org);
}
