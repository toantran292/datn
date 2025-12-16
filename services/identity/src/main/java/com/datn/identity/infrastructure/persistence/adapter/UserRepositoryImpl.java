package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.user.User;
import com.datn.identity.domain.user.UserRepository;
import com.datn.identity.infrastructure.persistence.entity.UserEntity;
import com.datn.identity.infrastructure.persistence.springdata.UserJpaRepo;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
        e.setDisplayName(u.displayName());
        e.setEmailVerifiedAt(u.emailVerifiedAt());
        e.setPhone(u.phone());
        e.setBio(u.bio());
        e.setAvatarAssetId(u.avatarAssetId());
        return e;
    }

    private static User toDomain(UserEntity e) {
        return new User(
            e.getId(),
            e.getEmail(),
            e.getPasswordHash(),
            e.isDisabled(),
            e.isMustChangePassword(),
            e.getDisplayName(),
            e.getEmailVerifiedAt(),
            e.getPhone(),
            e.getBio(),
            e.getAvatarAssetId()
        );
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
    public List<User> findByIds(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return repo.findAllById(ids).stream()
                .map(UserRepositoryImpl::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void save(User u) {
        repo.save(toEntity(u));
    }
}
