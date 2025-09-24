package com.example.demo.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class ProjectRequest {

    @NotNull
    private UUID orgId;

    @NotBlank
    @Size(max = 50)
    private String key;

    @NotBlank
    private String name;

    private UUID projectLead;

    private UUID defaultAssignee;

    public ProjectRequest() {
    }

    public UUID getOrgId() {
        return orgId;
    }

    public void setOrgId(UUID orgId) {
        this.orgId = orgId;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
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
