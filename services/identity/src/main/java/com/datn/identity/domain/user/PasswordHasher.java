package com.datn.identity.domain.user;

public interface PasswordHasher {
    String hash(String rawPlusPepper);
    boolean matches(String rawPlusPepper, String hash);
}