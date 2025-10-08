package com.example.demo.domain.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByIdentifier(String identifier);

    boolean existsByIdentifierIgnoreCase(String identifier);

    boolean existsByNameIgnoreCase(String name);

    List<Project> findAllByOrgId(String orgId);
}
