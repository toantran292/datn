-- Add created_by column to issue table
ALTER TABLE "issue"
ADD COLUMN IF NOT EXISTS "created_by" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Create index for faster lookups by creator
CREATE INDEX IF NOT EXISTS "issue_created_by_idx" ON "issue"("created_by");
