package com.datn.identity.infrastructure.config;

import com.datn.identity.application.*;
import com.datn.identity.domain.user.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCrypt;

@Configuration
public class ApplicationConfig {

    // Password hasher/policy (simple)
    @Bean
    PasswordHasher passwordHasher() {
        return new PasswordHasher() {
            @Override public String hash(String rawPlusPepper) {
                return BCrypt.hashpw(rawPlusPepper, BCrypt.gensalt(10));
            }
            @Override public boolean matches(String rawPlusPepper, String hash) {
                return BCrypt.checkpw(rawPlusPepper, hash);
            }
        };
    }

    @Bean
    PasswordPolicy passwordPolicy() {
        return raw -> {
            if (raw == null || raw.length() < 8) {
                throw new IllegalArgumentException("password_too_short");
            }
            // thêm entropy/rules nếu cần
        };
    }
}