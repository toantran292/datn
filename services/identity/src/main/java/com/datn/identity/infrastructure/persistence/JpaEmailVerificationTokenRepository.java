package com.datn.identity.infrastructure.persistence;

import com.datn.identity.domain.user.EmailVerificationToken;
import com.datn.identity.domain.user.EmailVerificationTokenRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
    private final JdbcClient jdbc;

    public JpaEmailVerificationTokenRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void save(EmailVerificationToken token) {
        String sql = """
            INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, verified_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET verified_at = EXCLUDED.verified_at
            """;

        jdbc.sql(sql)
                .param(token.id())
                .param(token.userId())
                .param(token.tokenHash())
                .param(java.sql.Timestamp.from(token.expiresAt()))
                .param(token.verifiedAt() != null ? java.sql.Timestamp.from(token.verifiedAt()) : null)
                .param(java.sql.Timestamp.from(token.createdAt()))
                .update();
    }

    @Override
    public Optional<EmailVerificationToken> findByTokenHash(String tokenHash) {
        String sql = "SELECT * FROM email_verification_tokens WHERE token_hash = ?";
        return jdbc.sql(sql)
                .param(tokenHash)
                .query(this::mapRow)
                .optional();
    }

    @Override
    public Optional<EmailVerificationToken> findLatestPendingByUser(UUID userId) {
        String sql = """
            SELECT * FROM email_verification_tokens
            WHERE user_id = ? AND verified_at IS NULL AND expires_at > ?
            ORDER BY created_at DESC
            LIMIT 1
            """;
        return jdbc.sql(sql)
                .param(userId)
                .param(java.sql.Timestamp.from(Instant.now()))
                .query(this::mapRow)
                .optional();
    }

    @Override
    public void invalidateAllForUser(UUID userId) {
        String sql = """
            UPDATE email_verification_tokens
            SET verified_at = ?
            WHERE user_id = ? AND verified_at IS NULL AND expires_at > ?
            """;
        jdbc.sql(sql)
                .param(java.sql.Timestamp.from(Instant.now()))
                .param(userId)
                .param(java.sql.Timestamp.from(Instant.now()))
                .update();
    }

    @Override
    public void deleteExpired() {
        // Delete tokens that expired more than 7 days ago
        String sql = "DELETE FROM email_verification_tokens WHERE expires_at < ?";
        Instant cutoff = Instant.now().minusSeconds(7 * 24 * 3600);
        jdbc.sql(sql)
                .param(java.sql.Timestamp.from(cutoff))
                .update();
    }

    @Override
    public int countPendingByUser(UUID userId) {
        String sql = """
            SELECT COUNT(*) FROM email_verification_tokens
            WHERE user_id = ? AND verified_at IS NULL AND expires_at > ?
            """;
        return jdbc.sql(sql)
                .param(userId)
                .param(java.sql.Timestamp.from(Instant.now()))
                .query(Integer.class)
                .single();
    }

    private EmailVerificationToken mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new EmailVerificationToken(
                (UUID) rs.getObject("id"),
                (UUID) rs.getObject("user_id"),
                rs.getString("token_hash"),
                rs.getTimestamp("expires_at").toInstant(),
                rs.getTimestamp("verified_at") != null ? rs.getTimestamp("verified_at").toInstant() : null,
                rs.getTimestamp("created_at").toInstant()
        );
    }
}
