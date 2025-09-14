package com.datn.identity.interfaces.api.dto;

import com.datn.identity.domain.org.MemberType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.Set;
import java.util.UUID;

public class Dtos {
    // Users
    public record CreateUserReq(@Email String email, @NotBlank String password) {}
    public record IdRes(String id) {}

    // Orgs
    public record CreateOrgReq(@NotBlank String name, String slug, String ownerUserId) {}
    public record UpdateMemberRolesReq(@NotBlank String userId, Set<String> roles) {}

    // Invitations
    public record CreateInviteReq(@Email String email, MemberType memberType) {}
    public record CreateInviteRes(String token) {}
    public record AcceptInviteReq(@NotBlank String token, String password) {}
    public record AcceptInviteRes(String status, String userId, String orgId) {}

    // Me
    public record MeRes(UUID userId, String email) {}
}