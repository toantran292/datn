package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.org.Organization;
import com.datn.identity.domain.org.OrganizationRepository;
import com.datn.identity.infrastructure.persistence.entity.OrganizationEntity;
import com.datn.identity.infrastructure.persistence.springdata.OrganizationJpaRepo;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class OrganizationRepositoryImpl implements OrganizationRepository {
    private final OrganizationJpaRepo repo;
    public OrganizationRepositoryImpl(OrganizationJpaRepo repo){ this.repo=repo; }

    @Override public boolean existsBySlug(String slugCI){ return repo.existsBySlug_ValueIgnoreCase(slugCI); }
    @Override public Optional<Organization> findById(UUID id){ return repo.findById(id).map(this::toDomain); }
    @Override public Optional<Organization> findBySlug(String slug){ return repo.findBySlugIgnoreCase(slug).map(this::toDomain); }
    @Override public void save(Organization org){ repo.save(toEntity(org)); }

    private Organization toDomain(OrganizationEntity e){ return new Organization(e.getId(), e.getSlug(), e.getDisplayName(), e.getLogoAssetId()); }
    private OrganizationEntity toEntity(Organization d){
        var e = new OrganizationEntity(); e.setId(d.id()); e.setSlug(d.slug()); e.setDisplayName(d.displayName()); e.setLogoAssetId(d.logoAssetId()); return e;
    }
}