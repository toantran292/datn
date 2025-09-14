// infrastructure/persistence/springdata/InvitationJpaRepo.java
package com.datn.identity.infrastructure.persistence.springdata;

import com.datn.identity.infrastructure.persistence.entity.InvitationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InvitationJpaRepo extends JpaRepository<InvitationEntity, UUID> {
    Optional<InvitationEntity> findByToken(String token);
    // bám đúng index partial: (org_id, email) WHERE accepted_at IS NULL
    boolean existsByOrgIdAndEmailAndAcceptedAtIsNull(UUID orgId, String email);
}