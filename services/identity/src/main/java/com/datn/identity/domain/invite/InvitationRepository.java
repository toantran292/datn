package com.datn.identity.domain.invite;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository {
    Optional<Invitation> findByToken(String token);
    Optional<Invitation> findById(UUID id);
    boolean existsOpenByEmail(UUID orgId, String emailCI);
    void save(Invitation inv);
    void deleteById(UUID id);
    List<Invitation> findPendingByEmail(String email);
    List<Invitation> findPendingByOrgId(UUID orgId);
}