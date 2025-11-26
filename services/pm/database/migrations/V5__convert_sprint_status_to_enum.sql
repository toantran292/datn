-- Create enum type for sprint status
CREATE TYPE "SprintStatus" AS ENUM ('FUTURE', 'ACTIVE', 'CLOSED');

-- Drop the existing column and recreate with enum type
ALTER TABLE sprint
    DROP COLUMN status;

ALTER TABLE sprint
    ADD COLUMN status "SprintStatus" NOT NULL DEFAULT 'FUTURE';
