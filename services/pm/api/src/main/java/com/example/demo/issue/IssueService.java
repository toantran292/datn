package com.example.demo.issue;

import com.example.demo.domain.issue.Issue;
import com.example.demo.domain.issue.IssueRepository;
import com.example.demo.domain.project.Project;
import com.example.demo.domain.project.ProjectRepository;
import com.example.demo.domain.sprint.Sprint;
import com.example.demo.domain.sprint.SprintRepository;
import com.example.demo.issue.dto.IssueRequest;
import com.example.demo.issue.dto.IssueResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final IssueMapper issueMapper;

    public IssueService(IssueRepository issueRepository,
                        ProjectRepository projectRepository,
                        SprintRepository sprintRepository,
                        IssueMapper issueMapper) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.sprintRepository = sprintRepository;
        this.issueMapper = issueMapper;
    }

    @Transactional
    public IssueResponse create(IssueRequest request) {
        Project project = getProjectOrThrow(request.getProjectId());
        Sprint sprint = request.getSprintId() != null ? getSprintOrThrow(request.getSprintId()) : null;
        Issue parent = request.getParentId() != null ? getIssueOrThrow(request.getParentId()) : null;

        validateRelationships(project, sprint, parent);

        Issue issue = issueMapper.toEntity(request);
        issue.setProject(project);
        issue.setSprint(sprint);
        issue.setParent(parent);

        Issue saved = issueRepository.save(issue);
        return issueMapper.toResponse(saved);
    }

    public IssueResponse findById(UUID id) {
        return issueMapper.toResponse(getIssueOrThrow(id));
    }

    public List<IssueResponse> findByProject(UUID projectId) {
        return issueRepository.findByProject_Id(projectId).stream()
                .map(issueMapper::toResponse)
                .toList();
    }

    public List<IssueResponse> findBySprint(UUID sprintId) {
        return issueRepository.findBySprint_Id(sprintId).stream()
                .map(issueMapper::toResponse)
                .toList();
    }

    @Transactional
    public IssueResponse update(UUID id, IssueRequest request) {
        Issue issue = getIssueOrThrow(id);
        Project project = getProjectOrThrow(request.getProjectId());
        Sprint sprint = request.getSprintId() != null ? getSprintOrThrow(request.getSprintId()) : null;
        Issue parent = request.getParentId() != null ? getIssueOrThrow(request.getParentId()) : null;

        if (parent != null && parent.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Issue cannot be parent of itself");
        }

        validateRelationships(project, sprint, parent);

        issueMapper.updateFromRequest(request, issue);
        issue.setProject(project);
        issue.setSprint(sprint);
        issue.setParent(parent);

        Issue saved = issueRepository.save(issue);
        return issueMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Issue issue = getIssueOrThrow(id);
        issueRepository.delete(issue);
    }

    private Issue getIssueOrThrow(UUID id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found: " + id));
    }

    private Project getProjectOrThrow(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found: " + id));
    }

    private Sprint getSprintOrThrow(UUID id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found: " + id));
    }

    private void validateRelationships(Project project, Sprint sprint, Issue parent) {
        if (sprint != null && sprint.getProject() != null && !sprint.getProject().getId().equals(project.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sprint does not belong to project " + project.getId());
        }
        if (parent != null && parent.getProject() != null && !parent.getProject().getId().equals(project.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent issue does not belong to project " + project.getId());
        }
    }
}
