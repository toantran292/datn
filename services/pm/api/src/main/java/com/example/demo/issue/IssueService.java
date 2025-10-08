package com.example.demo.issue;

import com.example.demo.domain.issue.Issue;
import com.example.demo.domain.issue.IssueRepository;
import com.example.demo.domain.project.Project;
import com.example.demo.domain.project.ProjectRepository;
import com.example.demo.domain.sprint.Sprint;
import com.example.demo.domain.sprint.SprintRepository;
import com.example.demo.issue.dto.IssueReorderRequest;
import com.example.demo.issue.dto.IssueRequest;
import com.example.demo.issue.dto.IssueResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class IssueService {

    private static final BigDecimal DEFAULT_SORT_INCREMENT = BigDecimal.valueOf(1_000);
    private static final BigDecimal MIN_SORT_GAP = new BigDecimal("0.000001");
    private static final int SORT_SCALE = 6;

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
    public void reorder(UUID projectId, UUID issueId, IssueReorderRequest request) {
        Issue issue = getIssueOrThrow(issueId);
        if (!issue.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Issue does not belong to project " + projectId);
        }

        Sprint targetSprint = request.getToSprintId() != null ? getSprintOrThrow(request.getToSprintId()) : null;
        if (targetSprint != null
            && targetSprint.getProject() != null
            && !targetSprint.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sprint does not belong to project " + projectId
            );
        }

        List<Issue> targetIssues = getOrderedIssues(projectId, targetSprint);
        targetIssues.removeIf(i -> i.getId().equals(issueId));

        BigDecimal newSortOrder = calculateNewSortOrder(request, targetIssues);

        issue.setSprint(targetSprint);
        issue.setSortOrder(newSortOrder);

        issueRepository.save(issue);
    }

    @Transactional
    public void delete(UUID id) {
        Issue issue = getIssueOrThrow(id);
        issueRepository.delete(issue);
    }

    private List<Issue> getOrderedIssues(UUID projectId, Sprint sprint) {
        if (sprint == null) {
            return new ArrayList<>(issueRepository.findByProject_IdAndSprintIsNullOrderBySortOrderAscCreatedAtAsc(projectId));
        }
        return new ArrayList<>(issueRepository.findBySprint_IdOrderBySortOrderAscCreatedAtAsc(sprint.getId()));
    }

    private BigDecimal calculateNewSortOrder(IssueReorderRequest request, List<Issue> siblings) {
        if (siblings.isEmpty()) {
            return DEFAULT_SORT_INCREMENT;
        }

        Issue before = null;
        Issue after = null;
        UUID destinationId = request.getDestinationIssueId();
        IssueReorderRequest.Position position = request.getPosition();

        if (destinationId != null) {
            for (int index = 0; index < siblings.size(); index++) {
                Issue current = siblings.get(index);
                if (current.getId().equals(destinationId)) {
                    if (position == IssueReorderRequest.Position.BEFORE) {
                        after = current;
                        before = index > 0 ? siblings.get(index - 1) : null;
                    } else {
                        before = current;
                        after = index + 1 < siblings.size() ? siblings.get(index + 1) : null;
                    }
                    break;
                }
            }
        } else if (position == IssueReorderRequest.Position.BEFORE) {
            after = siblings.get(0);
        }

        if (position == IssueReorderRequest.Position.END || (before == null && after == null)) {
            before = siblings.isEmpty() ? null : siblings.get(siblings.size() - 1);
            after = null;
        }

        return computeSortOrder(before, after, siblings);
    }

    private BigDecimal computeSortOrder(Issue before, Issue after, List<Issue> siblings) {
        if (before == null && after == null) {
            return DEFAULT_SORT_INCREMENT;
        }

        if (before == null && after != null) {
            BigDecimal afterSort = ensureSortOrder(after, siblings);
            if (afterSort.compareTo(BigDecimal.ZERO) <= 0) {
                normalizeSortOrders(siblings);
                afterSort = after.getSortOrder();
            }
            return afterSort.divide(BigDecimal.valueOf(2), SORT_SCALE, RoundingMode.HALF_UP);
        }

        if (after == null && before != null) {
            BigDecimal beforeSort = ensureSortOrder(before, siblings);
            return beforeSort.add(DEFAULT_SORT_INCREMENT);
        }

        BigDecimal beforeSort = ensureSortOrder(before, siblings);
        BigDecimal afterSort = ensureSortOrder(after, siblings);

        if (afterSort.subtract(beforeSort).abs().compareTo(MIN_SORT_GAP) <= 0) {
            normalizeSortOrders(siblings);
            beforeSort = before.getSortOrder();
            afterSort = after.getSortOrder();
        }

        return beforeSort.add(afterSort).divide(BigDecimal.valueOf(2), SORT_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal ensureSortOrder(Issue issue, List<Issue> siblings) {
        if (issue.getSortOrder() == null) {
            normalizeSortOrders(siblings);
        }
        return issue.getSortOrder();
    }

    private void normalizeSortOrders(List<Issue> issues) {
        if (issues.isEmpty()) {
            return;
        }
        BigDecimal counter = DEFAULT_SORT_INCREMENT;
        for (Issue current : issues) {
            current.setSortOrder(counter);
            counter = counter.add(DEFAULT_SORT_INCREMENT);
        }
        issueRepository.saveAll(issues);
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

    private boolean isSameSprint(Sprint source, Sprint target) {
        if (source == null && target == null) return true;
        if (source == null || target == null) return false;
        return source.getId().equals(target.getId());
    }
}
