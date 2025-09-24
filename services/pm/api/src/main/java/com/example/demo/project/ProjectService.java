package com.example.demo.project;

import com.example.demo.domain.project.Project;
import com.example.demo.domain.project.ProjectRepository;
import com.example.demo.project.dto.ProjectRequest;
import com.example.demo.project.dto.ProjectResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;

    public ProjectService(ProjectRepository projectRepository, ProjectMapper projectMapper) {
        this.projectRepository = projectRepository;
        this.projectMapper = projectMapper;
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        Project project = projectMapper.toEntity(request);
        Project saved = projectRepository.save(project);
        return projectMapper.toResponse(saved);
    }

    public List<ProjectResponse> findAll() {
        return projectRepository.findAll().stream()
                .map(projectMapper::toResponse)
                .toList();
    }

    public ProjectResponse findById(UUID id) {
        Project project = getProjectOrThrow(id);
        return projectMapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse update(UUID id, ProjectRequest request) {
        Project project = getProjectOrThrow(id);
        projectMapper.updateProjectFromRequest(request, project);
        Project updated = projectRepository.save(project);
        return projectMapper.toResponse(updated);
    }

    @Transactional
    public void delete(UUID id) {
        Project project = getProjectOrThrow(id);
        projectRepository.delete(project);
    }

    private Project getProjectOrThrow(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found: " + id));
    }
}
