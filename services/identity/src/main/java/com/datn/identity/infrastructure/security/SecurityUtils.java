package com.datn.identity.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

/**
 * Utility class to extract user information from Spring Security context
 */
public class SecurityUtils {

    /**
     * Get the current authenticated user ID from SecurityContext
     * @return User ID as UUID, or null if not authenticated
     */
    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return null;
        }

        try {
            return UUID.fromString(auth.getName());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Get the current authenticated user ID as String from SecurityContext
     * @return User ID as String, or null if not authenticated
     */
    public static String getCurrentUserIdAsString() {
        UUID userId = getCurrentUserId();
        return userId != null ? userId.toString() : null;
    }

    /**
     * Get the current user's organization ID from SecurityContext
     * @return Organization ID as UUID, or null if not available
     */
    public static UUID getCurrentOrgId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getDetails() == null) {
            return null;
        }

        if (auth.getDetails() instanceof SecurityConfig.UserAuthDetails userDetails) {
            String orgId = userDetails.getOrgId();
            if (orgId != null && !orgId.isBlank()) {
                try {
                    return UUID.fromString(orgId);
                } catch (IllegalArgumentException e) {
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Get the current user's organization ID as String from SecurityContext
     * @return Organization ID as String, or null if not available
     */
    public static String getCurrentOrgIdAsString() {
        UUID orgId = getCurrentOrgId();
        return orgId != null ? orgId.toString() : null;
    }

    /**
     * Get the current user's email from SecurityContext
     * @return Email as String, or null if not available
     */
    public static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getDetails() == null) {
            return null;
        }

        if (auth.getDetails() instanceof SecurityConfig.UserAuthDetails userDetails) {
            return userDetails.getEmail();
        }
        return null;
    }

    /**
     * Get the current user's roles from SecurityContext
     * @return Collection of roles, or empty collection if not available
     */
    public static Collection<String> getCurrentUserRoles() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getDetails() == null) {
            return Collections.emptyList();
        }

        if (auth.getDetails() instanceof SecurityConfig.UserAuthDetails userDetails) {
            Collection<String> roles = userDetails.getRoles();
            return roles != null ? roles : Collections.emptyList();
        }
        return Collections.emptyList();
    }

    /**
     * Get the current user's authentication details
     * @return UserAuthDetails or null if not available
     */
    public static SecurityConfig.UserAuthDetails getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getDetails() == null) {
            return null;
        }

        if (auth.getDetails() instanceof SecurityConfig.UserAuthDetails userDetails) {
            return userDetails;
        }
        return null;
    }

    /**
     * Check if the current user is authenticated
     * @return true if authenticated, false otherwise
     */
    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && auth.getPrincipal() != null;
    }
}
