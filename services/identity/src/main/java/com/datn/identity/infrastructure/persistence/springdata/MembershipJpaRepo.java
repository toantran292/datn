package com.datn.identity.infrastructure.persistence.springdata;

import com.datn.identity.infrastructure.persistence.entity.MembershipEntity;
import com.datn.identity.infrastructure.persistence.entity.MembershipId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MembershipJpaRepo extends JpaRepository<MembershipEntity, MembershipId> {
    @Query(value = "select count(*) from memberships m where m.org_id = :orgId and 'OWNER' = any(m.roles)", nativeQuery = true)
    long countOwners(@Param("orgId") UUID orgId);

    long countById_OrgId(UUID orgId);

    List<MembershipEntity> findById_OrgId(UUID orgId);
    List<MembershipEntity> findById_UserId(UUID userId);
}