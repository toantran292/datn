package com.datn.identity.common;

import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

public final class Email {
    private static final Pattern P = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private final String value; // stored lower-case

    public Email(String normalized) { this.value = normalized; }

    public static Email of(String raw) {
        if (raw == null) throw new IllegalArgumentException("email_null");
        var n = raw.trim().toLowerCase(Locale.ROOT);
        if (!P.matcher(n).matches()) throw new IllegalArgumentException("email_invalid");
        return new Email(n);
    }

    public String value() { return value; }

    @Override public String toString() { return value; }
    @Override public boolean equals(Object o){ return (o instanceof Email e) && Objects.equals(value, e.value); }
    @Override public int hashCode(){ return Objects.hash(value); }
}