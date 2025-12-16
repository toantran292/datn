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
    private final String displayName;

    public User(UUID id, Email email, String passwordHash, boolean disabled, boolean mustChangePassword, String displayName) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.disabled = disabled;
        this.mustChangePassword = mustChangePassword;
        this.displayName = displayName;
    }

    public static User createNew(Email email, String passwordHash){
        // Extract display name from email by default
        String defaultDisplayName = email.value().contains("@")
            ? email.value().substring(0, email.value().indexOf("@"))
            : email.value();
        return new User(UUID.randomUUID(), email, passwordHash, false, false, defaultDisplayName);
    }

    public User withPasswordHash(String newHash) {
        return new User(this.id, this.email, newHash, this.disabled, this.mustChangePassword, this.displayName);
    }

    public User disable(){
        return new User(id, email, passwordHash, true, mustChangePassword, displayName);
    }

    public User requirePasswordChange(){
        return new User(id, email, passwordHash, disabled, true, displayName);
    }

    public User clearPasswordChangeRequirement(){
        return new User(id, email, passwordHash, disabled, false, displayName);
    }

    public User withDisplayName(String newDisplayName){
        return new User(id, email, passwordHash, disabled, mustChangePassword, newDisplayName);
    }

    public UUID id(){ return id; }
    public Email email(){ return email; }
    public String passwordHash(){ return passwordHash; }
    public boolean disabled(){ return disabled; }
    public boolean mustChangePassword(){ return mustChangePassword; }
    public String displayName(){ return displayName; }

    @Override public boolean equals(Object o){ return (o instanceof User u) && Objects.equals(id, u.id); }
    @Override public int hashCode(){ return Objects.hash(id); }
}
