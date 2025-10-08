package com.datn.identity.common;

import java.time.Instant;

public interface DomainEvent {
    Instant occurredAt();
    String topic(); // e.g. "identity.user.registered"
}
