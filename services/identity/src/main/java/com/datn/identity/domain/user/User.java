package com.datn.identity.domain.user;

import com.datn.identity.common.Email;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public final class User {
    private final UUID id;
    private final Email email;
    private final String passwordHash;
    private final boolean disabled;
    private final boolean mustChangePassword;
    private final String displayName;
    private final Instant emailVerifiedAt;
    private final String phone;
    private final String bio;
    private final UUID avatarAssetId;

    public User(UUID id, Email email, String passwordHash, boolean disabled, boolean mustChangePassword,
                String displayName, Instant emailVerifiedAt, String phone, String bio, UUID avatarAssetId) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.disabled = disabled;
        this.mustChangePassword = mustChangePassword;
        this.displayName = displayName;
        this.emailVerifiedAt = emailVerifiedAt;
        this.phone = phone;
        this.bio = bio;
        this.avatarAssetId = avatarAssetId;
    }

    // Backward compatible constructor
    public User(UUID id, Email email, String passwordHash, boolean disabled, boolean mustChangePassword, String displayName, Instant emailVerifiedAt) {
        this(id, email, passwordHash, disabled, mustChangePassword, displayName, emailVerifiedAt, null, null, null);
    }

    // Backward compatible constructor (legacy)
    public User(UUID id, Email email, String passwordHash, boolean disabled, boolean mustChangePassword, String displayName) {
        this(id, email, passwordHash, disabled, mustChangePassword, displayName, null, null, null, null);
    }

    public static User createNew(Email email, String passwordHash){
        // Extract display name from email by default
        String defaultDisplayName = email.value().contains("@")
            ? email.value().substring(0, email.value().indexOf("@"))
            : email.value();
        return new User(UUID.randomUUID(), email, passwordHash, false, false, defaultDisplayName, null, null, null, null);
    }

    public User withPasswordHash(String newHash) {
        return new User(id, email, newHash, disabled, mustChangePassword, displayName, emailVerifiedAt, phone, bio, avatarAssetId);
    }

    public User disable(){
        return new User(id, email, passwordHash, true, mustChangePassword, displayName, emailVerifiedAt, phone, bio, avatarAssetId);
    }

    public User requirePasswordChange(){
        return new User(id, email, passwordHash, disabled, true, displayName, emailVerifiedAt, phone, bio, avatarAssetId);
    }

    public User clearPasswordChangeRequirement(){
        return new User(id, email, passwordHash, disabled, false, displayName, emailVerifiedAt, phone, bio, avatarAssetId);
    }

    public User withDisplayName(String newDisplayName){
        return new User(id, email, passwordHash, disabled, mustChangePassword, newDisplayName, emailVerifiedAt, phone, bio, avatarAssetId);
    }

    public User markEmailVerified() {
        return new User(id, email, passwordHash, disabled, mustChangePassword, displayName, Instant.now(), phone, bio, avatarAssetId);
    }

    public User withPhone(String newPhone) {
        return new User(id, email, passwordHash, disabled, mustChangePassword, displayName, emailVerifiedAt, newPhone, bio, avatarAssetId);
    }

    public User withBio(String newBio) {
        return new User(id, email, passwordHash, disabled, mustChangePassword, displayName, emailVerifiedAt, phone, newBio, avatarAssetId);
    }

    public User withAvatarAssetId(UUID newAvatarAssetId) {
        return new User(id, email, passwordHash, disabled, mustChangePassword, displayName, emailVerifiedAt, phone, bio, newAvatarAssetId);
    }

    public User updateProfile(String newDisplayName, String newPhone, String newBio, UUID newAvatarAssetId) {
        return new User(id, email, passwordHash, disabled, mustChangePassword,
            newDisplayName != null ? newDisplayName : displayName,
            emailVerifiedAt,
            newPhone != null ? newPhone : phone,
            newBio != null ? newBio : bio,
            newAvatarAssetId != null ? newAvatarAssetId : avatarAssetId);
    }

    public boolean isEmailVerified() {
        return emailVerifiedAt != null;
    }

    public UUID id(){ return id; }
    public Email email(){ return email; }
    public String passwordHash(){ return passwordHash; }
    public boolean disabled(){ return disabled; }
    public boolean mustChangePassword(){ return mustChangePassword; }
    public String displayName(){ return displayName; }
    public Instant emailVerifiedAt(){ return emailVerifiedAt; }
    public String phone(){ return phone; }
    public String bio(){ return bio; }
    public UUID avatarAssetId(){ return avatarAssetId; }

    @Override public boolean equals(Object o){ return (o instanceof User u) && Objects.equals(id, u.id); }
    @Override public int hashCode(){ return Objects.hash(id); }
}
