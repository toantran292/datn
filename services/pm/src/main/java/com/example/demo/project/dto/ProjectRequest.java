package com.example.demo.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class ProjectRequest {

    @NotBlank
    private String orgId;

    @NotBlank
    @Size(max = 50)
    private String identifier;

    @NotBlank
    private String name;

    private UUID projectLead;

    private UUID defaultAssignee;

    public ProjectRequest() {
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UUID getProjectLead() {
        return projectLead;
    }

    public void setProjectLead(UUID projectLead) {
        this.projectLead = projectLead;
    }

    public UUID getDefaultAssignee() {
        return defaultAssignee;
    }

    public void setDefaultAssignee(UUID defaultAssignee) {
        this.defaultAssignee = defaultAssignee;
    }
}
