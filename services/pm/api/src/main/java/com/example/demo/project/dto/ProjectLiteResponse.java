package com.example.demo.project.dto;

import java.util.UUID;

public record ProjectLiteResponse(
        UUID id,
        String identifier,
        String name,
        String orgId,
        UUID projectLead
) {
}
