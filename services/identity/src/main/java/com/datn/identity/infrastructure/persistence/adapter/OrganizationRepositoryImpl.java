package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.org.Organization;
import com.datn.identity.domain.org.OrganizationRepository;
import com.datn.identity.domain.org.OrganizationSettings;
import com.datn.identity.domain.org.OrganizationStatus;
import com.datn.identity.infrastructure.persistence.entity.OrganizationEntity;
import com.datn.identity.infrastructure.persistence.springdata.OrganizationJpaRepo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class OrganizationRepositoryImpl implements OrganizationRepository {
    private final OrganizationJpaRepo repo;
    private final ObjectMapper objectMapper;

    public OrganizationRepositoryImpl(OrganizationJpaRepo repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean existsBySlug(String slugCI) {
        return repo.existsBySlug_ValueIgnoreCase(slugCI);
    }

    @Override
    public Optional<Organization> findById(UUID id) {
        return repo.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Organization> findBySlug(String slug) {
        return repo.findBySlugIgnoreCase(slug).map(this::toDomain);
    }

    @Override
    public void save(Organization org) {
        repo.save(toEntity(org));
    }

    private Organization toDomain(OrganizationEntity e) {
        OrganizationSettings settings = parseSettings(e.getSettingsJson());
        return new Organization(
            e.getId(),
            e.getSlug(),
            e.getDisplayName(),
            e.getLogoAssetId(),
            e.getDescription(),
            e.getLlmProvider(),
            settings,
            e.getStatus() != null ? e.getStatus() : OrganizationStatus.ACTIVE,
            e.getLockReason(),
            e.getLockedAt(),
            e.getLockedBy()
        );
    }

    private OrganizationEntity toEntity(Organization d) {
        var e = new OrganizationEntity();
        e.setId(d.id());
        e.setSlug(d.slug());
        e.setDisplayName(d.displayName());
        e.setLogoAssetId(d.logoAssetId());
        e.setDescription(d.description());
        e.setLlmProvider(d.llmProvider());
        e.setSettingsJson(serializeSettings(d.settings()));
        e.setStatus(d.status() != null ? d.status() : OrganizationStatus.ACTIVE);
        e.setLockReason(d.lockReason());
        e.setLockedAt(d.lockedAt());
        e.setLockedBy(d.lockedBy());
        return e;
    }

    private OrganizationSettings parseSettings(String json) {
        if (json == null || json.isBlank()) {
            return OrganizationSettings.empty();
        }
        try {
            return objectMapper.readValue(json, OrganizationSettings.class);
        } catch (JsonProcessingException e) {
            return OrganizationSettings.empty();
        }
    }

    private String serializeSettings(OrganizationSettings settings) {
        if (settings == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(settings);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}