-- CreateTable
CREATE TABLE "issue_comment" (
    "id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "comment" TEXT,
    "comment_html" TEXT,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "issue_comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_comment_issue_id_idx" ON "issue_comment"("issue_id");

-- CreateIndex
CREATE INDEX "issue_comment_project_id_idx" ON "issue_comment"("project_id");

-- CreateIndex
CREATE INDEX "issue_comment_created_by_idx" ON "issue_comment"("created_by");

-- AddForeignKey
ALTER TABLE "issue_comment" ADD CONSTRAINT "issue_comment_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_comment" ADD CONSTRAINT "issue_comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
