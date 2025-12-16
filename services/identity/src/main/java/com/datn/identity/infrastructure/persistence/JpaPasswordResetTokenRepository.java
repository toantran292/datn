package com.datn.identity.infrastructure.persistence;

import com.datn.identity.domain.user.PasswordResetToken;
import com.datn.identity.domain.user.PasswordResetTokenRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaPasswordResetTokenRepository implements PasswordResetTokenRepository {
    private final JdbcClient jdbc;

    public JpaPasswordResetTokenRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void save(PasswordResetToken token) {
        String sql = """
            INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET used_at = EXCLUDED.used_at
            """;

        jdbc.sql(sql)
                .param(token.id())
                .param(token.userId())
                .param(token.tokenHash())
                .param(java.sql.Timestamp.from(token.expiresAt()))
                .param(token.usedAt() != null ? java.sql.Timestamp.from(token.usedAt()) : null)
                .param(java.sql.Timestamp.from(token.createdAt()))
                .update();
    }

    @Override
    public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
        String sql = "SELECT * FROM password_reset_tokens WHERE token_hash = ?";
        return jdbc.sql(sql)
                .param(tokenHash)
                .query(this::mapRow)
                .optional();
    }

    @Override
    public void invalidateAllForUser(UUID userId) {
        String sql = """
            UPDATE password_reset_tokens
            SET used_at = ?
            WHERE user_id = ? AND used_at IS NULL AND expires_at > ?
            """;
        jdbc.sql(sql)
                .param(java.sql.Timestamp.from(Instant.now()))
                .param(userId)
                .param(java.sql.Timestamp.from(Instant.now()))
                .update();
    }

    @Override
    public void deleteExpired() {
        // Delete tokens that expired more than 24 hours ago
        String sql = "DELETE FROM password_reset_tokens WHERE expires_at < ?";
        Instant cutoff = Instant.now().minusSeconds(24 * 3600);
        jdbc.sql(sql)
                .param(java.sql.Timestamp.from(cutoff))
                .update();
    }

    @Override
    public int countPendingByUser(UUID userId) {
        String sql = """
            SELECT COUNT(*) FROM password_reset_tokens
            WHERE user_id = ? AND used_at IS NULL AND expires_at > ?
            """;
        return jdbc.sql(sql)
                .param(userId)
                .param(java.sql.Timestamp.from(Instant.now()))
                .query(Integer.class)
                .single();
    }

    private PasswordResetToken mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new PasswordResetToken(
                (UUID) rs.getObject("id"),
                (UUID) rs.getObject("user_id"),
                rs.getString("token_hash"),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getTimestamp("used_at") != null ? rs.getTimestamp("used_at").toInstant() : null,
                rs.getTimestamp("created_at").toInstant()
        );
    }
}
