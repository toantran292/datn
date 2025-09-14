package com.datn.identity.domain.invite;

import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository {
    Optional<Invitation> findByToken(String token);
    boolean existsOpenByEmail(UUID orgId, String emailCI);
    void save(Invitation inv);
}