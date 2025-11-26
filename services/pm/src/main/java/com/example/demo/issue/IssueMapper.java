package com.example.demo.issue;

import com.example.demo.domain.issue.Issue;
import com.example.demo.issue.dto.IssueRequest;
import com.example.demo.issue.dto.IssueResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class IssueMapper {

    public Issue toEntity(IssueRequest request) {
        if (request == null) {
            return null;
        }
        Issue issue = new Issue();
        issue.setName(request.getName());
        issue.setDescription(request.getDescription());
        issue.setDescriptionHtml(request.getDescriptionHtml());
        issue.setState(request.getState());
        issue.setPriority(request.getPriority());
        issue.setType(request.getType());
        issue.setPoint(request.getPoint());
        issue.setSequenceId(request.getSequenceId());
        issue.setSortOrder(request.getSortOrder());
        issue.setStartDate(request.getStartDate());
        issue.setTargetDate(request.getTargetDate());
        issue.setAssignees(request.getAssignees());
        return issue;
    }

    public IssueResponse toResponse(Issue issue) {
        if (issue == null) {
            return null;
        }
        UUID projectId = issue.getProject() != null ? issue.getProject().getId() : null;
        UUID sprintId = issue.getSprint() != null ? issue.getSprint().getId() : null;
        UUID parentId = issue.getParent() != null ? issue.getParent().getId() : null;

        return new IssueResponse(
                issue.getId(),
                projectId,
                sprintId,
                parentId,
                issue.getName(),
                issue.getDescription(),
                issue.getDescriptionHtml(),
                issue.getState(),
                issue.getPriority(),
                issue.getType(),
                issue.getPoint(),
                issue.getSequenceId(),
                issue.getSortOrder(),
                issue.getStartDate(),
                issue.getTargetDate(),
                issue.getAssignees(),
                issue.getCreatedAt(),
                issue.getUpdatedAt()
        );
    }

    public void updateFromRequest(IssueRequest request, Issue issue) {
        if (request == null || issue == null) {
            return;
        }
        issue.setName(request.getName());
        issue.setDescription(request.getDescription());
        issue.setDescriptionHtml(request.getDescriptionHtml());
        issue.setState(request.getState());
        issue.setPriority(request.getPriority());
        issue.setType(request.getType());
        issue.setPoint(request.getPoint());
        issue.setSequenceId(request.getSequenceId());
        issue.setSortOrder(request.getSortOrder());
        issue.setStartDate(request.getStartDate());
        issue.setTargetDate(request.getTargetDate());
        issue.setAssignees(request.getAssignees());
    }
}
