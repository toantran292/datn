package com.example.demo.sprint;

import com.example.demo.domain.issue.Issue;
import com.example.demo.domain.sprint.Sprint;
import com.example.demo.sprint.dto.SprintRequest;
import com.example.demo.sprint.dto.SprintResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class SprintMapper {

    public Sprint toEntity(SprintRequest request) {
        if (request == null) {
            return null;
        }
        Sprint sprint = new Sprint();
        sprint.setName(request.getName());
        sprint.setGoal(request.getGoal());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());
        return sprint;
    }

    public SprintResponse toResponse(Sprint sprint) {
        if (sprint == null) {
            return null;
        }
        return new SprintResponse(
                sprint.getId(),
                sprint.getProject() != null ? sprint.getProject().getId() : null,
                sprint.getName(),
                sprint.getGoal(),
                sprint.getStartDate(),
                sprint.getEndDate(),
                sprint.getCreatedAt(),
                sprint.getUpdatedAt(),
                mapIssueIds(sprint.getIssues())
        );
    }

    public void updateFromRequest(SprintRequest request, Sprint sprint) {
        if (request == null || sprint == null) {
            return;
        }
        sprint.setName(request.getName());
        sprint.setGoal(request.getGoal());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());
    }

    private List<UUID> mapIssueIds(List<Issue> issues) {
        if (issues == null) {
            return Collections.emptyList();
        }
        List<UUID> ids = new ArrayList<>(issues.size());
        for (Issue issue : issues) {
            if (issue != null) {
                ids.add(issue.getId());
            }
        }
        return ids;
    }
}
