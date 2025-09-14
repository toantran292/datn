package com.datn.identity.domain.org;

import com.datn.identity.common.Slug;

import java.util.UUID;

public record Organization(UUID id, Slug slug, String displayName) {
    public static Organization create(Slug slug, String displayName){
        if (displayName == null || displayName.isBlank()) throw new IllegalArgumentException("org_display_name_required");
        return new Organization(UUID.randomUUID(), slug, displayName.trim());
    }
}