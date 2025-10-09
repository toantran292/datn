package com.datn.identity.domain.user;

import com.datn.identity.common.Email;

import java.util.Objects;
import java.util.UUID;

public final class User {
    private final UUID id;
    private final Email email;
    private final String passwordHash;
    private final boolean disabled;
    private final boolean mustChangePassword;

    public User(UUID id, Email email, String passwordHash, boolean disabled, boolean mustChangePassword) {
        this.id = id; this.email = email; this.passwordHash = passwordHash; this.disabled = disabled; this.mustChangePassword = mustChangePassword;
    }

    public static User createNew(Email email, String passwordHash){
        return new User(UUID.randomUUID(), email, passwordHash, false, false);
    }

    public User withPasswordHash(String newHash) {
        return new User(this.id, this.email, newHash, this.disabled, this.mustChangePassword);
    }

    public User disable(){ return new User(id, email, passwordHash, true, mustChangePassword); }

    public User requirePasswordChange(){ return new User(id, email, passwordHash, disabled, true); }

    public User clearPasswordChangeRequirement(){ return new User(id, email, passwordHash, disabled, false); }

    public UUID id(){ return id; }
    public Email email(){ return email; }
    public String passwordHash(){ return passwordHash; }
    public boolean disabled(){ return disabled; }
    public boolean mustChangePassword(){ return mustChangePassword; }

    @Override public boolean equals(Object o){ return (o instanceof User u) && Objects.equals(id, u.id); }
    @Override public int hashCode(){ return Objects.hash(id); }
}
