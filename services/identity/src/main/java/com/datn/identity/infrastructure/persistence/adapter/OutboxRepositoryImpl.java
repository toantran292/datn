package com.datn.identity.infrastructure.persistence.adapter;

import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.time.Instant;
import java.util.List;

@Repository
public class OutboxRepositoryImpl implements OutboxRepository {
    private final JdbcTemplate jdbc;

    public OutboxRepositoryImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void append(OutboxMessage msg) {
        try {
            PGobject jsonb = new PGobject();
            jsonb.setType("jsonb");
            jsonb.setValue(msg.payloadJson());
            jdbc.update(
                    "INSERT INTO outbox(topic, payload, created_at) VALUES (?, ?, now())",
                    msg.topic(), jsonb
            );
        } catch (Exception e) {
            throw new RuntimeException("failed_to_append_outbox", e);
        }
    }

    @Override
    public List<OutboxMessage> listUnpublished(int limit) {
        return jdbc.query("""
                  select id, topic, payload, created_at, published_at
                  from outbox where published_at is null order by id asc limit ?
                """, (ResultSet rs, int rowNum) ->
                new OutboxMessage(rs.getLong("id"), rs.getString("topic"),
                        rs.getString("payload"), rs.getTimestamp("created_at").toInstant(), null
                ), limit);
    }

    @Override
    public void markPublished(long id, Instant when) {
        jdbc.update("update outbox set published_at=? where id=?", when, id);
    }
}