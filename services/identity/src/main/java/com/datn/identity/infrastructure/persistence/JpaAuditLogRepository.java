package com.datn.identity.infrastructure.persistence;

import com.datn.identity.domain.audit.AuditAction;
import com.datn.identity.domain.audit.AuditLog;
import com.datn.identity.domain.audit.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class JpaAuditLogRepository implements AuditLogRepository {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;

    public JpaAuditLogRepository(JdbcClient jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @Override
    public void save(AuditLog log) {
        String sql = """
            INSERT INTO audit_logs (id, org_id, user_id, action, description, metadata, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)
            """;

        jdbc.sql(sql)
            .param(log.id())
            .param(log.orgId())
            .param(log.userId())
            .param(log.action().name())
            .param(log.description())
            .param(serializeMetadata(log.metadata()))
            .param(log.ipAddress())
            .param(log.userAgent())
            .param(Timestamp.from(log.createdAt()))
            .update();
    }

    @Override
    public List<AuditLog> findByOrgId(UUID orgId, int page, int size) {
        String sql = """
            SELECT * FROM audit_logs
            WHERE org_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """;

        return jdbc.sql(sql)
            .param(orgId)
            .param(size)
            .param(page * size)
            .query(this::mapRow)
            .list();
    }

    @Override
    public long countByOrgId(UUID orgId) {
        String sql = "SELECT COUNT(*) FROM audit_logs WHERE org_id = ?";
        return jdbc.sql(sql)
            .param(orgId)
            .query(Long.class)
            .single();
    }

    @Override
    public List<AuditLog> query(
            UUID orgId,
            UUID userId,
            AuditAction action,
            String category,
            Instant from,
            Instant to,
            int page,
            int size) {

        StringBuilder sql = new StringBuilder("SELECT * FROM audit_logs WHERE org_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (userId != null) {
            sql.append(" AND user_id = ?");
            params.add(userId);
        }

        if (action != null) {
            sql.append(" AND action = ?");
            params.add(action.name());
        }

        if (category != null) {
            sql.append(" AND action LIKE ?");
            params.add(category + "_%");
        }

        if (from != null) {
            sql.append(" AND created_at >= ?");
            params.add(Timestamp.from(from));
        }

        if (to != null) {
            sql.append(" AND created_at <= ?");
            params.add(Timestamp.from(to));
        }

        sql.append(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.add(size);
        params.add(page * size);

        var query = jdbc.sql(sql.toString());
        for (Object param : params) {
            query = query.param(param);
        }

        return query.query(this::mapRow).list();
    }

    @Override
    public long countQuery(
            UUID orgId,
            UUID userId,
            AuditAction action,
            String category,
            Instant from,
            Instant to) {

        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM audit_logs WHERE org_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(orgId);

        if (userId != null) {
            sql.append(" AND user_id = ?");
            params.add(userId);
        }

        if (action != null) {
            sql.append(" AND action = ?");
            params.add(action.name());
        }

        if (category != null) {
            sql.append(" AND action LIKE ?");
            params.add(category + "_%");
        }

        if (from != null) {
            sql.append(" AND created_at >= ?");
            params.add(Timestamp.from(from));
        }

        if (to != null) {
            sql.append(" AND created_at <= ?");
            params.add(Timestamp.from(to));
        }

        var query = jdbc.sql(sql.toString());
        for (Object param : params) {
            query = query.param(param);
        }

        return query.query(Long.class).single();
    }

    @Override
    public long countByOrgIdSince(UUID orgId, Instant since) {
        String sql = "SELECT COUNT(*) FROM audit_logs WHERE org_id = ? AND created_at >= ?";
        return jdbc.sql(sql)
            .param(orgId)
            .param(Timestamp.from(since))
            .query(Long.class)
            .single();
    }

    @Override
    public List<AuditLog> findRecentByOrgId(UUID orgId, int limit) {
        String sql = """
            SELECT * FROM audit_logs
            WHERE org_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """;
        return jdbc.sql(sql)
            .param(orgId)
            .param(limit)
            .query(this::mapRow)
            .list();
    }

    private AuditLog mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new AuditLog(
            (UUID) rs.getObject("id"),
            (UUID) rs.getObject("org_id"),
            (UUID) rs.getObject("user_id"),
            AuditAction.valueOf(rs.getString("action")),
            rs.getString("description"),
            parseMetadata(rs.getString("metadata")),
            rs.getString("ip_address"),
            rs.getString("user_agent"),
            rs.getTimestamp("created_at").toInstant()
        );
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return "{}";
        }
        try {
            return mapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private Map<String, Object> parseMetadata(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }
}
