package com.datn.identity.infrastructure.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds builtin roles, permissions, and their mappings at application startup.
 * Idempotent: safe to run on every boot.
 */
@Component
public class DataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final JdbcTemplate jdbc;

    public DataInitializer(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public void run(ApplicationArguments args) {
        seedRoles();
        seedPermissions();
        seedRolePermissions();
        bootstrapRootFromEnv();
        log.info("Identity data seed completed");
    }

    private void seedRoles() {
        var roles = List.of(
                new Object[]{"OWNER", "Organization owner (full access)", true},
                new Object[]{"ADMIN", "Organization admin", true},
                new Object[]{"MEMBER", "Organization member", true},
                new Object[]{"PROJECT_ADMIN", "Project-level admin", true},
                new Object[]{"PROJECT_EDITOR", "Project-level editor", true},
                new Object[]{"PROJECT_VIEWER", "Project-level viewer", true},
                // System-level roles (builtin)
                new Object[]{"ROOT", "Superuser – full system access", true},
                new Object[]{"SYS_ADMIN", "System administrator", true}
        );
        jdbc.batchUpdate(
                "INSERT INTO roles(name, description, builtin) VALUES (?, ?, ?) ON CONFLICT (name) DO NOTHING",
                roles
        );
    }

    private void seedPermissions() {
        var orgPerms = List.of(
                new Object[]{"org.read", "Read organization info"},
                new Object[]{"org.manage", "Manage organization settings"},
                new Object[]{"user.invite", "Invite users to organization"},
                new Object[]{"member.manage", "Add/remove/update members"},
                new Object[]{"rbac.manage", "Manage role bindings"},
                new Object[]{"project.manage", "Create/update projects"},
                new Object[]{"project.member.manage", "Add/remove project members"}
        );
        jdbc.batchUpdate(
                "INSERT INTO permissions(name, description) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
                orgPerms
        );

        var sysPerms = List.of(
                new Object[]{"system.manage", "Manage global settings"},
                new Object[]{"system.org.manage", "Create/update/delete organizations"},
                new Object[]{"system.user.manage", "Manage users across the system"},
                new Object[]{"system.rbac.manage", "Manage system-level roles & bindings"},
                new Object[]{"system.audit.read", "Read global audit logs"},
                new Object[]{"system.outbox.read", "Read outbox events system-wide"}
        );
        jdbc.batchUpdate(
                "INSERT INTO permissions(name, description) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
                sysPerms
        );
    }

    private void seedRolePermissions() {
        var mappings = List.of(
                new Object[]{"OWNER", "org.read"},
                new Object[]{"OWNER", "org.manage"},
                new Object[]{"OWNER", "user.invite"},
                new Object[]{"OWNER", "member.manage"},
                new Object[]{"OWNER", "rbac.manage"},
                new Object[]{"OWNER", "project.manage"},
                new Object[]{"OWNER", "project.member.manage"},

                new Object[]{"ADMIN", "org.read"},
                new Object[]{"ADMIN", "user.invite"},
                new Object[]{"ADMIN", "member.manage"},
                new Object[]{"ADMIN", "rbac.manage"},
                new Object[]{"ADMIN", "project.manage"},
                new Object[]{"ADMIN", "project.member.manage"},

                new Object[]{"MEMBER", "org.read"},

                new Object[]{"PROJECT_ADMIN", "project.manage"},
                new Object[]{"PROJECT_ADMIN", "project.member.manage"},
                new Object[]{"PROJECT_ADMIN", "org.read"},

                new Object[]{"PROJECT_EDITOR", "org.read"},
                new Object[]{"PROJECT_VIEWER", "org.read"}
        );

        jdbc.batchUpdate(
                "INSERT INTO role_permissions(role_id, perm_id) " +
                        "SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = ? AND p.name = ? " +
                        "ON CONFLICT DO NOTHING",
                mappings
        );

        var sysMappings = List.of(
                new Object[]{"SYS_ADMIN", "system.manage"},
                new Object[]{"SYS_ADMIN", "system.org.manage"},
                new Object[]{"SYS_ADMIN", "system.user.manage"},
                new Object[]{"SYS_ADMIN", "system.rbac.manage"},
                new Object[]{"SYS_ADMIN", "system.audit.read"},
                new Object[]{"SYS_ADMIN", "system.outbox.read"}
        );

        jdbc.batchUpdate(
                "INSERT INTO role_permissions(role_id, perm_id) " +
                        "SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = ? AND p.name = ? " +
                        "ON CONFLICT DO NOTHING",
                sysMappings
        );
    }

    private void bootstrapRootFromEnv() {
        String email = System.getenv("IDENTITY_BOOTSTRAP_EMAIL");
        if (email == null || email.isBlank()) return;
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE UPPER(email) = UPPER(?)",
                Integer.class, email
        );
        if (count == null || count == 0) return;

        Integer rootRoleId = jdbc.query(
                "SELECT id FROM roles WHERE name = 'ROOT'",
                (rs) -> rs.next() ? rs.getInt(1) : null
        );
        if (rootRoleId == null) return;

        int inserted = jdbc.update(
                "WITH u AS (SELECT id AS uid FROM users WHERE UPPER(email) = UPPER(?)) " +
                        "INSERT INTO role_bindings(id, org_id, user_id, role_id, scope, scope_id, created_at) " +
                        "SELECT gen_random_uuid(), NULL, u.uid, ?, 'SYSTEM', NULL, now() FROM u " +
                        "WHERE NOT EXISTS (SELECT 1 FROM role_bindings rb WHERE rb.user_id = u.uid AND rb.role_id = ? AND rb.scope = 'SYSTEM' AND rb.org_id IS NULL AND rb.scope_id IS NULL)",
                email, rootRoleId, rootRoleId
        );
        if (inserted > 0) log.info("Bootstrapped ROOT system binding for {}", email);
    }
}

