package com.datn.identity.domain.audit;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository {
    void append(AuditLog log);
    List<AuditLog> query(UUID orgId, UUID actorUserId, String action, Instant from, Instant to, int page, int size);
}