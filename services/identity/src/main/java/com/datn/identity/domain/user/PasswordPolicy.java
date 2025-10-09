package com.datn.identity.domain.user;

public interface PasswordPolicy {
    void validate(String rawPassword); // throw if weak/invalid
}
