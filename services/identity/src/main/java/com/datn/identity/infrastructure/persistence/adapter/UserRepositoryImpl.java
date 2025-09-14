package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.user.User;
import com.datn.identity.domain.user.UserRepository;
import com.datn.identity.infrastructure.persistence.entity.UserEntity;
import com.datn.identity.infrastructure.persistence.springdata.UserJpaRepo;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepositoryImpl implements UserRepository {
    private final UserJpaRepo repo;

    public UserRepositoryImpl(UserJpaRepo repo) {
        this.repo = repo;
    }

    private static UserEntity toEntity(User u) {
        var e = new UserEntity();
        e.setId(u.id());
        e.setEmail(u.email());
        e.setPasswordHash(u.passwordHash());
        e.setDisabled(u.disabled());
        e.setMustChangePassword(u.mustChangePassword());
        return e;
    }

    private static User toDomain(UserEntity e) {
        return new User(e.getId(), e.getEmail(), e.getPasswordHash(), e.isDisabled(), e.isMustChangePassword());
    }

    @Override
    public boolean existsByEmail(String emailCI) {
        return repo.existsByEmailIgnoreCase(emailCI);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return repo.findById(id).map(UserRepositoryImpl::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String emailCI) {
        return repo.findByEmailIgnoreCase(emailCI).map(UserRepositoryImpl::toDomain);
    }

    @Override
    public void save(User u) {
        repo.save(toEntity(u));
    }
}
