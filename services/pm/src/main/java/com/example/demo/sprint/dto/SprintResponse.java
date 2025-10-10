package com.example.demo.sprint.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record SprintResponse(
        UUID id,
        UUID projectId,
        String name,
        String goal,
        LocalDate startDate,
        LocalDate endDate,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<UUID> issueIds
) {
    public SprintResponse {
        issueIds = issueIds == null ? List.of() : List.copyOf(issueIds);
    }
}
