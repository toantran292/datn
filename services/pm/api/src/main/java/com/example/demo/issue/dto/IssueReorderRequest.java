package com.example.demo.issue.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class IssueReorderRequest {

    private UUID toSprintId;

    private UUID destinationIssueId;

    @NotNull
    private Position position;

    public enum Position {
        BEFORE,
        AFTER,
        END
    }

    public UUID getToSprintId() {
        return toSprintId;
    }

    public void setToSprintId(UUID toSprintId) {
        this.toSprintId = toSprintId;
    }

    public UUID getDestinationIssueId() {
        return destinationIssueId;
    }

    public void setDestinationIssueId(UUID destinationIssueId) {
        this.destinationIssueId = destinationIssueId;
    }

    public Position getPosition() {
        return position;
    }

    public void setPosition(Position position) {
        this.position = position;
    }
}
