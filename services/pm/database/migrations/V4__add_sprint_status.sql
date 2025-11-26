-- Add status column to sprint table
ALTER TABLE sprint
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'FUTURE';

-- Add comment
COMMENT ON COLUMN sprint.status IS 'Sprint status: FUTURE, ACTIVE, or CLOSED';
