package com.datn.identity.domain.outbox;

import java.time.Instant;

public record OutboxMessage(Long id, String topic, String payloadJson, Instant createdAt, Instant publishedAt) {
    public static OutboxMessage create(String topic, String payloadJson){
        return new OutboxMessage(null, topic, payloadJson, Instant.now(), null);
    }
}