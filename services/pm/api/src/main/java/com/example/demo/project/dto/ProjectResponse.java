package com.example.demo.project.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        UUID orgId,
        String identifier,
        String name,
        UUID projectLead,
        UUID defaultAssignee,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<UUID> sprintIds
) {
    public ProjectResponse {
        sprintIds = sprintIds == null ? List.of() : List.copyOf(sprintIds);
    }
}
