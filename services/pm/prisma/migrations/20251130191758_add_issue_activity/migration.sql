-- CreateTable
CREATE TABLE "issue_activity" (
    "id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "field" VARCHAR(100) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "old_identifier" VARCHAR(255),
    "new_identifier" VARCHAR(255),
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_activity_issue_id_idx" ON "issue_activity"("issue_id");

-- CreateIndex
CREATE INDEX "issue_activity_project_id_idx" ON "issue_activity"("project_id");

-- CreateIndex
CREATE INDEX "issue_activity_actor_id_idx" ON "issue_activity"("actor_id");

-- CreateIndex
CREATE INDEX "issue_activity_created_at_idx" ON "issue_activity"("created_at");

-- AddForeignKey
ALTER TABLE "issue_activity" ADD CONSTRAINT "issue_activity_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_activity" ADD CONSTRAINT "issue_activity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
