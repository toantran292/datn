package com.datn.identity.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    boolean existsByEmail(String emailCI);
    Optional<User> findById(UUID id);
    Optional<User> findByEmail(String emailCI);
    void save(User u);
}
