package com.example.demo.issue.dto;

import com.example.demo.domain.issue.IssuePriority;
import com.example.demo.domain.issue.IssueState;
import com.example.demo.domain.issue.IssueType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record IssueResponse(
        UUID id,
        UUID projectId,
        UUID sprintId,
        UUID parentId,
        String name,
        String description,
        String descriptionHtml,
        IssueState state,
        IssuePriority priority,
        IssueType type,
        BigDecimal point,
        Long sequenceId,
        Integer sortOrder,
        LocalDate startDate,
        LocalDate targetDate,
        List<UUID> assignees,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public IssueResponse {
        assignees = assignees == null ? List.of() : List.copyOf(assignees);
    }
}
