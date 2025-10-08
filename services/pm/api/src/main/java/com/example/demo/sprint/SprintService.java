package com.example.demo.sprint;

import com.example.demo.domain.project.Project;
import com.example.demo.domain.project.ProjectRepository;
import com.example.demo.domain.sprint.Sprint;
import com.example.demo.domain.sprint.SprintRepository;
import com.example.demo.sprint.dto.SprintRequest;
import com.example.demo.sprint.dto.SprintResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final SprintMapper sprintMapper;

    public SprintService(SprintRepository sprintRepository, ProjectRepository projectRepository, SprintMapper sprintMapper) {
        this.sprintRepository = sprintRepository;
        this.projectRepository = projectRepository;
        this.sprintMapper = sprintMapper;
    }

    @Transactional
    public SprintResponse create(SprintRequest request) {
        Project project = getProjectOrThrow(request.getProjectId());
        Sprint sprint = sprintMapper.toEntity(request);
        sprint.setProject(project);
        Sprint saved = sprintRepository.save(sprint);
        return sprintMapper.toResponse(saved);
    }

    public SprintResponse findById(UUID id) {
        Sprint sprint = getSprintOrThrow(id);
        return sprintMapper.toResponse(sprint);
    }

    public List<SprintResponse> findByProject(UUID projectId) {
        return sprintRepository.findByProject_Id(projectId).stream()
                .map(sprintMapper::toResponse)
                .toList();
    }

    @Transactional
    public SprintResponse update(UUID id, SprintRequest request) {
        Sprint sprint = getSprintOrThrow(id);
        Project project = getProjectOrThrow(request.getProjectId());
        sprintMapper.updateFromRequest(request, sprint);
        sprint.setProject(project);
        Sprint saved = sprintRepository.save(sprint);
        return sprintMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Sprint sprint = getSprintOrThrow(id);
        sprintRepository.delete(sprint);
    }

    private Sprint getSprintOrThrow(UUID id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found: " + id));
    }

    private Project getProjectOrThrow(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found: " + id));
    }
}
