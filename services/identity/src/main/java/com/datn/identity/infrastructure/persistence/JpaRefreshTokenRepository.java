package com.datn.identity.infrastructure.persistence;

import com.datn.identity.domain.token.RefreshToken;
import com.datn.identity.domain.token.RefreshTokenRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaRefreshTokenRepository implements RefreshTokenRepository {
    private final JdbcClient jdbc;

    public JpaRefreshTokenRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public RefreshToken save(RefreshToken token) {
        // Try to update first
        String updateSql = """
            UPDATE refresh_tokens
            SET last_used_at = ?, revoked = ?, revoked_at = ?
            WHERE id = ?
            """;

        int updated = jdbc.sql(updateSql)
                .param(token.lastUsedAt() != null ? java.sql.Timestamp.from(token.lastUsedAt()) : null)
                .param(token.revoked())
                .param(token.revokedAt() != null ? java.sql.Timestamp.from(token.revokedAt()) : null)
                .param(token.id())
                .update();

        // If no rows updated, insert new token
        if (updated == 0) {
            String insertSql = """
                INSERT INTO refresh_tokens (id, user_id, token_hash, org_id, expires_at, revoked,
                                            revoked_at, created_at, last_used_at, user_agent, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

            jdbc.sql(insertSql)
                    .param(token.id())
                    .param(token.userId())
                    .param(token.tokenHash())
                    .param(token.orgId())
                    .param(java.sql.Timestamp.from(token.expiresAt()))
                    .param(token.revoked())
                    .param(token.revokedAt() != null ? java.sql.Timestamp.from(token.revokedAt()) : null)
                    .param(java.sql.Timestamp.from(token.createdAt()))
                    .param(token.lastUsedAt() != null ? java.sql.Timestamp.from(token.lastUsedAt()) : null)
                    .param(token.userAgent())
                    .param(token.ipAddress())
                    .update();
        }

        return token;
    }

    @Override
    public Optional<RefreshToken> findByTokenHash(String tokenHash) {
        String sql = "SELECT * FROM refresh_tokens WHERE token_hash = ?";
        return jdbc.sql(sql)
                .param(tokenHash)
                .query(this::mapRow)
                .optional();
    }

    @Override
    public void revokeByTokenHash(String tokenHash) {
        String sql = "UPDATE refresh_tokens SET revoked = TRUE, revoked_at = ? WHERE token_hash = ?";
        jdbc.sql(sql)
                .param(java.sql.Timestamp.from(Instant.now()))
                .param(tokenHash)
                .update();
    }

    @Override
    public void revokeAllForUser(UUID userId) {
        String sql = "UPDATE refresh_tokens SET revoked = TRUE, revoked_at = ? WHERE user_id = ?";
        jdbc.sql(sql)
                .param(java.sql.Timestamp.from(Instant.now()))
                .param(userId)
                .update();
    }

    @Override
    public void revokeAllForUserAndOrg(UUID userId, UUID orgId) {
        String sql = "UPDATE refresh_tokens SET revoked = TRUE, revoked_at = ? WHERE user_id = ? AND org_id = ?";
        jdbc.sql(sql)
                .param(java.sql.Timestamp.from(Instant.now()))
                .param(userId)
                .param(orgId)
                .update();
    }

    @Override
    public void deleteExpired() {
        String sql = "DELETE FROM refresh_tokens WHERE expires_at < ? OR (revoked = TRUE AND revoked_at < ?)";
        Instant cutoff = Instant.now().minusSeconds(7 * 24 * 3600); // 7 days ago
        jdbc.sql(sql)
                .param(Instant.now())
                .param(cutoff)
                .update();
    }

    private RefreshToken mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new RefreshToken(
                (UUID) rs.getObject("id"),
                (UUID) rs.getObject("user_id"),
                rs.getString("token_hash"),
                (UUID) rs.getObject("org_id"),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getBoolean("revoked"),
                rs.getTimestamp("revoked_at") != null ? rs.getTimestamp("revoked_at").toInstant() : null,
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("last_used_at") != null ? rs.getTimestamp("last_used_at").toInstant() : null,
                rs.getString("user_agent"),
                rs.getString("ip_address")
        );
    }
}
