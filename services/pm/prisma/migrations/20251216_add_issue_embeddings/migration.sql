-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to issue table
ALTER TABLE "issue"
ADD COLUMN IF NOT EXISTS "embedding" TEXT,
ADD COLUMN IF NOT EXISTS "embedding_updated_at" TIMESTAMPTZ;

-- Create vector index for similarity search
-- Using ivfflat for datasets < 100K issues
-- If you have > 100K issues, consider using hnsw instead
CREATE INDEX IF NOT EXISTS "issue_embedding_idx"
ON "issue"
USING ivfflat (CAST("embedding" AS vector(1536)) vector_cosine_ops)
WITH (lists = 100);
