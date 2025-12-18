# AI Risk Detector & Sprint Health Monitor

## 📋 Table of Contents
- [Overview](#overview)
- [Business Value](#business-value)
- [Feature Specifications](#feature-specifications)
- [Technical Architecture](#technical-architecture)
- [Risk Detection Rules](#risk-detection-rules)
- [Health Metrics & Scoring](#health-metrics--scoring)
- [API Design](#api-design)
- [UI/UX Design](#uiux-design)
- [Implementation Phases](#implementation-phases)
- [Success Metrics](#success-metrics)

---

## Overview

### What is AI Risk Detector & Sprint Health Monitor?

**AI Risk Detector & Sprint Health Monitor** là một hệ thống AI-powered giám sát và phân tích real-time để:
- 🔍 **Phát hiện proactive các rủi ro** trong Sprint/Project trước khi chúng trở thành vấn đề nghiêm trọng
- 📊 **Đánh giá Sprint Health Score** dựa trên multiple factors
- 🚨 **Cảnh báo tự động** khi phát hiện patterns bất thường
- 💡 **Đề xuất actions** để mitigate risks và improve sprint health
- 📈 **Track trends** để identify systemic issues

### Core Problem Statement

**Problems in Current Agile/Scrum Practice:**

1. **Reactive Management**
   - Teams thường chỉ phát hiện issues khi đã quá muộn (Sprint failed, deadline missed)
   - Scrum Masters spend too much time manually tracking metrics

2. **Hidden Risks**
   - Overcommitment không được phát hiện sớm
   - Blocked issues bị ignored
   - Dependencies issues only surface at Sprint Review
   - Velocity decline không được notice cho đến khi impact

3. **Lack of Actionable Insights**
   - Metrics exist but không có guidance about "what to do next"
   - Risk identification manual và không consistent
   - No data-driven early warning system

### Solution Approach

**AI Risk Detector** sử dụng combination of:
- **Rule-based Detection**: Deterministic rules cho known risk patterns
- **Statistical Analysis**: Anomaly detection dựa trên historical data
- **Machine Learning**: Pattern recognition từ successful/failed sprints
- **Predictive Analytics**: Forecast sprint outcomes dựa trên current state

---

## Business Value

### For Scrum Masters / Project Managers

- ✅ **Save 5-10 hours/week** on manual monitoring và reporting
- ✅ **Early warning system** để intervene before issues escalate
- ✅ **Data-driven decisions** thay vì gut feeling
- ✅ **Proactive risk management** thay vì reactive fire-fighting

### For Development Teams

- ✅ **Transparent visibility** into sprint health
- ✅ **Actionable feedback** on how to improve
- ✅ **Reduced stress** from last-minute surprises
- ✅ **Better sprint planning** với lessons learned

### For Stakeholders

- ✅ **Predictable delivery** với fewer sprint failures
- ✅ **Higher sprint success rate** (70% → 85%+)
- ✅ **Better resource utilization**
- ✅ **Trust in team commitments**

### Competitive Advantages vs Existing Tools

| Feature | Jira (Native) | Linear | Monday.com | **Our AI Risk Detector** |
|---------|--------------|--------|------------|--------------------------|
| Real-time risk detection | ❌ | ❌ | ❌ | ✅ |
| AI-powered insights | ❌ | Limited | ❌ | ✅ |
| Proactive alerts | Manual | Manual | Manual | ✅ Automatic |
| Sprint health score | ❌ | ❌ | ❌ | ✅ |
| Actionable recommendations | ❌ | ❌ | ❌ | ✅ |
| Trend analysis | Basic | Basic | Basic | ✅ Advanced |

---

## Feature Specifications

### 1. Risk Categories

#### 🔴 Critical Risks (Severity: HIGH)

**1.1. Sprint Overcommitment**
- **Definition**: Committed story points > team capacity by 20%+
- **Detection Logic**:
  ```
  overcommitment_ratio = committed_points / (avg_velocity * 1.2)
  if overcommitment_ratio > 1.0:
      risk = CRITICAL
  ```
- **Impact**: High probability of incomplete sprint
- **Recommended Action**: Remove low-priority items or extend sprint

**1.2. Circular Dependencies**
- **Definition**: Issue A blocks B, B blocks C, C blocks A
- **Detection Logic**: DFS cycle detection in dependency graph
- **Impact**: Entire chain of issues cannot proceed
- **Recommended Action**: Break circular dependency immediately

**1.3. Zero Progress Mid-Sprint**
- **Definition**: No issues moved to "Done" after 50% of sprint elapsed
- **Detection Logic**:
  ```
  sprint_progress = days_elapsed / sprint_duration
  if sprint_progress > 0.5 AND completed_points == 0:
      risk = CRITICAL
  ```
- **Impact**: Sprint failure imminent
- **Recommended Action**: Emergency team sync to unblock

#### 🟡 Medium Risks (Severity: MEDIUM)

**1.4. Long-Running Blocked Issues**
- **Definition**: Issues blocked for 3+ days
- **Detection Logic**:
  ```
  blocked_duration = now - blocked_since_timestamp
  if blocked_duration > 72 hours:
      risk = MEDIUM
  ```
- **Impact**: Delays and cascading effects
- **Recommended Action**: Escalate blocker resolution

**1.5. Unbalanced Workload**
- **Definition**: Workload variance across team members > 50%
- **Detection Logic**:
  ```
  workloads = [sum(assignee_points) for each member]
  mean = average(workloads)
  variance = max(workloads) - min(workloads)
  if variance / mean > 0.5:
      risk = MEDIUM
  ```
- **Impact**: Some members overwhelmed, others idle
- **Recommended Action**: Redistribute issues

**1.6. Velocity Decline Trend**
- **Definition**: Current sprint velocity trending 30% below historical average
- **Detection Logic**:
  ```
  projected_velocity = completed_points / (days_elapsed / sprint_days)
  if projected_velocity < avg_velocity * 0.7:
      risk = MEDIUM
  ```
- **Impact**: Team capacity issues or estimation problems
- **Recommended Action**: Investigate root cause (team morale, technical debt, etc.)

#### 🔵 Low Risks (Severity: LOW)

**1.7. Missing Estimates**
- **Definition**: >20% of sprint issues lack story points
- **Detection Logic**: `unestimated_count / total_issues > 0.2`
- **Impact**: Planning accuracy affected
- **Recommended Action**: Estimate issues in next refinement

**1.8. Missing Assignees**
- **Definition**: >15% of sprint issues not assigned
- **Impact**: Unclear ownership
- **Recommended Action**: Assign during daily standup

**1.9. Old Backlog Items**
- **Definition**: Issues in backlog for 90+ days without activity
- **Impact**: Potential tech debt or outdated requirements
- **Recommended Action**: Review and archive/update

### 2. Sprint Health Score

**Overall Health Calculation:**

```typescript
interface SprintHealthScore {
  overall: number;        // 0-100
  breakdown: {
    commitment: number;   // 0-100 (capacity utilization)
    progress: number;     // 0-100 (burndown health)
    velocity: number;     // 0-100 (compared to average)
    quality: number;      // 0-100 (blocked issues, dependencies)
    balance: number;      // 0-100 (workload distribution)
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
}
```

**Scoring Algorithm:**

```
Commitment Score (20%):
  - Optimal: 80-100% capacity → 100 points
  - Undercommitment: 50-79% capacity → 50-80 points
  - Overcommitment: 101-120% capacity → 60-40 points
  - Severe overcommitment: >120% → 0-40 points

Progress Score (30%):
  - On track: actual = ideal burndown ±10% → 100 points
  - Slight delay: 10-20% behind → 70-90 points
  - Concerning: 20-40% behind → 40-70 points
  - Critical: >40% behind → 0-40 points

Velocity Score (20%):
  - Above average: +10%+ → 100 points
  - On average: ±10% → 80-100 points
  - Below average: -10% to -30% → 50-80 points
  - Significantly below: <-30% → 0-50 points

Quality Score (20%):
  - No blocked issues, clean dependencies → 100 points
  - 1-2 blocked issues → 80 points
  - 3-5 blocked issues → 60 points
  - 6+ blocked issues or circular deps → 0-40 points

Balance Score (10%):
  - Even workload distribution (variance <20%) → 100 points
  - Slight imbalance (20-50% variance) → 60-80 points
  - High imbalance (>50% variance) → 0-60 points

Overall Score = weighted average
Grade: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
Status:
  - HEALTHY: ≥80
  - AT_RISK: 60-79
  - CRITICAL: <60
```

### 3. Alert System

**Alert Triggers:**

| Alert Type | Trigger Condition | Frequency | Recipients |
|------------|------------------|-----------|------------|
| Critical Risk Detected | Any critical risk appears | Immediate | Scrum Master, Team Lead |
| Daily Health Summary | Every day at 9 AM | Daily | Scrum Master |
| Sprint Progress Warning | Progress score < 60 | Daily (if triggered) | Scrum Master |
| Velocity Alert | Velocity trending down 2 sprints | Per sprint | Scrum Master, Product Owner |
| Overcommitment Warning | Commitment > 110% | At sprint start | Scrum Master |

**Alert Delivery Channels:**
- 📧 Email notifications
- 🔔 In-app notifications
- 💬 Slack/Teams integration (future)
- 📱 Mobile push (future)

### 4. Recommendations Engine

**AI-Generated Action Items:**

For each detected risk, system provides:
- **Problem Description** (Vietnamese)
- **Impact Assessment** (scale 1-10)
- **Root Cause Analysis** (when identifiable)
- **Recommended Actions** (prioritized list)
- **Similar Past Cases** (from historical data)

**Example Output:**

```json
{
  "risk": {
    "type": "OVERCOMMITMENT",
    "severity": "CRITICAL",
    "description": "Sprint đang bị overcommit 35%. Team cam kết 65 điểm nhưng velocity trung bình chỉ 48 điểm.",
    "impactScore": 9
  },
  "recommendations": [
    {
      "priority": 1,
      "action": "Di chuyển 2-3 stories có priority thấp nhất về backlog",
      "expectedImpact": "Giảm commitment xuống 48-52 điểm (optimal range)",
      "effort": "5 minutes",
      "suggestedIssues": ["PM-123", "PM-145"]
    },
    {
      "priority": 2,
      "action": "Extend sprint duration thêm 2 ngày nếu không thể giảm scope",
      "expectedImpact": "Tăng capacity lên 60 điểm",
      "effort": "Requires PO approval"
    }
  ],
  "historicalContext": {
    "similarSprints": 3,
    "successRate": "33% (1/3 sprints with 130%+ commitment completed successfully)"
  }
}
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  - Sprint Health Dashboard                                   │
│  - Risk Alerts Panel                                         │
│  - Trend Charts (Velocity, Burndown, Health Score)          │
│  - Recommendations Feed                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Backend (NestJS)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Risk Detection Service                      │   │
│  │  - Rule Engine                                       │   │
│  │  - Statistical Analyzer                              │   │
│  │  - ML Predictor (future)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Health Scoring Service                      │   │
│  │  - Commitment Calculator                             │   │
│  │  - Progress Tracker                                  │   │
│  │  - Velocity Analyzer                                 │   │
│  │  - Quality Assessor                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Recommendations Service                     │   │
│  │  - OpenAI GPT-4o-mini                                │   │
│  │  - Context Builder                                   │   │
│  │  - Action Generator                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Alert Service                               │   │
│  │  - Notification Queue                                │   │
│  │  - Email Sender                                      │   │
│  │  - Alert History                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Database Queries
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   PostgreSQL Database                        │
├─────────────────────────────────────────────────────────────┤
│  - Issues (with status, points, assignees, dependencies)    │
│  - Sprints (with start/end dates, capacity, velocity)       │
│  - Sprint History (completed sprints metrics)               │
│  - Risk Alerts History                                       │
│  - Health Score History                                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Model Extensions

**New Tables:**

```sql
-- Sprint history for trend analysis
CREATE TABLE sprint_history (
  id UUID PRIMARY KEY,
  sprint_id UUID REFERENCES sprints(id),
  project_id UUID NOT NULL,

  -- Metrics
  committed_points INTEGER NOT NULL,
  completed_points INTEGER NOT NULL,
  velocity INTEGER NOT NULL,

  -- Health scores
  health_score_overall INTEGER, -- 0-100
  health_score_commitment INTEGER,
  health_score_progress INTEGER,
  health_score_velocity INTEGER,
  health_score_quality INTEGER,
  health_score_balance INTEGER,

  -- Metadata
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  success_rate FLOAT, -- 0.0-1.0

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_scores CHECK (
    health_score_overall BETWEEN 0 AND 100 AND
    health_score_commitment BETWEEN 0 AND 100 AND
    health_score_progress BETWEEN 0 AND 100 AND
    health_score_velocity BETWEEN 0 AND 100 AND
    health_score_quality BETWEEN 0 AND 100 AND
    health_score_balance BETWEEN 0 AND 100
  )
);

-- Risk alerts
CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY,
  sprint_id UUID REFERENCES sprints(id),
  project_id UUID NOT NULL,

  -- Risk details
  risk_type VARCHAR(50) NOT NULL, -- OVERCOMMITMENT, BLOCKED_ISSUES, etc.
  severity VARCHAR(20) NOT NULL, -- CRITICAL, MEDIUM, LOW
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  impact_score INTEGER, -- 0-10

  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,

  -- Metadata
  detected_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB, -- Additional context

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recommendations
CREATE TABLE risk_recommendations (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES risk_alerts(id) ON DELETE CASCADE,

  priority INTEGER NOT NULL, -- 1, 2, 3...
  action TEXT NOT NULL,
  expected_impact TEXT,
  effort_estimate VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPLIED, DISMISSED
  applied_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Health score snapshots (for daily tracking)
CREATE TABLE sprint_health_snapshots (
  id UUID PRIMARY KEY,
  sprint_id UUID REFERENCES sprints(id),
  snapshot_date DATE NOT NULL,

  -- Current metrics at snapshot time
  days_elapsed INTEGER,
  days_remaining INTEGER,
  committed_points INTEGER,
  completed_points INTEGER,
  in_progress_points INTEGER,
  blocked_points INTEGER,

  -- Health scores
  health_score_overall INTEGER,
  health_score_breakdown JSONB,

  -- Detected risks
  active_risks_count INTEGER DEFAULT 0,
  critical_risks_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(sprint_id, snapshot_date)
);

CREATE INDEX idx_risk_alerts_sprint ON risk_alerts(sprint_id, status);
CREATE INDEX idx_risk_alerts_severity ON risk_alerts(severity, status);
CREATE INDEX idx_health_snapshots_sprint_date ON sprint_health_snapshots(sprint_id, snapshot_date DESC);
```

### Calculation Frequency

| Metric | Calculation Frequency | Trigger |
|--------|----------------------|---------|
| Sprint Health Score | Every 4 hours | Scheduled cron job |
| Risk Detection | Every 1 hour | Scheduled cron job |
| Real-time alerts | On issue state change | Event-driven (webhook) |
| Daily summary | Once per day (9 AM) | Scheduled cron job |
| Trend analysis | On-demand | User request |

---

## Risk Detection Rules

### Rule Engine Implementation

```typescript
// Backend: src/modules/risk-detector/rules/

interface RiskRule {
  id: string;
  name: string;
  category: RiskCategory;
  severity: RiskSeverity;
  check: (context: SprintContext) => RiskResult | null;
}

interface SprintContext {
  sprint: Sprint;
  issues: Issue[];
  history: SprintHistory[];
  teamCapacity: number;
}

interface RiskResult {
  type: string;
  severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impactScore: number;
  affectedIssues?: string[];
  metadata?: Record<string, any>;
}

// Example: Overcommitment Rule
export class OvercommitmentRule implements RiskRule {
  id = 'OVERCOMMITMENT';
  name = 'Sprint Overcommitment Detection';
  category = 'CAPACITY';
  severity = 'CRITICAL';

  check(context: SprintContext): RiskResult | null {
    const { sprint, issues, history, teamCapacity } = context;

    // Calculate committed points
    const committedPoints = issues
      .filter(i => i.sprintId === sprint.id)
      .reduce((sum, i) => sum + (i.point || 0), 0);

    // Calculate average velocity from last 3 sprints
    const recentSprints = history.slice(-3);
    const avgVelocity = recentSprints.length > 0
      ? recentSprints.reduce((sum, s) => sum + s.velocity, 0) / recentSprints.length
      : teamCapacity; // Fallback to capacity if no history

    // Calculate overcommitment ratio
    const ratio = committedPoints / (avgVelocity * 1.1); // 10% buffer

    if (ratio > 1.2) {
      // Severe overcommitment
      return {
        type: 'OVERCOMMITMENT',
        severity: 'CRITICAL',
        title: 'Sprint Overcommitment Nghiêm Trọng',
        description: `Sprint đang bị overcommit ${Math.round((ratio - 1) * 100)}%. Team cam kết ${committedPoints} điểm nhưng velocity trung bình chỉ ${Math.round(avgVelocity)} điểm.`,
        impactScore: Math.min(10, Math.floor(ratio * 5)),
        metadata: {
          committedPoints,
          avgVelocity,
          overcommitmentRatio: ratio,
          recommendedPoints: Math.round(avgVelocity * 1.1)
        }
      };
    }

    return null; // No risk detected
  }
}

// Example: Blocked Issues Rule
export class BlockedIssuesRule implements RiskRule {
  id = 'BLOCKED_ISSUES';
  name = 'Long-Running Blocked Issues';
  category = 'PROGRESS';
  severity = 'MEDIUM';

  check(context: SprintContext): RiskResult | null {
    const { sprint, issues } = context;
    const now = new Date();

    // Find blocked issues
    const blockedIssues = issues.filter(i =>
      i.state === 'BLOCKED' && i.sprintId === sprint.id
    );

    // Check how long they've been blocked
    const longBlockedIssues = blockedIssues.filter(i => {
      const blockedDuration = now.getTime() - new Date(i.stateChangedAt).getTime();
      const hoursBlocked = blockedDuration / (1000 * 60 * 60);
      return hoursBlocked > 72; // 3 days
    });

    if (longBlockedIssues.length > 0) {
      const totalBlockedPoints = longBlockedIssues.reduce((sum, i) => sum + (i.point || 0), 0);

      return {
        type: 'BLOCKED_ISSUES',
        severity: longBlockedIssues.length >= 3 ? 'CRITICAL' : 'MEDIUM',
        title: `${longBlockedIssues.length} Issues Bị Block Lâu`,
        description: `${longBlockedIssues.length} issues (${totalBlockedPoints} points) đã bị block quá 72 giờ và chưa được giải quyết.`,
        impactScore: Math.min(10, longBlockedIssues.length * 2),
        affectedIssues: longBlockedIssues.map(i => i.id),
        metadata: {
          blockedIssuesCount: longBlockedIssues.length,
          totalBlockedPoints
        }
      };
    }

    return null;
  }
}
```

### All Rules to Implement

**Phase 1 (MVP):**
1. ✅ Overcommitment Rule
2. ✅ Blocked Issues Rule
3. ✅ Zero Progress Rule
4. ✅ Missing Estimates Rule
5. ✅ Workload Imbalance Rule

**Phase 2:**
6. Velocity Decline Rule
7. Circular Dependencies Rule
8. Burndown Deviation Rule
9. High-Risk Issue Concentration Rule
10. Sprint Goal Misalignment Rule

**Phase 3 (ML-powered):**
11. Sprint Failure Prediction (ML model)
12. Anomaly Detection (Statistical)
13. Pattern Recognition from Historical Data

---

## API Design

### Endpoints

```typescript
// ============================================================================
// SPRINT HEALTH
// ============================================================================

/**
 * GET /api/sprints/:sprintId/health
 * Get current sprint health score and breakdown
 */
interface GetSprintHealthResponse {
  success: boolean;
  data: {
    sprint: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
    };
    health: SprintHealthScore;
    lastUpdated: string;
  };
}

/**
 * GET /api/sprints/:sprintId/health/history
 * Get historical health snapshots for trend chart
 */
interface GetHealthHistoryResponse {
  success: boolean;
  data: {
    snapshots: Array<{
      date: string;
      healthScore: number;
      breakdown: {
        commitment: number;
        progress: number;
        velocity: number;
        quality: number;
        balance: number;
      };
      activeRisksCount: number;
    }>;
  };
}

/**
 * POST /api/sprints/:sprintId/health/recalculate
 * Force recalculation of health score (admin only)
 */
interface RecalculateHealthResponse {
  success: boolean;
  data: SprintHealthScore;
}

// ============================================================================
// RISK DETECTION
// ============================================================================

/**
 * GET /api/sprints/:sprintId/risks
 * Get all active risks for a sprint
 */
interface GetSprintRisksRequest {
  severity?: 'CRITICAL' | 'MEDIUM' | 'LOW';
  status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  includeRecommendations?: boolean;
}

interface GetSprintRisksResponse {
  success: boolean;
  data: {
    risks: Array<{
      id: string;
      type: string;
      severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
      title: string;
      description: string;
      impactScore: number;
      status: string;
      detectedAt: string;
      affectedIssues?: string[];
      recommendations?: Array<{
        priority: number;
        action: string;
        expectedImpact: string;
        effort: string;
      }>;
    }>;
    summary: {
      total: number;
      critical: number;
      medium: number;
      low: number;
    };
  };
}

/**
 * POST /api/sprints/:sprintId/risks/detect
 * Trigger immediate risk detection (on-demand)
 */
interface DetectRisksResponse {
  success: boolean;
  data: {
    detectedRisks: number;
    risks: Array<RiskAlert>;
  };
}

/**
 * PUT /api/risks/:riskId/acknowledge
 * Acknowledge a risk alert
 */
interface AcknowledgeRiskRequest {
  note?: string;
}

interface AcknowledgeRiskResponse {
  success: boolean;
  data: {
    risk: RiskAlert;
  };
}

/**
 * PUT /api/risks/:riskId/resolve
 * Mark a risk as resolved
 */
interface ResolveRiskRequest {
  resolution: string;
  actionsTaken?: string[];
}

interface ResolveRiskResponse {
  success: boolean;
  data: {
    risk: RiskAlert;
  };
}

/**
 * DELETE /api/risks/:riskId/dismiss
 * Dismiss a false positive or non-actionable risk
 */
interface DismissRiskRequest {
  reason: string;
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * GET /api/risks/:riskId/recommendations
 * Get AI-generated recommendations for a specific risk
 */
interface GetRecommendationsResponse {
  success: boolean;
  data: {
    risk: RiskAlert;
    recommendations: Array<{
      id: string;
      priority: number;
      action: string;
      expectedImpact: string;
      effortEstimate: string;
      status: 'PENDING' | 'APPLIED' | 'DISMISSED';
      suggestedIssues?: string[];
    }>;
    historicalContext?: {
      similarSprints: number;
      successRate: string;
      commonActions: string[];
    };
  };
}

/**
 * POST /api/risks/:riskId/recommendations/:recommendationId/apply
 * Mark a recommendation as applied
 */
interface ApplyRecommendationResponse {
  success: boolean;
  data: {
    recommendation: Recommendation;
  };
}

// ============================================================================
// ALERTS & NOTIFICATIONS
// ============================================================================

/**
 * GET /api/users/me/alerts
 * Get alerts for current user (Scrum Master)
 */
interface GetUserAlertsRequest {
  status?: 'UNREAD' | 'READ';
  severity?: 'CRITICAL' | 'MEDIUM' | 'LOW';
  limit?: number;
}

interface GetUserAlertsResponse {
  success: boolean;
  data: {
    alerts: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      severity: string;
      sprint: { id: string; name: string };
      createdAt: string;
      read: boolean;
    }>;
    unreadCount: number;
  };
}

/**
 * POST /api/alerts/:alertId/read
 * Mark alert as read
 */

// ============================================================================
// ANALYTICS & TRENDS
// ============================================================================

/**
 * GET /api/projects/:projectId/health/trends
 * Get health trends across multiple sprints
 */
interface GetHealthTrendsRequest {
  sprintCount?: number; // Default: 6 (last 6 sprints)
}

interface GetHealthTrendsResponse {
  success: boolean;
  data: {
    sprints: Array<{
      sprintName: string;
      startDate: string;
      endDate: string;
      healthScore: number;
      velocity: number;
      committedPoints: number;
      completedPoints: number;
      riskCount: number;
    }>;
    insights: {
      averageHealthScore: number;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
      commonRisks: Array<{ type: string; occurrences: number }>;
    };
  };
}
```

---

## UI/UX Design

### 1. Sprint Health Dashboard

**Location**: `/workspace/:slug/project/:id/sprint/:sprintId/health`

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Sprint Health Monitor                           [Refresh] [⚙️] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Overall Health Score: 78 (Grade: C)               │  │
│  │  ────────────────────────────────────────────────────     │  │
│  │  [====================================           ]  78%    │  │
│  │                 Status: AT RISK ⚠️                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────┬────────────────┬────────────────────────┐  │
│  │ Commitment: 85 │ Progress: 62   │ Velocity: 82           │  │
│  │ [==========]   │ [=======   ]   │ [=========  ]          │  │
│  │                │                │                        │  │
│  │ Quality: 90    │ Balance: 73    │                        │  │
│  │ [===========]  │ [========= ]   │                        │  │
│  └────────────────┴────────────────┴────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔴 Active Risks (3)                                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ [!] CRITICAL: Sprint Overcommitment                │  │  │
│  │  │     Sprint đang bị overcommit 35%. Đề xuất giảm   │  │  │
│  │  │     scope hoặc extend timeline.                    │  │  │
│  │  │     [View Details] [Acknowledge]                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ [!] MEDIUM: 2 Issues Blocked > 72 Hours            │  │  │
│  │  │     PM-123, PM-145 đang bị block và ảnh hưởng...  │  │  │
│  │  │     [View Details] [Acknowledge]                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📊 Health Trend (Last 7 Days)                            │  │
│  │      100 ┤                                                │  │
│  │       80 ┤        ●────●                                  │  │
│  │       60 ┤   ●────              ●────●                    │  │
│  │       40 ┤                                                │  │
│  │          └────────────────────────────────────            │  │
│  │          Mon  Tue  Wed  Thu  Fri  Sat  Sun               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💡 AI Recommendations (2)                                │  │
│  │  1. [Priority 1] Di chuyển 2 low-priority stories về... │  │
│  │     Expected Impact: Giảm commitment xuống optimal...   │  │
│  │     [Apply] [Dismiss]                                    │  │
│  │                                                            │  │
│  │  2. [Priority 2] Sync với team về blocked issues...     │  │
│  │     [View More]                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Risk Details Modal

**Triggered by**: Clicking "View Details" on a risk

```
┌──────────────────────────────────────────────────────────┐
│  Risk Details                                      [×]    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Type: Sprint Overcommitment                             │
│  Severity: 🔴 CRITICAL                                    │
│  Impact Score: 9/10                                       │
│  Detected: 2 hours ago                                    │
│                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│  Description:                                             │
│  Sprint đang bị overcommit 35%. Team cam kết 65 điểm     │
│  nhưng velocity trung bình của 3 sprints gần nhất chỉ    │
│  48 điểm. Điều này có nguy cơ cao dẫn đến sprint fail.   │
│                                                           │
│  Current Metrics:                                         │
│  • Committed Points: 65                                   │
│  • Average Velocity: 48                                   │
│  • Recommended Points: 52-53                              │
│  • Overcommitment Ratio: 135%                             │
│                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│  💡 AI Recommendations:                                   │
│                                                           │
│  1. [Priority 1] Di chuyển về backlog:                   │
│     • PM-123: Update user profile UI (8 points)          │
│     • PM-145: Add export feature (5 points)              │
│     Expected Impact: Giảm commitment xuống 52 điểm       │
│     Effort: 5 minutes                                     │
│     [Apply This]                                          │
│                                                           │
│  2. [Priority 2] Extend sprint thêm 2 ngày               │
│     Expected Impact: Tăng capacity lên ~60 điểm          │
│     Effort: Requires PO approval                         │
│     [View Details]                                        │
│                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│  Historical Context:                                      │
│  Found 3 similar sprints with 130%+ overcommitment:      │
│  • Sprint 12: Failed (completed 62% of scope)            │
│  • Sprint 8: Success (team worked overtime)              │
│  • Sprint 5: Failed (completed 71% of scope)             │
│  Success Rate: 33% (1/3)                                  │
│                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│            [Acknowledge]  [Resolve]  [Dismiss]           │
└──────────────────────────────────────────────────────────┘
```

### 3. Risks Panel (Sidebar Widget)

**Location**: Sidebar on Sprint Board page

```
┌─────────────────────────────────┐
│  ⚠️ Active Risks (3)            │
├─────────────────────────────────┤
│                                  │
│  🔴 Overcommitment (9/10)       │
│  35% over capacity              │
│  [Details]                       │
│                                  │
│  🟡 2 Blocked Issues (5/10)     │
│  PM-123, PM-145                 │
│  [Details]                       │
│                                  │
│  🔵 5 Unestimated (2/10)        │
│  [View All]                      │
│                                  │
├─────────────────────────────────┤
│  Health Score: 78 (C) ⚠️        │
│  [View Dashboard →]             │
└─────────────────────────────────┘
```

### 4. Alert Notifications

**In-app notification bell:**

```
┌────────────────────────────────────────────┐
│  Notifications (2 unread)                   │
├────────────────────────────────────────────┤
│  🔴 Sprint 15 - Critical Risk Detected     │
│     Overcommitment detected (35% over)     │
│     2 hours ago                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  🟡 Sprint 15 - Medium Risk                │
│     2 issues blocked > 72 hours            │
│     5 hours ago                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ✅ Sprint 14 Health Score: 85 (Good!)     │
│     Yesterday at 9:00 AM                   │
├────────────────────────────────────────────┤
│  [View All Notifications]                  │
└────────────────────────────────────────────┘
```

### 5. Project-Level Health Trends

**Location**: `/workspace/:slug/project/:id/analytics/health`

```
┌─────────────────────────────────────────────────────────────┐
│  Project Health Trends                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Health Score Trend (Last 6 Sprints)                     │
│  100 ┤                                                       │
│   90 ┤              ●                                        │
│   80 ┤         ●─────────●                                  │
│   70 ┤    ●─────              ●                             │
│   60 ┤                             ●                        │
│   50 ┤                                                       │
│      └──────────────────────────────────────                │
│      S10   S11   S12   S13   S14   S15                     │
│                                                              │
│  Trend: DECLINING 📉                                         │
│  Average: 76 (C)                                            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🎯 Most Common Risks:                                      │
│  1. Overcommitment (4 occurrences)                          │
│  2. Blocked Issues (3 occurrences)                          │
│  3. Velocity Decline (2 occurrences)                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  💡 Insights:                                                │
│  • Team velocity đang giảm 20% trong 2 sprints gần nhất    │
│  • Pattern: Overcommitment xảy ra khi có new features lớn  │
│  • Suggestion: Review capacity planning process             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: MVP - Core Risk Detection (Week 1-2)

**Backend:**
- [ ] Database schema (sprint_history, risk_alerts, recommendations tables)
- [ ] Risk Detection Service with 5 basic rules:
  - Overcommitment
  - Blocked Issues
  - Zero Progress
  - Missing Estimates
  - Workload Imbalance
- [ ] Health Scoring Service (basic calculation)
- [ ] REST API endpoints (health, risks)
- [ ] Cron job for scheduled detection (every 4 hours)

**Frontend:**
- [ ] Sprint Health Dashboard page
- [ ] Health Score display with breakdown
- [ ] Active Risks panel
- [ ] Risk Details modal
- [ ] Acknowledge/Resolve risk actions

**Testing:**
- [ ] Unit tests for risk rules
- [ ] Integration tests for API
- [ ] Manual testing with sample sprint data

**Deliverable**: Basic working system that detects 5 types of risks and displays health score

---

### Phase 2: Recommendations & Alerts (Week 3)

**Backend:**
- [ ] Recommendations Service with OpenAI integration
- [ ] Alert Service (in-app notifications)
- [ ] Email notification system
- [ ] Historical context analyzer
- [ ] Advanced rules:
  - Velocity Decline
  - Circular Dependencies
  - Burndown Deviation

**Frontend:**
- [ ] AI Recommendations display
- [ ] Apply/Dismiss recommendation actions
- [ ] Notifications bell with dropdown
- [ ] Alert preferences settings
- [ ] Risks sidebar widget on Sprint Board

**Testing:**
- [ ] Test AI recommendation quality
- [ ] Test notification delivery
- [ ] Load testing for cron jobs

**Deliverable**: Full feature with AI recommendations and alerting system

---

### Phase 3: Trends & Analytics (Week 4)

**Backend:**
- [ ] Sprint history aggregation service
- [ ] Trend analysis algorithms
- [ ] Project-level analytics API
- [ ] Export health reports (PDF/CSV)
- [ ] Advanced ML-based detection:
  - Sprint failure prediction
  - Anomaly detection

**Frontend:**
- [ ] Health Trends page
- [ ] Interactive trend charts
- [ ] Project-level health dashboard
- [ ] Export reports feature
- [ ] Comparison view (current vs historical sprints)

**Testing:**
- [ ] Test trend calculations accuracy
- [ ] Performance testing for large datasets
- [ ] User acceptance testing

**Deliverable**: Complete analytics suite with predictive capabilities

---

### Phase 4: Optimization & Polish (Week 5)

**Backend:**
- [ ] Performance optimization (caching, indexing)
- [ ] Webhook support for real-time detection
- [ ] Advanced ML models training
- [ ] API rate limiting
- [ ] Monitoring & logging

**Frontend:**
- [ ] UI/UX refinements
- [ ] Mobile responsive design
- [ ] Loading states & skeletons
- [ ] Error handling improvements
- [ ] Accessibility (WCAG)

**Testing:**
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Usability testing

**Deliverable**: Production-ready, polished feature

---

## Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Sprint Success Rate | +15% improvement | Compare before/after feature launch |
| Risk Detection Accuracy | >85% | Manual validation by Scrum Masters |
| False Positive Rate | <15% | Track dismissed risks |
| Time to Detect Issues | <4 hours | Average time from issue occurrence to alert |
| Scrum Master Time Saved | 5-10 hours/week | User survey |
| Feature Adoption Rate | >70% of teams | Usage analytics |
| Alert Response Time | <24 hours | Track acknowledge/resolve time |

### Qualitative Metrics

- **User Satisfaction**: Survey Scrum Masters (target: 4.5/5 stars)
- **Actionability**: % of recommendations marked as "helpful" (target: >80%)
- **Trust**: % of alerts that lead to action (target: >70%)

### Business Impact

- **Sprint Predictability**: Reduced variance in sprint outcomes
- **Team Morale**: Fewer last-minute surprises and overtime
- **Stakeholder Confidence**: More accurate delivery forecasts

---

## Competitive Analysis

### vs Jira Advanced Roadmaps

| Feature | Jira | Our Solution |
|---------|------|--------------|
| Risk detection | Manual | ✅ Automated AI |
| Real-time alerts | ❌ | ✅ Yes |
| Health scoring | ❌ | ✅ Yes |
| Recommendations | ❌ | ✅ AI-powered |
| Trend analysis | Basic | ✅ Advanced |
| Price | $7.75/user/mo | ✅ Included |

### vs Linear

Linear has basic sprint metrics but no proactive risk detection or AI insights.

### Unique Value Proposition

1. **Proactive not Reactive**: Detect issues before they become blockers
2. **AI-Powered Insights**: Not just data, but actionable recommendations
3. **Vietnamese-first**: Recommendations in Vietnamese for local teams
4. **Integrated**: Seamless with existing PM tool, no context switching
5. **Affordable**: Part of base product, not premium add-on

---

## Future Enhancements (Post-MVP)

### Advanced AI Capabilities

1. **Predictive Sprint Success Model**
   - ML model trained on historical sprint data
   - Predict probability of sprint success at sprint start
   - Confidence score: "85% chance of successful sprint"

2. **Team Capacity Learning**
   - Learn team's actual capacity over time
   - Adjust recommendations based on team-specific patterns
   - Account for individual developer productivity

3. **Smart Sprint Planning Suggestions**
   - AI suggests which issues to include in next sprint
   - Optimize for priority, dependencies, and capacity
   - "Add PM-123, PM-145 for optimal sprint load"

### Integrations

1. **Slack/Teams Bot**
   - Send risk alerts to team channels
   - Daily health summary
   - Interactive commands: `/sprint-health`, `/risks`

2. **Calendar Integration**
   - Suggest sprint planning meetings when health is declining
   - Remind about pending risks before standup

3. **GitHub/GitLab Integration**
   - Correlate code activity with issue progress
   - Detect stalled issues by commit activity

### Advanced Analytics

1. **Team Performance Benchmarking**
   - Compare team's metrics against industry averages
   - Identify strengths and improvement areas

2. **Root Cause Analysis**
   - Drill down into why sprints fail
   - Identify systemic issues vs one-off problems

3. **Predictive Timeline Estimates**
   - Based on current health, predict actual completion date
   - "At current pace, sprint will complete 3 days late"

---

## Appendix

### A. Sample Risk Detection Output

```json
{
  "sprintId": "sprint-123",
  "detectionTimestamp": "2025-12-16T10:30:00Z",
  "risks": [
    {
      "id": "risk-001",
      "type": "OVERCOMMITMENT",
      "severity": "CRITICAL",
      "title": "Sprint Overcommitment Nghiêm Trọng",
      "description": "Sprint đang bị overcommit 35%. Team cam kết 65 điểm nhưng velocity trung bình chỉ 48 điểm.",
      "impactScore": 9,
      "metadata": {
        "committedPoints": 65,
        "avgVelocity": 48,
        "overcommitmentRatio": 1.35,
        "recommendedPoints": 53
      },
      "recommendations": [
        {
          "priority": 1,
          "action": "Di chuyển 2-3 stories có priority thấp nhất về backlog",
          "expectedImpact": "Giảm commitment xuống 48-52 điểm (optimal range)",
          "effort": "5 minutes",
          "suggestedIssues": ["PM-123", "PM-145"]
        }
      ]
    },
    {
      "id": "risk-002",
      "type": "BLOCKED_ISSUES",
      "severity": "MEDIUM",
      "title": "2 Issues Bị Block Lâu",
      "description": "2 issues (13 points) đã bị block quá 72 giờ và chưa được giải quyết.",
      "impactScore": 5,
      "affectedIssues": ["PM-145", "PM-156"],
      "recommendations": [
        {
          "priority": 1,
          "action": "Sync với team external để resolve blocker cho PM-145",
          "expectedImpact": "Unblock 8 points, team có thể tiếp tục work",
          "effort": "30 minutes"
        }
      ]
    }
  ],
  "summary": {
    "totalRisks": 2,
    "criticalCount": 1,
    "mediumCount": 1,
    "lowCount": 0
  }
}
```

### B. Sample Health Score Calculation

```
Sprint Context:
- Committed Points: 50
- Completed Points: 20 (after 5 days)
- Sprint Duration: 10 days
- Team Average Velocity: 48
- Blocked Issues: 1 (5 points)
- Team Members: 5
- Workload Distribution: [12, 10, 8, 10, 10]

Calculation:

1. Commitment Score (20%):
   - Commitment Ratio = 50 / 48 = 1.04 (104%)
   - Score = 90 (slightly over, but acceptable)

2. Progress Score (30%):
   - Days Elapsed = 5 / 10 = 50%
   - Actual Progress = 20 / 50 = 40%
   - Ideal Progress = 50% (should be at 25 points)
   - Deviation = -10%
   - Score = 85 (slightly behind)

3. Velocity Score (20%):
   - Projected Velocity = (20 / 5) * 10 = 40
   - vs Average = 40 / 48 = 83%
   - Score = 70 (concerning decline)

4. Quality Score (20%):
   - Blocked Issues = 1
   - Blocked Points = 5 / 50 = 10%
   - Score = 80 (1 blocked issue)

5. Balance Score (10%):
   - Mean Workload = 10
   - Variance = (12 - 10) / 10 = 20%
   - Score = 90 (well balanced)

Overall Score:
= (90 * 0.2) + (85 * 0.3) + (70 * 0.2) + (80 * 0.2) + (90 * 0.1)
= 18 + 25.5 + 14 + 16 + 9
= 82.5 (Grade: B, Status: HEALTHY)
```

### C. AI Prompt Template for Recommendations

```
System Prompt:
You are an expert Agile/Scrum consultant analyzing sprint risks for a software development team.

Context:
- Sprint Name: Sprint 15
- Duration: 10 days (5 days elapsed, 5 remaining)
- Committed Points: 65
- Completed Points: 20
- Team Average Velocity: 48 points/sprint
- Team Size: 6 developers

Detected Risk:
Type: OVERCOMMITMENT
Severity: CRITICAL
Description: Sprint đang bị overcommit 35%. Team cam kết 65 điểm nhưng velocity trung bình chỉ 48 điểm.

Issues in Sprint:
1. PM-123: Update user profile UI (8 points, Priority: LOW, Status: TODO)
2. PM-145: Add export feature (5 points, Priority: LOW, Status: TODO)
3. PM-156: Fix payment bug (8 points, Priority: CRITICAL, Status: IN_PROGRESS)
4. PM-167: Database optimization (13 points, Priority: HIGH, Status: TODO)
... (truncated)

Historical Context:
- Last 3 sprints with similar overcommitment: 2 failed, 1 succeeded (with overtime)
- Common resolution: Move low-priority items to backlog

Task:
Generate 2-3 prioritized, actionable recommendations in Vietnamese to mitigate this risk.
For each recommendation, provide:
1. Action to take (specific and clear)
2. Expected impact (quantified if possible)
3. Effort estimate
4. Specific issues to act on (if applicable)

Output Format: Valid JSON
{
  "recommendations": [
    {
      "priority": 1,
      "action": "...",
      "expectedImpact": "...",
      "effort": "...",
      "suggestedIssues": ["PM-123", "PM-145"]
    }
  ]
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-16
**Author**: AI Architecture Team
**Status**: Draft for Review
