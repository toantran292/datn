-- Add email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,           -- logical FK -> users.id
  token_hash     TEXT NOT NULL UNIQUE,    -- SHA-256 hash of verification token
  expires_at     TIMESTAMPTZ NOT NULL,    -- expiration timestamp (default 24 hours)
  verified_at    TIMESTAMPTZ,             -- when token was used (null if unused)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON email_verification_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_pending ON email_verification_tokens (user_id, expires_at) WHERE verified_at IS NULL;

-- Add email_verified_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create index for filtering verified users
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users (email_verified_at) WHERE email_verified_at IS NOT NULL;
