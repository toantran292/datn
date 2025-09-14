package com.datn.identity.interfaces.api.dto;

import com.datn.identity.domain.rbac.ScopeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class RbacDtos {

    public record CreateBindingReq(
            @NotBlank String userId,
            @NotNull Integer roleId,
            @NotNull ScopeType scope,
            String scopeId // nullable when scope == ORG
    ) {}

    public record CreateBindingRes(String id) {}

    public record DeleteBindingRes(String status) {}
}