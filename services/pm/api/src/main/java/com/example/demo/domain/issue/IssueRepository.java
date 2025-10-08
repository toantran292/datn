package com.example.demo.domain.issue;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IssueRepository extends JpaRepository<Issue, UUID> {
    List<Issue> findByProject_Id(UUID projectId);

    List<Issue> findBySprint_Id(UUID sprintId);

    List<Issue> findBySprint_IdOrderBySortOrderAscCreatedAtAsc(UUID sprintId);

    List<Issue> findByProject_IdAndSprintIsNullOrderBySortOrderAscCreatedAtAsc(UUID projectId);
}
