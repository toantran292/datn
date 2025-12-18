-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('CRITICAL', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RiskAlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'APPLIED', 'DISMISSED');

-- CreateTable
CREATE TABLE "sprint_history" (
    "id" UUID NOT NULL,
    "sprint_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "committed_points" INTEGER NOT NULL,
    "completed_points" INTEGER NOT NULL,
    "velocity" INTEGER NOT NULL,
    "health_score_overall" INTEGER,
    "health_score_commitment" INTEGER,
    "health_score_progress" INTEGER,
    "health_score_velocity" INTEGER,
    "health_score_quality" INTEGER,
    "health_score_balance" INTEGER,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "success_rate" DECIMAL(3,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprint_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_alert" (
    "id" UUID NOT NULL,
    "sprint_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "risk_type" VARCHAR(50) NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "impact_score" INTEGER,
    "status" "RiskAlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMPTZ,
    "resolved_at" TIMESTAMPTZ,
    "affected_issues" JSONB,
    "metadata" JSONB,
    "detected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "risk_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_recommendation" (
    "id" UUID NOT NULL,
    "alert_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expected_impact" TEXT,
    "effort_estimate" VARCHAR(50),
    "suggested_issues" JSONB,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "applied_at" TIMESTAMPTZ,
    "applied_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_health_snapshot" (
    "id" UUID NOT NULL,
    "sprint_id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "days_elapsed" INTEGER NOT NULL,
    "days_remaining" INTEGER NOT NULL,
    "committed_points" INTEGER NOT NULL,
    "completed_points" INTEGER NOT NULL,
    "in_progress_points" INTEGER NOT NULL,
    "blocked_points" INTEGER NOT NULL,
    "health_score_overall" INTEGER NOT NULL,
    "health_score_breakdown" JSONB NOT NULL,
    "active_risks_count" INTEGER NOT NULL DEFAULT 0,
    "critical_risks_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprint_health_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sprint_history_sprint_id_idx" ON "sprint_history"("sprint_id");

-- CreateIndex
CREATE INDEX "sprint_history_project_id_idx" ON "sprint_history"("project_id");

-- CreateIndex
CREATE INDEX "sprint_history_start_date_idx" ON "sprint_history"("start_date");

-- CreateIndex
CREATE INDEX "risk_alert_sprint_id_status_idx" ON "risk_alert"("sprint_id", "status");

-- CreateIndex
CREATE INDEX "risk_alert_project_id_idx" ON "risk_alert"("project_id");

-- CreateIndex
CREATE INDEX "risk_alert_severity_status_idx" ON "risk_alert"("severity", "status");

-- CreateIndex
CREATE INDEX "risk_alert_detected_at_idx" ON "risk_alert"("detected_at");

-- CreateIndex
CREATE INDEX "risk_recommendation_alert_id_idx" ON "risk_recommendation"("alert_id");

-- CreateIndex
CREATE INDEX "sprint_health_snapshot_sprint_id_snapshot_date_idx" ON "sprint_health_snapshot"("sprint_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_health_snapshot_sprint_id_snapshot_date_key" ON "sprint_health_snapshot"("sprint_id", "snapshot_date");

-- AddForeignKey
ALTER TABLE "risk_recommendation" ADD CONSTRAINT "risk_recommendation_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "risk_alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
