-- Add incompleted_issue_count column to sprint table for tracking incomplete issues

ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "incompleted_issue_count" INTEGER;
