package com.datn.identity.infrastructure.persistence.springdata;

import com.datn.identity.infrastructure.persistence.entity.OrganizationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationJpaRepo extends JpaRepository<OrganizationEntity, UUID> {
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM OrganizationEntity o WHERE UPPER(o.slug) = UPPER(:slug)")
    boolean existsBySlug_ValueIgnoreCase(@Param("slug") String slug);
    
    @Query("SELECT o FROM OrganizationEntity o WHERE UPPER(o.slug) = UPPER(:slug)")
    Optional<OrganizationEntity> findBySlugIgnoreCase(@Param("slug") String slug);
}