-- Add display_name field to users table
-- This allows users to have a human-readable name instead of just email

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Set default display_name from email (part before @)
-- For existing users
UPDATE users
  SET display_name = SPLIT_PART(email, '@', 1)
  WHERE display_name IS NULL;

-- Add comment
COMMENT ON COLUMN users.display_name IS 'Human-readable display name for the user';

