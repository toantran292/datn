-- Add profile fields to users table for UC05
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_asset_id UUID;

-- Index for avatar lookup (for file-storage service integration)
CREATE INDEX IF NOT EXISTS idx_users_avatar_asset ON users (avatar_asset_id) WHERE avatar_asset_id IS NOT NULL;
