package com.datn.identity.application;

import com.datn.identity.domain.audit.AuditLog;
import com.datn.identity.domain.audit.AuditLogRepository;
import com.datn.identity.domain.org.MemberType;
import com.datn.identity.domain.org.MembershipRepository;
import com.datn.identity.domain.org.Organization;
import com.datn.identity.domain.org.OrganizationRepository;
import com.datn.identity.domain.user.UserRepository;
import com.datn.identity.interfaces.api.dto.Dtos;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private final OrganizationRepository orgs;
    private final MembershipRepository memberships;
    private final AuditLogRepository auditLogs;
    private final UserRepository users;

    public DashboardService(
            OrganizationRepository orgs,
            MembershipRepository memberships,
            AuditLogRepository auditLogs,
            UserRepository users) {
        this.orgs = orgs;
        this.memberships = memberships;
        this.auditLogs = auditLogs;
        this.users = users;
    }

    /**
     * Get dashboard statistics for an organization.
     */
    public Dtos.DashboardStatsRes getDashboardStats(UUID orgId) {
        var org = orgs.findById(orgId)
            .orElseThrow(() -> new IllegalStateException("org_not_found"));

        var memberStats = getMemberStats(orgId);
        var activityStats = getActivityStats(orgId);

        return new Dtos.DashboardStatsRes(
            org.id().toString(),
            org.displayName(),
            org.status() != null ? org.status().name() : "ACTIVE",
            memberStats,
            activityStats
        );
    }

    private Dtos.MemberStats getMemberStats(UUID orgId) {
        long total = memberships.countByOrg(orgId);
        long owners = memberships.countByRole(orgId, "OWNER");
        long admins = memberships.countByRole(orgId, "ADMIN");
        long staff = memberships.countByMemberType(orgId, MemberType.STAFF);
        long partners = memberships.countByMemberType(orgId, MemberType.PARTNER);

        return new Dtos.MemberStats(total, owners, admins, staff, partners);
    }

    private Dtos.ActivityStats getActivityStats(UUID orgId) {
        long totalActions = auditLogs.countByOrgId(orgId);

        Instant now = Instant.now();
        Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
        Instant startOfWeek = now.minus(7, ChronoUnit.DAYS);

        long todayActions = auditLogs.countByOrgIdSince(orgId, startOfToday);
        long thisWeekActions = auditLogs.countByOrgIdSince(orgId, startOfWeek);

        List<AuditLog> recentLogs = auditLogs.findRecentByOrgId(orgId, 10);
        List<Dtos.RecentActivityRes> recentActivities = recentLogs.stream()
            .map(log -> {
                String userEmail = null;
                if (log.userId() != null) {
                    userEmail = users.findById(log.userId())
                        .map(u -> u.email().value())
                        .orElse(null);
                }
                return new Dtos.RecentActivityRes(
                    log.id().toString(),
                    log.userId() != null ? log.userId().toString() : null,
                    userEmail,
                    log.action().name(),
                    log.description(),
                    log.createdAt().toString()
                );
            })
            .collect(Collectors.toList());

        return new Dtos.ActivityStats(totalActions, todayActions, thisWeekActions, recentActivities);
    }
}
