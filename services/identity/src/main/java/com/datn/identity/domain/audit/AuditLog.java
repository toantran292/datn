package com.datn.identity.domain.audit;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLog(Long id, UUID actorUserId, UUID orgId, String action, Map<String,Object> meta, Instant at) {
    public static AuditLog create(UUID actorUserId, UUID orgId, String action, Map<String,Object> meta){
        return new AuditLog(null, actorUserId, orgId, action, meta, Instant.now());
    }
}