package com.datn.identity.infrastructure.persistence.springdata;

import com.datn.identity.infrastructure.persistence.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserJpaRepo extends JpaRepository<UserEntity, UUID> {
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM UserEntity u WHERE UPPER(u.email) = UPPER(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String value);
    
    @Query("SELECT u FROM UserEntity u WHERE UPPER(u.email) = UPPER(:email)")
    Optional<UserEntity> findByEmailIgnoreCase(@Param("email") String value);
}