package com.datn.identity.common;

import java.util.Locale;

public final class Slug {
    private final String value;

    private Slug(String v){ this.value = v; }

    public static Slug of(String raw){
        if (raw == null) throw new IllegalArgumentException("slug_null");
        var n = raw.trim().toLowerCase(Locale.ROOT);
        if (!n.matches("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")) // simple DNS-like
            throw new IllegalArgumentException("slug_invalid");
        return new Slug(n);
    }

    public String value(){ return value; }
    @Override public String toString(){ return value; }
}