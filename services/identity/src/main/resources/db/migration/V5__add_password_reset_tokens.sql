-- Add password reset tokens table for forgot password flow
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,           -- logical FK -> users.id
  token_hash     TEXT NOT NULL UNIQUE,    -- SHA-256 hash of reset token
  expires_at     TIMESTAMPTZ NOT NULL,    -- expiration timestamp (default 1 hour)
  used_at        TIMESTAMPTZ,             -- when token was used (null if unused)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens (expires_at) WHERE used_at IS NULL;

-- Rate limiting: find pending tokens for user
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_pending ON password_reset_tokens (user_id, expires_at) WHERE used_at IS NULL;
