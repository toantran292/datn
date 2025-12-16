package com.datn.identity.domain.org;

public enum LlmProvider {
    OPENAI,
    ANTHROPIC,
    GOOGLE;

    public static LlmProvider fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LlmProvider.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
