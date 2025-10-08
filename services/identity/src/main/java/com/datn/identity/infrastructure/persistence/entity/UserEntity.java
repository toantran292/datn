package com.datn.identity.infrastructure.persistence.entity;

import com.datn.identity.common.Email;
import com.datn.identity.infrastructure.persistence.converter.EmailConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;
    @Convert(converter = EmailConverter.class)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "email", columnDefinition = "citext", nullable = false, unique = true)
    private Email email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(nullable = false)
    private boolean disabled;
    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword;

    // getters/setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Email getEmail() {
        return email;
    }

    public void setEmail(Email e) {
        this.email = e;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String s) {
        this.passwordHash = s;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean d) {
        this.disabled = d;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }
}
