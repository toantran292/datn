package com.datn.identity.domain.user;

import java.util.UUID;

public record ExternalIdentity(String provider, String subject, UUID userId, String email) {}