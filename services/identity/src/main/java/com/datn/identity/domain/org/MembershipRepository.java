package com.datn.identity.domain.org;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository {
    Optional<Membership> find(UUID userId, UUID orgId);
    void save(Membership m);
    void delete(UUID userId, UUID orgId);
    List<Membership> listByOrg(UUID orgId, int page, int size);
    List<Membership> listByUser(UUID userId);
    long countOwners(UUID orgId);
}