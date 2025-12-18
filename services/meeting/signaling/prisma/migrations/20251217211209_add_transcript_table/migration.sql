-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "speakerName" TEXT,
    "originalText" TEXT NOT NULL,
    "originalLang" TEXT,
    "translatedText" TEXT,
    "translatedLang" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isFinal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transcript_meetingId_idx" ON "Transcript"("meetingId");

-- CreateIndex
CREATE INDEX "Transcript_speakerId_idx" ON "Transcript"("speakerId");

-- CreateIndex
CREATE INDEX "Transcript_startTime_idx" ON "Transcript"("startTime");
