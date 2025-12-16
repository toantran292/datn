package com.datn.identity.domain.org;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository {
    Optional<Membership> find(UUID userId, UUID orgId);
    void save(Membership m);
    void delete(UUID userId, UUID orgId);
    List<Membership> listByOrg(UUID orgId, int page, int size);
    List<Membership> findByOrg(UUID orgId);  // Get all members of org (for internal use)
    long countByOrg(UUID orgId);
    List<Membership> listByUser(UUID userId);
    long countOwners(UUID orgId);
    long countByRole(UUID orgId, String role);
    long countByMemberType(UUID orgId, MemberType memberType);
}