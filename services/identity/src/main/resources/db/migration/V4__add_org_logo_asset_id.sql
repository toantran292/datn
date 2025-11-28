-- Add logo_asset_id column to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS logo_asset_id TEXT;

-- Add index for logo_asset_id lookups (optional, but useful if we need to query by asset ID)
CREATE INDEX IF NOT EXISTS idx_organizations_logo_asset_id ON organizations(logo_asset_id)
  WHERE logo_asset_id IS NOT NULL;

