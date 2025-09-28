package com.example.demo.project;

import com.example.demo.domain.project.Project;
import com.example.demo.domain.project.ProjectRepository;
import com.example.demo.project.dto.ProjectIdentifierAvailabilityResponse;
import com.example.demo.project.dto.ProjectRequest;
import com.example.demo.project.dto.ProjectResponse;
import com.example.demo.project.exception.ProjectValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        sanitizeRequest(request);
        validateUniqueness(request);

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

    public ProjectIdentifierAvailabilityResponse checkIdentifierAvailability(String identifier) {
        if (!StringUtils.hasText(identifier)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifier must not be blank");
        }

        String normalizedIdentifier = identifier.trim().toUpperCase();
        boolean exists = projectRepository.existsByIdentifierIgnoreCase(normalizedIdentifier);

        return new ProjectIdentifierAvailabilityResponse(normalizedIdentifier, !exists);
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

    private void sanitizeRequest(ProjectRequest request) {
        if (request.getIdentifier() != null) {
            request.setIdentifier(request.getIdentifier().trim().toUpperCase());
        }
        if (request.getName() != null) {
            request.setName(request.getName().trim());
        }
    }

    private void validateUniqueness(ProjectRequest request) {
        Map<String, List<String>> errors = new HashMap<>();

        if (StringUtils.hasText(request.getIdentifier())
                && projectRepository.existsByIdentifierIgnoreCase(request.getIdentifier())) {
            errors.computeIfAbsent("identifier", key -> new ArrayList<>())
                    .add("PROJECT_IDENTIFIER_ALREADY_EXIST");
        }

        if (StringUtils.hasText(request.getName())
                && projectRepository.existsByNameIgnoreCase(request.getName())) {
            errors.computeIfAbsent("name", key -> new ArrayList<>())
                    .add("PROJECT_NAME_ALREADY_EXIST");
        }

        if (!errors.isEmpty()) {
            throw new ProjectValidationException(errors);
        }
    }
}
