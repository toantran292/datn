package com.example.demo.project;

import com.example.demo.domain.project.Project;
import com.example.demo.domain.sprint.Sprint;
import com.example.demo.project.dto.ProjectRequest;
import com.example.demo.project.dto.ProjectResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class ProjectMapper {

    public Project toEntity(ProjectRequest request) {
        if (request == null) {
            return null;
        }
        Project project = new Project();
        project.setOrgId(request.getOrgId());
        project.setKey(request.getKey());
        project.setName(request.getName());
        project.setProjectLead(request.getProjectLead());
        project.setDefaultAssignee(request.getDefaultAssignee());
        return project;
    }

    public ProjectResponse toResponse(Project project) {
        if (project == null) {
            return null;
        }
        return new ProjectResponse(
                project.getId(),
                project.getOrgId(),
                project.getKey(),
                project.getName(),
                project.getProjectLead(),
                project.getDefaultAssignee(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                mapSprintIds(project.getSprints())
        );
    }

    public void updateProjectFromRequest(ProjectRequest request, Project project) {
        if (request == null || project == null) {
            return;
        }
        project.setOrgId(request.getOrgId());
        project.setKey(request.getKey());
        project.setName(request.getName());
        project.setProjectLead(request.getProjectLead());
        project.setDefaultAssignee(request.getDefaultAssignee());
    }

    private List<UUID> mapSprintIds(List<Sprint> sprints) {
        if (sprints == null) {
            return Collections.emptyList();
        }
        List<UUID> ids = new ArrayList<>(sprints.size());
        for (Sprint sprint : sprints) {
            if (sprint != null) {
                ids.add(sprint.getId());
            }
        }
        return ids;
    }
}
