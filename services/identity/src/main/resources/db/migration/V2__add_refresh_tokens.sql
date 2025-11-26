-- Add refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,           -- logical FK -> users.id
  token_hash     TEXT NOT NULL UNIQUE,    -- SHA-256 hash of refresh token for fast lookup
  org_id         UUID,                    -- nullable - org context for the token
  expires_at     TIMESTAMPTZ NOT NULL,    -- expiration timestamp
  revoked        BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at   TIMESTAMPTZ,
  user_agent     TEXT,                    -- optional: track device/browser
  ip_address     TEXT                     -- optional: track IP for security
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at) WHERE NOT revoked;

-- Clean up expired and revoked tokens periodically (manual or scheduled job)
-- DELETE FROM refresh_tokens WHERE revoked = TRUE OR expires_at < now() - interval '7 days';
