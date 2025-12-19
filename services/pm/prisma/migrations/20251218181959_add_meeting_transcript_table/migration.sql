-- AlterTable
ALTER TABLE "issue" ADD COLUMN     "meeting_context" TEXT,
ADD COLUMN     "meeting_order" INTEGER,
ADD COLUMN     "meeting_transcript_id" UUID;

-- CreateTable
CREATE TABLE "meeting_transcript" (
    "id" UUID NOT NULL,
    "org_id" VARCHAR(255) NOT NULL,
    "project_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "transcript" TEXT NOT NULL,
    "source_type" VARCHAR(20) NOT NULL,
    "source_url" VARCHAR(500),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "meeting_transcript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_transcript_project_id_idx" ON "meeting_transcript"("project_id");

-- CreateIndex
CREATE INDEX "meeting_transcript_org_id_idx" ON "meeting_transcript"("org_id");

-- CreateIndex
CREATE INDEX "meeting_transcript_created_by_idx" ON "meeting_transcript"("created_by");

-- CreateIndex
CREATE INDEX "issue_meeting_transcript_id_idx" ON "issue"("meeting_transcript_id");

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_meeting_transcript_id_fkey" FOREIGN KEY ("meeting_transcript_id") REFERENCES "meeting_transcript"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_transcript" ADD CONSTRAINT "meeting_transcript_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
