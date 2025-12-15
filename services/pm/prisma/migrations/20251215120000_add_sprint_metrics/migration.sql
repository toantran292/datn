-- Add sprint metrics columns for tracking sprint performance

-- Snapshot metrics taken when sprint starts
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "initial_issue_count" INTEGER;
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "initial_story_points" DECIMAL(10, 2);
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMPTZ;

-- Completion metrics
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ;
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "completed_issue_count" INTEGER;
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "velocity" DECIMAL(10, 2);
