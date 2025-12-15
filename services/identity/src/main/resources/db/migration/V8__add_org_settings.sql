-- Add settings fields to organizations table for UC07
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;

-- LLM provider for AI reports (UC16)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(20);

-- Settings as JSONB for flexibility
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Comment on settings structure
COMMENT ON COLUMN organizations.settings IS 'JSON settings: {maxFileSizeMb, storageLimitGb, allowedFileTypes[], features: {aiReports, etc}}';
