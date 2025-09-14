package com.datn.identity.domain.outbox;

import java.time.Instant;
import java.util.List;

public interface OutboxRepository {
    void append(OutboxMessage msg);
    List<OutboxMessage> listUnpublished(int limit);
    void markPublished(long id, Instant when);
}