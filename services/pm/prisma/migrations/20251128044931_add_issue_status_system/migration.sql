-- CreateTable: issue_status
CREATE TABLE "issue_status" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "issue_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_status_project_id_idx" ON "issue_status"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_project_status_order" ON "issue_status"("project_id", "order");

-- AddForeignKey
ALTER TABLE "issue_status" ADD CONSTRAINT "issue_status_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default statuses for existing projects
INSERT INTO "issue_status" ("id", "project_id", "name", "description", "color", "order", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    p.id,
    'TO DO',
    'Issues that are yet to be started',
    '#94A3B8',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "project" p;

INSERT INTO "issue_status" ("id", "project_id", "name", "description", "color", "order", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    p.id,
    'IN PROGRESS',
    'Issues that are currently being worked on',
    '#3B82F6',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "project" p;

INSERT INTO "issue_status" ("id", "project_id", "name", "description", "color", "order", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    p.id,
    'IN REVIEW',
    'Issues that are waiting for review',
    '#F59E0B',
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "project" p;

INSERT INTO "issue_status" ("id", "project_id", "name", "description", "color", "order", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    p.id,
    'DONE',
    'Issues that have been completed',
    '#10B981',
    3,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "project" p;

-- Add status_id column to issue table
ALTER TABLE "issue" ADD COLUMN "status_id" UUID;

-- Migrate existing data from state to status_id
UPDATE "issue" i
SET "status_id" = (
    SELECT s.id
    FROM "issue_status" s
    WHERE s.project_id = i.project_id
    AND s.name = 'TO DO'
    LIMIT 1
)
WHERE i.state = 'TODO';

UPDATE "issue" i
SET "status_id" = (
    SELECT s.id
    FROM "issue_status" s
    WHERE s.project_id = i.project_id
    AND s.name = 'IN PROGRESS'
    LIMIT 1
)
WHERE i.state = 'IN_PROGRESS';

UPDATE "issue" i
SET "status_id" = (
    SELECT s.id
    FROM "issue_status" s
    WHERE s.project_id = i.project_id
    AND s.name = 'IN REVIEW'
    LIMIT 1
)
WHERE i.state = 'IN_REVIEW';

UPDATE "issue" i
SET "status_id" = (
    SELECT s.id
    FROM "issue_status" s
    WHERE s.project_id = i.project_id
    AND s.name = 'DONE'
    LIMIT 1
)
WHERE i.state IN ('DONE', 'CANCELLED');

-- Make status_id NOT NULL
ALTER TABLE "issue" ALTER COLUMN "status_id" SET NOT NULL;

-- Drop old state column
ALTER TABLE "issue" DROP COLUMN "state";

-- CreateIndex for status_id
CREATE INDEX "issue_status_id_idx" ON "issue"("status_id");

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "issue_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
