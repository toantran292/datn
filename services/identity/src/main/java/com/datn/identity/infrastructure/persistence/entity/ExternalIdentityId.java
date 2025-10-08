package com.datn.identity.infrastructure.persistence.entity;

import java.io.Serializable;
import java.util.Objects;

public class ExternalIdentityId implements Serializable {
    private String provider;
    private String subject;

    public ExternalIdentityId() {}
    public ExternalIdentityId(String provider, String subject) {
        this.provider = provider; this.subject = subject;
    }
    public String getProvider() { return provider; }
    public String getSubject() { return subject; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ExternalIdentityId that)) return false;
        return Objects.equals(provider, that.provider) && Objects.equals(subject, that.subject);
    }
    @Override public int hashCode() { return Objects.hash(provider, subject); }
}