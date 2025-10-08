package com.datn.identity.domain.rbac;

public record Role(Integer id, String name, boolean builtin, String description) {}
