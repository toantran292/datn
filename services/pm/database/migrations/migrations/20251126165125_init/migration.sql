-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('FUTURE', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "project" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" VARCHAR(255) NOT NULL,
    "identifier" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "project_lead" UUID,
    "default_assignee" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'FUTURE',
    "goal" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "sprint_id" UUID,
    "parent_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "description_html" TEXT,
    "state" VARCHAR(32) NOT NULL,
    "priority" VARCHAR(32) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "point" DECIMAL(5,2),
    "sequence_id" BIGINT,
    "sort_order" DECIMAL(20,10) NOT NULL,
    "start_date" DATE,
    "target_date" DATE,
    "assignees_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_identifier_key" ON "project"("identifier");

-- CreateIndex
CREATE INDEX "issue_project_id_idx" ON "issue"("project_id");

-- CreateIndex
CREATE INDEX "issue_sprint_id_idx" ON "issue"("sprint_id");

-- CreateIndex
CREATE INDEX "issue_parent_id_idx" ON "issue"("parent_id");

-- AddForeignKey
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
