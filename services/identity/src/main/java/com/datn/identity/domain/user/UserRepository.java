package com.datn.identity.domain.user;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    boolean existsByEmail(String emailCI);
    Optional<User> findById(UUID id);
    Optional<User> findByEmail(String emailCI);
    List<User> findByIds(Collection<UUID> ids);
    void save(User u);
}
